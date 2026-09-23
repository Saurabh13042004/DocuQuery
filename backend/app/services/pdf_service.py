import os
import boto3
import pymupdf as fitz
from dotenv import load_dotenv
from google import genai
from google.genai import types
from datetime import datetime
from pathlib import Path

from . import redis_service, vector_service

load_dotenv()

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ["AWS_ACCESS_KEY"],
    aws_secret_access_key=os.environ['AWS_SECRET_KEY'],
    region_name=os.environ['AWS_REGION']
)

_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-1.5-flash"
environment = os.environ['ENVIRONMENT']

print(f"PDF Service initialized in {environment} environment.")

# ---------------------------------------------------------------------------
# Agentic tool definitions
# ---------------------------------------------------------------------------

_SYSTEM_INSTRUCTION = """You are DocuQuery, an intelligent PDF document assistant.
You help users understand, query, and edit their PDF documents.

Rules:
- Use `answer_question` for any informational query about the document.
- Use `edit_pdf` when the user wants to change, replace, update, or modify text.
- Use `summarize` when the user asks for an overview or summary.
- Always base answers on the document context provided.
- When the context contains [Page N] markers, cite the page number naturally in your answer.
  Example: "According to page 3, the notice period is 30 days."
  If multiple pages are relevant, cite all of them.
- Be concise and helpful."""

_PDF_TOOLS = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="answer_question",
            description="Answer a question about the PDF document using its content.",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "response": {
                        "type": "string",
                        "description": "The answer to the user's question based on the document."
                    }
                },
                "required": ["response"]
            }
        ),
        types.FunctionDeclaration(
            name="edit_pdf",
            description="Replace specific text in the PDF. Use when user wants to change, update, or modify document content.",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "original_text": {
                        "type": "string",
                        "description": "The exact text to find and replace in the PDF."
                    },
                    "new_text": {
                        "type": "string",
                        "description": "The replacement text."
                    }
                },
                "required": ["original_text", "new_text"]
            }
        ),
        types.FunctionDeclaration(
            name="summarize",
            description="Summarize the PDF document or a section of it.",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "A clear and comprehensive summary of the document content."
                    }
                },
                "required": ["summary"]
            }
        )
    ]
)

# ---------------------------------------------------------------------------
# Font detection — uses PyMuPDF flags bitmask, no hardcoded map
# ---------------------------------------------------------------------------

def _detect_font_style(span: dict) -> tuple[str, bool, bool]:
    """
    Read bold/italic from PyMuPDF's flags bitmask.
    bit 1 (2)  = italic
    bit 4 (16) = bold
    """
    flags = span.get("flags", 0)
    font_name = span.get("font", "")
    is_bold = bool(flags & 16)
    is_italic = bool(flags & 2)
    return font_name, is_bold, is_italic


def _resolve_font(font_name: str, is_bold: bool, is_italic: bool) -> str:
    """
    Dynamically resolve the best available font for text insertion.
    Tests real availability via fitz.Font() instead of a static lookup map.
    """
    # Try the original font name and common variants
    candidates = [font_name]
    if font_name:
        candidates += [
            font_name.replace(" ", ""),
            font_name.split("-")[0],
        ]

    for name in candidates:
        if not name:
            continue
        try:
            fitz.Font(name)
            return name
        except Exception:
            pass

    # Fall back to standard PDF core fonts based on detected style flags
    if is_bold and is_italic:
        return "Helvetica-BoldOblique"
    elif is_bold:
        return "Helvetica-Bold"
    elif is_italic:
        return "Helvetica-Oblique"
    return "Helvetica"


def _color_to_rgb(color_val) -> tuple:
    if isinstance(color_val, int):
        if color_val == 0:
            return (0, 0, 0)
        r = (color_val >> 16) & 0xff
        g = (color_val >> 8) & 0xff
        b = color_val & 0xff
        return (r / 255, g / 255, b / 255)
    return color_val if color_val else (0, 0, 0)


def _extract_embedded_font(doc: fitz.Document, page: fitz.Page, font_name: str):
    """Extract an embedded font from the PDF by matching font name. Returns fitz.Font or None."""
    if not font_name:
        return None
    # Normalise: strip subset prefix "ABCDEF+FontName" -> "FontName" and lowercase for comparison
    def _norm(n: str) -> str:
        return n.split("+")[-1].lower() if n else ""

    target = _norm(font_name)
    try:
        page_fonts = doc.get_page_fonts(page.number, full=True)
        print(f"[font] looking for '{font_name}' (norm='{target}') among {[(_norm(f[3]), _norm(f[4])) for f in page_fonts]}")
        for f in page_fonts:
            xref, _ext, _ftype, basefont, alias, _enc, _ref = f
            if target in (_norm(basefont), _norm(alias)):
                extracted = doc.extract_font(xref)
                font_buffer = extracted[3]
                if font_buffer and len(font_buffer) > 0:
                    print(f"[font] embedded font found for '{font_name}' (xref={xref})")
                    return fitz.Font(fontbuffer=font_buffer)
                print(f"[font] xref={xref} matched but no buffer (type={extracted[2]})")
    except Exception as e:
        print(f"[font] extraction error: {e}")
    print(f"[font] no embedded font for '{font_name}', using fallback")
    return None

# ---------------------------------------------------------------------------
# Custom font registration (DejaVu fonts shipped with repo)
# ---------------------------------------------------------------------------

def _register_custom_fonts():
    try:
        fonts_dir = Path(__file__).parent.parent.parent / "fonts"
        mappings = {
            'DejaVuSerifCondensed': 'DejaVuSerifCondensed.ttf',
            'DejaVuSerifCondensed-Bold': 'DejaVuSerifCondensed-Bold.ttf',
            'DejaVuSerifCondensed-BoldItalic': 'DejaVuSerifCondensed-BoldItalic.ttf',
            'DejaVuSerifCondensed-Italic': 'DejaVuSerifCondensed-Italic.ttf',
        }
        for name, filename in mappings.items():
            path = fonts_dir / filename
            if path.exists():
                try:
                    fitz.Font(name, str(path))
                except Exception:
                    pass
    except Exception:
        pass


_register_custom_fonts()

# ---------------------------------------------------------------------------
# PDF file I/O
# ---------------------------------------------------------------------------

async def save_pdf(file) -> str:
    bucket_name = os.environ['AWS_BUCKET_NAME']
    region = os.environ['AWS_REGION']

    if environment == "production":
        file_key = f"pdfs/{file.filename}"
        await file.seek(0)
        s3_client.upload_fileobj(
            file.file, bucket_name, file_key,
            ExtraArgs={'ContentType': 'application/pdf'}
        )
        url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{file_key}"
        print(f"File uploaded to S3: {url}")
        return url
    else:
        os.makedirs('pdfs', exist_ok=True)
        location = f"pdfs/{file.filename}"
        with open(location, "wb") as f:
            f.write(await file.read())
        print(f"File saved locally: {location}")
        return location


async def _resolve_local(file_path: str):
    """Download S3 URL to a temp file if in production, else return path as-is."""
    if environment == "production" and file_path.startswith("http"):
        import tempfile
        import requests
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        tmp.write(requests.get(file_path).content)
        tmp.close()
        return tmp.name, True
    return file_path, False


async def extract_text_from_pdf(file_path: str) -> str:
    local, is_tmp = await _resolve_local(file_path)
    doc = fitz.open(local)
    text = "".join(page.get_text() for page in doc)
    doc.close()
    if is_tmp:
        os.unlink(local)
    return text


async def extract_pages(file_path: str) -> list[str]:
    """Return a list of text strings, one per page (1-indexed order)."""
    local, is_tmp = await _resolve_local(file_path)
    doc = fitz.open(local)
    pages = [page.get_text() for page in doc]
    doc.close()
    if is_tmp:
        os.unlink(local)
    return pages

# ---------------------------------------------------------------------------
# Core PDF edit (no extra LLM call — Gemini provides original/new directly)
# ---------------------------------------------------------------------------

async def _perform_pdf_edit(file_path: str, original_text: str, new_text: str) -> dict:
    local_path, is_tmp = await _resolve_local(file_path)

    doc = fitz.open(local_path)
    changes_made = False

    for page in doc:
        # "dict" mode gives span["text"], span["font"], span["size"], span["origin"] — all we need
        blocks = page.get_text("dict")["blocks"]

        for block in blocks:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    span_text = span.get("text", "")

                    if original_text.lower() not in span_text.lower():
                        continue

                    print(f"[edit] MATCH span_text='{span_text}' | looking for='{original_text}'")

                    # Preserve case of whatever is in the PDF
                    idx = span_text.lower().index(original_text.lower())
                    actual = span_text[idx:idx + len(original_text)]
                    if actual.isupper():
                        display_new = new_text.upper()
                    elif actual.istitle():
                        display_new = new_text.capitalize()
                    else:
                        display_new = new_text

                    # Replace within the FULL span so the rest of the span text is preserved
                    modified_text = span_text[:idx] + display_new + span_text[idx + len(original_text):]
                    print(f"[edit] modified_text='{modified_text}'")

                    font_name, is_bold, is_italic = _detect_font_style(span)
                    font_size = span.get("size", 12)
                    rgb_color = _color_to_rgb(span.get("color", 0))
                    bbox = fitz.Rect(span["bbox"])

                    # rawdict gives us the exact baseline origin — no approximation needed
                    origin = span.get("origin")
                    if origin:
                        baseline_point = fitz.Point(origin[0], origin[1])
                    else:
                        baseline_point = fitz.Point(bbox.x0, bbox.y1 - font_size * 0.15)

                    print(f"[edit] font='{font_name}' bold={is_bold} italic={is_italic} size={font_size} color={rgb_color}")
                    print(f"[edit] bbox={tuple(bbox)} origin={origin} baseline={tuple(baseline_point)}")

                    # Cover old span with white
                    page.draw_rect(bbox, color=None, fill=(1, 1, 1))

                    # Try embedded font first; fall back to best available standard font
                    embedded = _extract_embedded_font(doc, page, font_name)
                    try:
                        if embedded:
                            print(f"[edit] inserting with EMBEDDED font")
                            tw = fitz.TextWriter(page.rect)
                            tw.append(baseline_point, modified_text, font=embedded, fontsize=font_size)
                            tw.write_text(page, color=rgb_color)
                        else:
                            fallback = _resolve_font(font_name, is_bold, is_italic)
                            print(f"[edit] inserting with FALLBACK font='{fallback}'")
                            page.insert_text(
                                baseline_point, modified_text,
                                fontname=fallback,
                                fontsize=font_size,
                                color=rgb_color
                            )
                        changes_made = True
                        print(f"[edit] SUCCESS")
                    except Exception as e:
                        print(f"[edit] WARNING insert failed: {e} — retrying with default font")
                        try:
                            page.insert_text(baseline_point, modified_text, fontsize=font_size, color=rgb_color)
                            changes_made = True
                        except Exception as e2:
                            print(f"[edit] ERROR all insert attempts failed: {e2}")

    if not changes_made:
        if is_tmp:
            os.unlink(local_path)
        doc.close()
        return {"success": False, "message": f"Could not find '{original_text}' in the document."}

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    base_name = os.path.basename(file_path) if not file_path.startswith("http") else file_path.split("/")[-1]
    new_file_name = f"edited_{timestamp}_{base_name}"

    os.makedirs('pdfs', exist_ok=True)
    edited_path = f"pdfs/{new_file_name}"
    doc.save(edited_path)
    doc.close()

    if is_tmp:
        os.unlink(local_path)

    return {
        "success": True,
        "editedPdfUrl": f"/pdfs/{new_file_name}",
        "edited_file_path": edited_path,
    }

# ---------------------------------------------------------------------------
# Agentic entry point
# ---------------------------------------------------------------------------

async def process_user_input(
    question: str,
    pdf_text: str,
    file_path: str,
    document=None,
    db=None,
    allow_edit: bool = True,
) -> dict:
    document_id = document.id if document else 0

    # 1. Retrieve relevant context via RAG
    rag = await vector_service.query_relevant_chunks(document_id, question)
    relevant_context = rag["context"]
    source_pages: list[int] = rag["pages"]
    if not relevant_context:
        # Fallback: use first 3000 chars of full text if index is empty
        relevant_context = pdf_text[:3000]

    # 2. Load per-document conversation history from Redis
    history = redis_service.get_history(document_id)

    # 3. Build contents list (history + current message)
    contents = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])])
        )

    user_message = (
        f"[Relevant document context]\n{relevant_context}\n\n"
        f"[User question]\n{question}"
    )
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    # 4. Call Gemini with function calling (mode=ANY forces a tool call)
    from google.genai import errors as genai_errors
    try:
        response = _client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION,
                tools=[_PDF_TOOLS],
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                tool_config=types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(mode="ANY")
                )
            )
        )
    except genai_errors.ClientError as e:
        if e.code == 429:
            return {"answer": "The AI service is temporarily rate-limited. Please wait a moment and try again.", "is_edit": False}
        raise
    except genai_errors.ServerError as e:
        if e.code != 503:
            raise
        # 503: retry once with the fallback model before giving up
        try:
            response = _client.models.generate_content(
                model=FALLBACK_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=_SYSTEM_INSTRUCTION,
                    tools=[_PDF_TOOLS],
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                    tool_config=types.ToolConfig(
                        function_calling_config=types.FunctionCallingConfig(mode="ANY")
                    )
                )
            )
        except Exception:
            return {"answer": "Gemini is experiencing high demand right now. Please try again in a moment.", "is_edit": False}

    # 5. Dispatch based on which tool Gemini chose
    result = None

    if response.function_calls:
        func = response.function_calls[0]

        if func.name in ("answer_question", "summarize"):
            key = "response" if func.name == "answer_question" else "summary"
            answer = func.args.get(key, "")
            redis_service.add_message(document_id, "user", question)
            redis_service.add_message(document_id, "assistant", answer)
            result = {"answer": answer, "is_edit": False, "citations": [str(p) for p in source_pages]}

        elif func.name == "edit_pdf" and not allow_edit:
            answer = "You have view-only access to this document, so I can't edit it."
            result = {"answer": answer, "is_edit": False}

        elif func.name == "edit_pdf":
            original_text = func.args.get("original_text", "")
            new_text = func.args.get("new_text", "")

            edit_result = await _perform_pdf_edit(file_path, original_text, new_text)

            if edit_result["success"]:
                if document and db:
                    document.edited_file_path = edit_result["edited_file_path"]
                    db.commit()
                answer = f"Done! Changed \"{original_text}\" → \"{new_text}\". You can download the updated PDF."
                redis_service.add_message(document_id, "user", question)
                redis_service.add_message(document_id, "assistant", answer)
                result = {
                    "answer": answer,
                    "is_edit": True,
                    "editedPdfUrl": edit_result["editedPdfUrl"]
                }
            else:
                answer = f"I couldn't make that edit: {edit_result['message']}. Try being more specific about the exact text."
                result = {"answer": answer, "is_edit": False}

    # Fallback if no function call returned (shouldn't happen with mode=ANY)
    if result is None:
        fallback = getattr(response, "text", None) or "I couldn't process your request."
        redis_service.add_message(document_id, "user", question)
        redis_service.add_message(document_id, "assistant", fallback)
        result = {"answer": fallback, "is_edit": False}

    return result
