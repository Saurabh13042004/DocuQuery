import re

_UNSAFE = re.compile(r"[^\w.\- ()\[\]]+")


def safe_filename(name: str | None, default: str = "document.pdf") -> str:
    """Base name only (no directories), unusual characters removed, capped at 150 chars."""
    base = (name or "").replace("\\", "/").rsplit("/", 1)[-1]
    base = _UNSAFE.sub("_", base).strip(" ._")
    return base[:150] or default
