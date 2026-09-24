"""
PDF text-replacement engine.

Replaces text in a PDF while keeping the look of the surrounding page:

* Matching is character-level (``rawdict``), so text is found across spans,
  bold/regular runs and wrapped lines, and tolerates ligatures, NBSP, soft
  hyphens, curly quotes and case differences.
* Only the matched characters are touched. The old glyphs are *removed* via a
  redaction (no white box, background art is preserved, and the old text is gone
  from the text layer).
* The replacement is drawn with a font that actually covers every new character:
  an embedded subset that has the glyphs, then the same face if it is
  installed/base-14, then a family-matched base-14 font, then bundled DejaVu.
* Size, colour, opacity, baseline and text direction come from the original span.
* Width changes are absorbed: text that follows on the same line is shifted
  (per glyph, so justification/kerning survive), or the new text is squeezed
  horizontally (never below ``MIN_SCALE``); anything that still won't fit is
  reported as a warning instead of silently overlapping.

This module only depends on PyMuPDF so it can be tested in isolation.
"""
from __future__ import annotations

import bisect
import logging
import math
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

import pymupdf as fitz

log = logging.getLogger(__name__)

FONTS_DIR = Path(__file__).resolve().parent.parent.parent / "fonts"

MIN_SCALE = 0.85        # narrowest horizontal squeeze we allow for new text
PAGE_MARGIN = 18.0      # pt kept free at the right page edge when text grows
COLUMN_GAP = 1.0        # a gap wider than this many font sizes starts a new "column"


# ---------------------------------------------------------------------------
# Font metadata helpers
# ---------------------------------------------------------------------------

_BOLD_RE = re.compile(r"bold|black|heavy|demi")
_ITALIC_RE = re.compile(r"italic|oblique|-it$|-it\b")
_MONO_RE = re.compile(r"cour|mono|consol|menlo|typewriter|fixed")
_SANS_RE = re.compile(
    r"sans|arial|helvet|calibri|verdana|tahoma|segoe|roboto|lato|gothic|futura|myriad|univers|"
    r"frutiger|montserrat|poppins|ubuntu"
)
_SERIF_RE = re.compile(
    r"times|serif|georgia|garamond|palatino|cambria|minion|bookman|century|roman|"
    r"cmr|cmbx|cmti|cmsl|charter|didot|baskerville"
)

_BASE14 = {
    ("sans", False, False): "Helvetica",
    ("sans", True, False): "Helvetica-Bold",
    ("sans", False, True): "Helvetica-Oblique",
    ("sans", True, True): "Helvetica-BoldOblique",
    ("serif", False, False): "Times-Roman",
    ("serif", True, False): "Times-Bold",
    ("serif", False, True): "Times-Italic",
    ("serif", True, True): "Times-BoldItalic",
    ("mono", False, False): "Courier",
    ("mono", True, False): "Courier-Bold",
    ("mono", False, True): "Courier-Oblique",
    ("mono", True, True): "Courier-BoldOblique",
}


def _strip_subset(name: str) -> str:
    """'ABCDEF+Arial-BoldMT' -> 'Arial-BoldMT'."""
    return name.split("+")[-1] if name else ""


def _norm_font(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", _strip_subset(name).lower())


def _detect_font_style(span: dict) -> tuple[str, bool, bool]:
    """
    Bold/italic from PyMuPDF's flags bitmask (bit 1 = italic, bit 4 = bold),
    backed up by the font name for fonts that don't set the flags.
    """
    flags = span.get("flags", 0)
    font_name = span.get("font", "")
    lower = _strip_subset(font_name).lower()
    is_bold = bool(flags & 16) or bool(_BOLD_RE.search(lower))
    is_italic = bool(flags & 2) or bool(_ITALIC_RE.search(lower))
    return font_name, is_bold, is_italic


def _font_family(font_name: str, flags: int = 0) -> str:
    """'mono' | 'serif' | 'sans' from font-descriptor flags (8 = mono, 4 = serif) and name."""
    n = _strip_subset(font_name).lower()
    if flags & 8 or _MONO_RE.search(n):
        return "mono"
    if _SANS_RE.search(n):
        return "sans"
    if flags & 4 or _SERIF_RE.search(n):
        return "serif"
    return "sans"


def _color_to_rgb(color_val) -> tuple:
    if isinstance(color_val, int):
        if color_val == 0:
            return (0, 0, 0)
        r = (color_val >> 16) & 0xff
        g = (color_val >> 8) & 0xff
        b = color_val & 0xff
        return (r / 255, g / 255, b / 255)
    return color_val if color_val else (0, 0, 0)


_base14_cache: dict[str, fitz.Font] = {}


def _base14_font(name: str) -> fitz.Font:
    if name not in _base14_cache:
        _base14_cache[name] = fitz.Font(name)
    return _base14_cache[name]


def _resolve_font(font_name: str, is_bold: bool, is_italic: bool, family: str | None = None) -> str:
    """
    Name of the best font PyMuPDF can create for ``font_name``: the font itself if it is
    available, otherwise the base-14 face matching family (serif/sans/mono) and style.
    """
    clean = _strip_subset(font_name)
    for name in (clean, clean.replace(" ", "")):
        if not name:
            continue
        try:
            fitz.Font(name)
            return name
        except Exception:
            pass
    family = family or _font_family(font_name)
    return _BASE14[(family, bool(is_bold), bool(is_italic))]


_dejavu_cache: dict[tuple[bool, bool], fitz.Font | None] = {}


def _dejavu_font(is_bold: bool, is_italic: bool) -> fitz.Font | None:
    """Bundled DejaVu Serif Condensed: wide Unicode coverage (Greek, Cyrillic, ₹, …)."""
    key = (bool(is_bold), bool(is_italic))
    if key not in _dejavu_cache:
        suffix = {(False, False): "", (True, False): "-Bold",
                  (False, True): "-Italic", (True, True): "-BoldItalic"}[key]
        path = FONTS_DIR / f"DejaVuSerifCondensed{suffix}.ttf"
        font = None
        if path.exists():
            try:
                font = fitz.Font(fontfile=str(path))
            except Exception as e:
                log.warning("could not load %s: %s", path, e)
        _dejavu_cache[key] = font
    return _dejavu_cache[key]


def _covers(font: fitz.Font, text: str) -> bool:
    """True if ``font`` has a glyph for every visible character in ``text``."""
    try:
        return all(ch.isspace() or font.has_glyph(ord(ch)) for ch in text)
    except Exception:
        return False


def _extract_embedded_font(doc: fitz.Document, page: fitz.Page, font_name: str):
    """First usable embedded font on ``page`` matching ``font_name`` (subset prefix ignored)."""
    if not font_name:
        return None
    target = _norm_font(font_name)
    try:
        for f in doc.get_page_fonts(page.number, full=True):
            xref, basefont, alias = f[0], f[3], f[4]
            if target in (_norm_font(basefont), _norm_font(alias)):
                buf = doc.extract_font(xref)[3]
                if buf:
                    return fitz.Font(fontbuffer=buf)
    except Exception as e:
        log.debug("embedded font extraction failed for %s: %s", font_name, e)
    return None


@dataclass
class _Face:
    font: fitz.Font
    label: str
    exact: bool         # True when this is the original face, False for a substitute


class _FontBook:
    """Per-document font lookup with caching."""

    def __init__(self, doc: fitz.Document):
        self.doc = doc
        self._index: dict[str, list[int]] | None = None
        self._embedded: dict[str, list[fitz.Font]] = {}

    def _xrefs(self, key: str) -> list[int]:
        if self._index is None:
            self._index = {}
            seen: set[int] = set()
            for pno in range(self.doc.page_count):
                for f in self.doc.get_page_fonts(pno, full=True):
                    xref = f[0]
                    if xref in seen:
                        continue
                    seen.add(xref)
                    for label in (f[3], f[4]):
                        bucket = self._index.setdefault(_norm_font(label), [])
                        if xref not in bucket:
                            bucket.append(xref)
        return self._index.get(key, [])

    def embedded(self, font_name: str) -> list[fitz.Font]:
        """Every embedded subset of ``font_name`` in the document (a face is often split
        into several subsets, each with a different glyph set)."""
        key = _norm_font(font_name)
        if not key:
            return []
        if key not in self._embedded:
            fonts = []
            for xref in self._xrefs(key):
                try:
                    buf = self.doc.extract_font(xref)[3]
                    if buf:
                        fonts.append(fitz.Font(fontbuffer=buf))
                except Exception:
                    continue
            self._embedded[key] = fonts
        return self._embedded[key]

    def choose(self, font_name: str, flags: int, text: str, existing_only: bool = False) -> _Face | None:
        """Pick a font able to render ``text`` in the style of ``font_name``."""
        for f in self.embedded(font_name):
            if _covers(f, text):
                return _Face(f, font_name, True)

        clean = _strip_subset(font_name)
        if clean:
            try:
                f = fitz.Font(clean)          # base-14 / installed by exact name
                if _covers(f, text):
                    return _Face(f, clean, True)
            except Exception:
                pass
        if existing_only:
            return None

        _, bold, italic = _detect_font_style({"font": font_name, "flags": flags})
        family = _font_family(font_name, flags)
        base = _BASE14[(family, bold, italic)]
        f = _base14_font(base)
        if _covers(f, text):
            return _Face(f, base, False)
        dv = _dejavu_font(bold, italic)
        if dv is not None and _covers(dv, text):
            return _Face(dv, "DejaVu Serif Condensed", False)
        return _Face(f, base, False)          # MuPDF will fall back per-glyph


# ---------------------------------------------------------------------------
# Text model + matching
# ---------------------------------------------------------------------------

_PUNCT = str.maketrans({
    "‘": "'", "’": "'", "‚": "'", "′": "'",
    "“": '"', "”": '"', "„": '"',
    "‐": "-", "‑": "-", "‒": "-", "–": "-", "—": "-", "−": "-",
})


def _norm_items(items):
    """Normalise (text, key) items for matching; returns (string, keys aligned to string)."""
    out: list[str] = []
    keys: list = []
    for text, key in items:
        for ch in unicodedata.normalize("NFKC", text):
            ch = ch.translate(_PUNCT)
            if ch == "­":                       # soft hyphen
                continue
            if ch.isspace():
                if out and out[-1] == " ":
                    continue
                out.append(" ")
                keys.append(key)
                continue
            for cf in ch.casefold():
                out.append(cf)
                keys.append(key)
    return "".join(out), keys


def _norm(text: str) -> str:
    return _norm_items([(text, None)])[0].strip()


def _loose(text: str) -> str:
    """_norm without hyphens or spaces, for verifying output re-extracted from a PDF."""
    return re.sub(r"[\s\-]", "", _norm(text))


@dataclass
class _Char:
    c: str
    x0: float
    y0: float
    x1: float
    y1: float
    ox: float
    oy: float
    span: dict

    @property
    def size(self) -> float:
        return float(self.span.get("size", 12) or 12)


@dataclass
class _Line:
    chars: list[_Char]
    dir: tuple[float, float]
    block_x1: float

    @property
    def horizontal(self) -> bool:
        return abs(self.dir[1]) < 0.01 and self.dir[0] > 0

    @property
    def x1(self) -> float:
        return max(ch.x1 for ch in self.chars)

    @property
    def y0(self) -> float:
        return min(ch.y0 for ch in self.chars)

    @property
    def y1(self) -> float:
        return max(ch.y1 for ch in self.chars)


def _read_blocks(page: fitz.Page) -> list[list[_Line]]:
    blocks: list[list[_Line]] = []
    for b in page.get_text("rawdict")["blocks"]:
        if b.get("type") != 0:
            continue
        lines: list[_Line] = []
        for l in b.get("lines", []):
            chars: list[_Char] = []
            for s in l.get("spans", []):
                meta = {k: v for k, v in s.items() if k != "chars"}
                for c in s.get("chars", []):
                    bb, org = c["bbox"], c["origin"]
                    chars.append(_Char(c["c"], bb[0], bb[1], bb[2], bb[3], org[0], org[1], meta))
            if chars:
                lines.append(_Line(chars, tuple(l.get("dir", (1.0, 0.0))), b["bbox"][2]))
        if lines:
            blocks.append(lines)
    return _merge_same_baseline(blocks)


def _merge_same_baseline(blocks: list[list[_Line]]) -> list[list[_Line]]:
    """
    MuPDF often reports one visual line as several lines/blocks: text drawn as separate text
    objects (which is also what an edit produces) or in different stream order. Re-join
    fragments that sit on the same baseline with only a word-sized gap between them, so text
    can still be matched after a previous edit.
    """
    entries = [(line, bi) for bi, b in enumerate(blocks) for line in b if line.horizontal]
    entries.sort(key=lambda e: e[0].chars[0].oy)
    dead: set[int] = set()
    i = 0
    while i < len(entries):
        j = i
        while j + 1 < len(entries) and abs(entries[j + 1][0].chars[0].oy - entries[i][0].chars[0].oy) <= 0.6:
            j += 1
        row = sorted((e[0] for e in entries[i:j + 1]), key=lambda ln: min(ch.x0 for ch in ln.chars))
        left = row[0]
        for nxt in row[1:]:
            gap = min(ch.x0 for ch in nxt.chars) - left.x1
            size = left.chars[-1].size
            if -0.5 * size <= gap <= COLUMN_GAP * size:
                left.chars.extend(nxt.chars)
                left.block_x1 = max(left.block_x1, nxt.block_x1)
                dead.add(id(nxt))
            else:
                left = nxt
        i = j + 1
    merged = [[ln for ln in b if id(ln) not in dead] for b in blocks]
    return [b for b in merged if b]


def _is_phantom(chars: list[_Char], j: int) -> bool:
    """MuPDF reports a ligature glyph as a carrier char followed by 'phantom' chars, which share
    the origin of the next real char. A char followed by one with the identical origin is such
    a phantom (adjacent normal glyphs never share an origin)."""
    if j + 1 >= len(chars) or chars[j].c.isspace() or chars[j + 1].c.isspace():
        return False
    return abs(chars[j + 1].ox - chars[j].ox) < 0.05 and abs(chars[j + 1].oy - chars[j].oy) < 0.05


def _glyph_groups(chars: list[_Char], idxs: list[int]) -> list[list[int]]:
    """Group char indexes into glyphs: [carrier, phantom, ...] for ligatures, else singletons."""
    wanted = set(idxs)
    groups: list[list[int]] = []
    skip: set[int] = set()
    for i in idxs:
        if i in skip:
            continue
        group = [i]
        j = i + 1
        while j in wanted and _is_phantom(chars, j):
            group.append(j)
            skip.add(j)
            j += 1
        groups.append(group)
    return groups


@dataclass
class _Edit:
    a: int              # first char index in the line
    b: int              # last char index in the line (inclusive)
    piece: str          # text that replaces chars[a..b]


@dataclass
class EditReport:
    replacements: int = 0
    pages: list[int] = field(default_factory=list)      # 1-based page numbers
    warnings: list[str] = field(default_factory=list)

    def warn(self, msg: str) -> None:
        if msg not in self.warnings:
            self.warnings.append(msg)


def _is_word_match(hay: str, pos: int, n: int) -> bool:
    """The match must not be glued to more letters/digits ("Ann" must not hit "Annual")."""
    before = hay[pos - 1] if pos > 0 else " "
    after = hay[pos + n] if pos + n < len(hay) else " "
    start_ok = not (hay[pos].isalnum() and before.isalnum())
    end_ok = not (hay[pos + n - 1].isalnum() and after.isalnum())
    return start_ok and end_ok


def _find_matches(lines: list[_Line], needle: str, whole_word: bool = True):
    """Yield matches in one block; each match is a list of (line_idx, first_char, last_char)."""
    items = []
    for li, line in enumerate(lines):
        if li:
            items.append((" ", None))
        items.extend((ch.c, (li, ci)) for ci, ch in enumerate(line.chars))
    hay, keys = _norm_items(items)

    pos = hay.find(needle)
    while pos != -1:
        spans: dict[int, list[int]] = {}
        for key in keys[pos:pos + len(needle)]:
            if key is None:
                continue
            li, ci = key
            lo_hi = spans.setdefault(li, [ci, ci])
            lo_hi[0], lo_hi[1] = min(lo_hi[0], ci), max(lo_hi[1], ci)
        if spans and (not whole_word or _is_word_match(hay, pos, len(needle))):
            yield [(li, lo, hi) for li, (lo, hi) in sorted(spans.items())]
        pos = hay.find(needle, pos + len(needle))


def _match_case(actual: str, new: str) -> str:
    """ALL-CAPS original + all-lowercase replacement -> upper-case the replacement.
    Anything else is left exactly as the caller wrote it."""
    letters = [ch for ch in actual if ch.isalpha()]
    if len(letters) >= 2 and all(ch.isupper() for ch in letters) and not any(ch.isupper() for ch in new):
        return new.upper()
    return new


def _trim_common(actual: str, new: str) -> tuple[int, int] | None:
    """
    Leading/trailing whole words that are identical in ``actual`` and ``new`` can keep their
    original glyphs (and styling). Returns (prefix_len, suffix_len) to leave untouched, or
    None when nothing would be left to edit on the ``actual`` side.
    """
    limit = min(len(actual), len(new))
    p = 0
    while p < limit and actual[p] == new[p]:
        p += 1
    while p and not actual[p - 1].isspace():          # prefix must end after a space
        p -= 1
    q = 0
    while q < limit - p and actual[len(actual) - 1 - q] == new[len(new) - 1 - q]:
        q += 1
    while q and not actual[len(actual) - q - 1].isspace():   # suffix must start a word
        q -= 1
    if p + q >= len(actual):
        return (0, 0)
    return p, q


# ---------------------------------------------------------------------------
# Planning + drawing
# ---------------------------------------------------------------------------

@dataclass
class _NewText:
    origin: fitz.Point
    text: str
    face: _Face
    size: float
    color: tuple
    alpha: float | None
    scale: float                       # horizontal squeeze
    dir: tuple[float, float]


@dataclass
class _MovedChar:
    origin: fitz.Point
    text: str
    face: _Face
    size: float
    color: tuple
    alpha: float | None


@dataclass
class _Plan:
    rects: list[fitz.Rect] = field(default_factory=list)
    new_text: list[_NewText] = field(default_factory=list)
    moved: list[_MovedChar] = field(default_factory=list)


def _redact_rect(chars: list[_Char]) -> fitz.Rect:
    """Union of the chars' boxes, inset so neighbouring glyphs / lines are not caught."""
    r = fitz.Rect(chars[0].x0, chars[0].y0, chars[0].x1, chars[0].y1)
    for ch in chars[1:]:
        r |= fitz.Rect(ch.x0, ch.y0, ch.x1, ch.y1)
    dx = 0.3 if r.width > 1.0 else 0.0
    return fitz.Rect(r.x0 + dx, r.y0 + 0.2 * r.height, r.x1 - dx, r.y1 - 0.2 * r.height)


def _alpha(span: dict) -> float | None:
    a = span.get("alpha")
    if isinstance(a, (int, float)) and 0 <= a < 255:
        return a / 255
    return None


class _PageEditor:
    def __init__(self, doc: fitz.Document, page: fitz.Page, fonts: _FontBook, report: EditReport,
                 all_lines: list[_Line]):
        self.doc, self.page, self.fonts, self.report = doc, page, fonts, report
        self.all_lines = all_lines
        unrot = page.rect * page.derotation_matrix
        self.page_right = max(unrot.x0, unrot.x1)
        self.right_limit = self.page_right - PAGE_MARGIN

    def _obstacle_x(self, line: _Line, from_x: float) -> float:
        """Left edge of the nearest text (in another line/block) to the right of ``from_x`` that
        sits on the same visual row, e.g. the neighbouring column."""
        y0, y1 = line.y0, line.y1
        height = max(y1 - y0, 1.0)
        nearest = math.inf
        for other in self.all_lines:
            if other is line:
                continue
            overlap = min(y1, other.y1) - max(y0, other.y0)
            if overlap < 0.5 * height:
                continue
            ox0 = min(ch.x0 for ch in other.chars)
            if ox0 >= from_x - 0.5:
                nearest = min(nearest, ox0)
        return nearest

    # -- fonts ---------------------------------------------------------------

    def _face(self, span: dict, text: str) -> _Face:
        face = self.fonts.choose(span.get("font", ""), span.get("flags", 0), text)
        if not face.exact and text.strip():
            self.report.warn(
                "The PDF's original font can't draw the new text (its embedded copy only contains "
                f"the letters the PDF already used), so a matching standard font ('{face.label}') "
                "was used for the new text."
            )
        return face

    # -- planning ------------------------------------------------------------

    def plan_line(self, line: _Line, edits: list[_Edit]) -> _Plan:
        plan = _Plan()
        chars = line.chars
        edits = sorted(edits, key=lambda e: e.a)

        if not line.horizontal:                           # rotated / vertical text: replace in place
            for e in edits:
                first = chars[e.a]
                plan.rects.append(_redact_rect(chars[e.a:e.b + 1]))
                if e.piece:
                    plan.new_text.append(_NewText(
                        fitz.Point(first.ox, first.oy), e.piece, self._face(first.span, e.piece),
                        first.size, _color_to_rgb(first.span.get("color", 0)), _alpha(first.span),
                        1.0, line.dir))
            return plan

        # split into column runs (big gaps start a new run); never split inside an edit
        inside_edit = set()
        for e in edits:
            inside_edit.update(range(e.a + 1, e.b + 1))
        runs, start = [], 0
        for i in range(1, len(chars)):
            if i in inside_edit:
                continue
            if chars[i].x0 - chars[i - 1].x1 > COLUMN_GAP * chars[i - 1].size:
                runs.append((start, i - 1))
                start = i
        runs.append((start, len(chars) - 1))

        for ri, (rs, re_) in enumerate(runs):
            run_edits = [e for e in edits if rs <= e.a <= re_]
            if run_edits:
                self._plan_run(plan, line, chars, run_edits, rs, re_, runs, ri)
        return plan

    def _plan_run(self, plan, line, chars, run_edits, rs, re_, runs, ri):
        last_run = ri == len(runs) - 1
        run_end = chars[re_].x1
        R_edge = max(line.x1, self.right_limit)
        if last_run:
            R = max(min(R_edge, self._obstacle_x(line, run_end) - 0.25 * chars[re_].size), run_end)
        else:
            R = chars[runs[ri + 1][0]].x0 - 0.25 * chars[re_].size

        matched = set()
        for e in run_edits:
            matched.update(range(e.a, e.b + 1))
        first_a = run_edits[0].a
        moving = [i for i in range(first_a, re_ + 1) if i not in matched]

        # can the following text be re-drawn (shifted) in its own font?
        moved_faces: dict[int, _Face] = {}
        can_shift = True
        by_span: dict[int, list[int]] = {}
        for i in moving:
            by_span.setdefault(id(chars[i].span), []).append(i)
        for idxs in by_span.values():
            span = chars[idxs[0]].span
            face = self.fonts.choose(span.get("font", ""), span.get("flags", 0),
                                     "".join(chars[i].c for i in idxs), existing_only=True)
            if face is None:
                can_shift = False
                break
            for i in idxs:
                moved_faces[i] = face

        # measure old / new widths
        faces, w_old, w_new = [], [], []
        for e in run_edits:
            first = chars[e.a]
            face = self._face(first.span, e.piece)
            faces.append(face)
            w_old.append(chars[e.b].x1 - first.ox)
            w_new.append(face.font.text_length(e.piece, fontsize=first.size) if e.piece else 0.0)

        # decide squeeze
        scales = [1.0] * len(run_edits)
        overflow = False
        if can_shift:
            extra = max(R - run_end, 0.0)
            sum_old, sum_new = sum(w_old), sum(w_new)
            if sum_new - sum_old > extra and sum_new > 0:
                s = max((sum_old + extra) / sum_new, MIN_SCALE)
                scales = [s] * len(run_edits)
            final_end = run_end + sum(wn * s - wo for wn, s, wo in zip(w_new, scales, w_old))
            overflow = final_end > R + 0.5
        else:
            for k, e in enumerate(run_edits):
                nxt = next((i for i in range(e.b + 1, re_ + 1) if i not in matched), None)
                limit = chars[nxt].x0 if nxt is not None else R
                room = max(limit - chars[e.a].ox, 0.0)
                if w_new[k] > room > 0:
                    scales[k] = max(room / w_new[k], MIN_SCALE)
                if w_new[k] * scales[k] > room + 0.5:
                    overflow = True

        # right-aligned single-run text (e.g. a date column): keep the right edge fixed
        anchor_right = False
        if (len(run_edits) == 1 and last_run and run_edits[0].a == rs and run_edits[0].b == re_
                and run_end >= R_edge - 3.0 and w_new[0] > 0):
            prev_end = chars[rs - 1].x1 + 0.25 * chars[rs].size if rs > 0 else 0.0
            room = run_end - prev_end
            s = min(1.0, room / w_new[0]) if w_new[0] > room else 1.0
            scales = [max(s, MIN_SCALE)]
            overflow = w_new[0] * scales[0] > room + 0.5
            anchor_right = True

        if overflow:
            self.report.warn(
                "The new text is wider than the space available on its line, so it may overlap "
                "nearby text.")

        # positions
        room_right = max(R - run_end, 0.0)      # how far the following text may move right
        dx = 0.0
        shifts: list[tuple[int, float]] = []      # (edit end index, cumulative dx after edit)
        for k, e in enumerate(run_edits):
            first = chars[e.a]
            width = w_new[k] * scales[k]
            start_x = chars[e.b].x1 - width if anchor_right else first.ox + dx
            plan.rects.append(_redact_rect(chars[e.a:e.b + 1]))
            if e.piece:
                plan.new_text.append(_NewText(
                    fitz.Point(start_x, first.oy), e.piece, faces[k], first.size,
                    _color_to_rgb(first.span.get("color", 0)), _alpha(first.span),
                    scales[k], line.dir))
            if not anchor_right:
                dx += width - w_old[k]
                if can_shift:
                    dx = min(dx, room_right)
            shifts.append((e.b, dx))
            if start_x + width > self.page_right + 0.5:
                self.report.warn("The new text runs past the edge of the page and is partly cut off.")

        # shift the text that follows
        if can_shift and moving and any(abs(d) > 0.01 for _, d in shifts):
            ends = [b for b, _ in shifts]
            plan.rects.append(_redact_rect(chars[first_a:re_ + 1]))
            for group in _glyph_groups(chars, moving):
                ch = chars[group[0]]
                if ch.c.isspace():
                    continue
                shift = shifts[bisect.bisect_right(ends, group[0]) - 1][1]
                face = moved_faces[group[0]]
                # A ligature is drawn as its plain letters from the carrier's origin: the widths
                # are near-identical and the text layer keeps saying "fl", not "ﬂ".
                plan.moved.append(_MovedChar(
                    fitz.Point(ch.ox + shift, ch.oy), "".join(chars[i].c for i in group), face,
                    ch.size, _color_to_rgb(ch.span.get("color", 0)), _alpha(ch.span)))

    # -- drawing -------------------------------------------------------------

    def _new_writer(self) -> fitz.TextWriter:
        return fitz.TextWriter(self.page.rect)

    def apply(self, plans: list[_Plan]) -> None:
        page = self.page
        for plan in plans:
            for r in plan.rects:
                page.add_redact_annot(r, fill=False)
        kwargs = {"images": fitz.PDF_REDACT_IMAGE_NONE}
        if hasattr(fitz, "PDF_REDACT_LINE_ART_NONE"):
            kwargs["graphics"] = fitz.PDF_REDACT_LINE_ART_NONE
        page.apply_redactions(**kwargs)

        for plan in plans:
            for nt in plan.new_text:
                self._draw_new(nt)
            grouped: dict[tuple, fitz.TextWriter] = {}
            for mc in plan.moved:
                tw = grouped.get((mc.color, mc.alpha))
                if tw is None:
                    tw = grouped[(mc.color, mc.alpha)] = self._new_writer()
                tw.append(mc.origin, mc.text, font=mc.face.font, fontsize=mc.size)
            for (color, alpha), tw in grouped.items():
                tw.write_text(page, color=color, opacity=alpha)

    def _draw_new(self, nt: _NewText) -> None:
        tw = self._new_writer()
        tw.append(nt.origin, nt.text, font=nt.face.font, fontsize=nt.size)
        morph = None
        dx, dy = nt.dir
        if abs(dy) > 0.01 or dx < 0:                     # rotated line
            morph = (nt.origin, fitz.Matrix(dx, dy, -dy, dx, 0, 0))
        elif abs(nt.scale - 1.0) > 1e-3:
            morph = (nt.origin, fitz.Matrix(nt.scale, 0, 0, 1, 0, 0))
        tw.write_text(self.page, color=nt.color, opacity=nt.alpha, morph=morph)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _distribute(pieces_src: str, capacities: list[float], font: fitz.Font, size: float) -> list[str]:
    """Greedy word-wrap of ``pieces_src`` into segments of the given widths (last takes the rest)."""
    words = pieces_src.split()
    out: list[str] = []
    for cap in capacities[:-1]:
        acc: list[str] = []
        while words:
            cand = " ".join(acc + [words[0]])
            if acc and font.text_length(cand, fontsize=size) > cap:
                break
            acc.append(words.pop(0))
        out.append(" ".join(acc))
    out.append(" ".join(words))
    return out


def _page_looks_scanned(page: fitz.Page) -> bool:
    try:
        area = page.rect.width * page.rect.height
        return any(fitz.Rect(i["bbox"]).get_area() >= 0.6 * area for i in page.get_image_info())
    except Exception:
        return False


def replace_text(doc: fitz.Document, original: str, new: str) -> EditReport:
    """
    Replace every occurrence of ``original`` with ``new`` in ``doc`` (in memory).
    Whole-word matches are preferred; if there are none, partial-word matches are used.
    """
    needle = _norm(original)
    if not needle:
        return EditReport()
    report = _replace(doc, needle, new, whole_word=True)
    if not report.replacements:
        report = _replace(doc, needle, new, whole_word=False)
    return report


def _replace(doc: fitz.Document, needle: str, new: str, whole_word: bool) -> EditReport:
    report = EditReport()
    fonts = _FontBook(doc)
    single_line_new = re.sub(r"\s*\n\s*", " ", new).strip()

    for page in doc:
        blocks = _read_blocks(page)
        editor = _PageEditor(doc, page, fonts, report, [ln for b in blocks for ln in b])
        per_line: dict[tuple[int, int], tuple[_Line, list[_Edit]]] = {}
        count = 0

        for bi, lines in enumerate(blocks):
            for match in _find_matches(lines, needle, whole_word):
                count += 1
                actual = " ".join(
                    "".join(ch.c for ch in lines[li].chars[a:b + 1]) for li, a, b in match)
                replacement = _match_case(actual, single_line_new)

                if len(match) == 1:
                    pieces = [replacement]
                else:
                    li0, a0, _ = match[0]
                    first = lines[li0].chars[a0]
                    face = editor._face(first.span, replacement)
                    caps = []
                    for li, a, b in match:
                        ln = lines[li]
                        w = ln.chars[b].x1 - ln.chars[a].ox
                        caps.append(w + max(ln.block_x1 - ln.x1, 0.0))
                    pieces = _distribute(replacement, caps, face.font, first.size)

                for (li, a, b), piece in zip(match, pieces):
                    if len(match) == 1:
                        p, q = _trim_common(actual, piece) or (0, 0)
                        a, b, piece = a + p, b - q, piece[p:len(piece) - q]
                    entry = per_line.setdefault((bi, li), (lines[li], []))
                    entry[1].append(_Edit(a, b, piece))

        if not count:
            continue

        plans = []
        for line, edits in per_line.values():
            try:
                plans.append(editor.plan_line(line, edits))
            except Exception as e:                      # never leave a half-edited line behind
                log.exception("planning failed for a line on page %s", page.number + 1)
                report.warn(f"One occurrence on page {page.number + 1} could not be edited ({e}).")
                count -= 1
        if plans:
            editor.apply(plans)
        if count:
            report.replacements += count
            report.pages.append(page.number + 1)
            if _page_looks_scanned(page):
                report.warn(
                    f"Page {page.number + 1} looks like a scanned image; only its text layer "
                    "was changed, the visible picture is unchanged.")
            if new.strip() and _loose(new) not in _loose(page.get_text()):
                report.warn(
                    f"Couldn't confirm the new text on page {page.number + 1}; please check "
                    "the result.")
    return report
