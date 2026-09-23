import os
import json
import time
import tempfile
import httpx
import pymupdf as fitz
from dotenv import load_dotenv
from openai import OpenAI, APIConnectionError, APIStatusError, RateLimitError

from . import blob_service, redis_service, vector_service

load_dotenv()

_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini")  # cheap tier; override via env
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

def _tool(name: str, description: str, prop: str, prop_desc: str, extra: dict | None = None) -> dict:
    props = {prop: {"type": "string", "description": prop_desc}, **(extra or {})}
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {"type": "object", "properties": props, "required": list(props)},
        },
    }


_PDF_TOOLS = [
    _tool("answer_question", "Answer a question about the PDF document using its content.",
          "response", "The answer to the user's question based on the document."),
    _tool("edit_pdf", "Replace specific text in the PDF. Use when user wants to change, update, or modify document content.",
          "original_text", "The exact text to find and replace in the PDF.",
          {"new_text": {"type": "string", "description": "The replacement text."}}),
    _tool("summarize", "Summarize the PDF document or a section of it.",
          "summary", "A clear and comprehensive summary of the document content."),
]

# ---------------------------------------------------------------------------
# Font helpers + the text-replacement engine live in pdf_editor (PyMuPDF only,
# so they can be tested without the API clients above).
# ---------------------------------------------------------------------------

from . import pdf_editor
from .pdf_editor import (  # noqa: F401  (re-exported for callers/tests)
    _color_to_rgb,
    _detect_font_style,
    _extract_embedded_font,
    _resolve_font,
)

# ---------------------------------------------------------------------------
# PDF file I/O
# ---------------------------------------------------------------------------

async def save_pdf(file) -> str:
    """Store an uploaded PDF in Upstash Blob and return its key."""
    key = blob_service.new_key()
    await file.seek(0)
    await blob_service.put(key, await file.read())
    print(f"File stored in Blob: {key}")
    return key


async def read_file(file_path: str) -> bytes:
    """Bytes of a stored PDF: a Blob key, or (older documents) a local path or S3 URL."""
    if blob_service.is_blob_key(file_path):
        return await blob_service.get(file_path)
    if file_path.startswith("http"):
        async with httpx.AsyncClient() as client:
            resp = await client.get(file_path)
            resp.raise_for_status()
            return resp.content
    with open(file_path, "rb") as f:
        return f.read()


async def _resolve_local(file_path: str):
    """Return a local path for *file_path*, downloading Blob/S3 files to a temp file first."""
    if not (blob_service.is_blob_key(file_path) or file_path.startswith("http")):
        return file_path, False
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    tmp.write(await read_file(file_path))
    tmp.close()
    return tmp.name, True


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
# Core PDF edit (no extra LLM call — the model provides original/new directly)
# ---------------------------------------------------------------------------

async def _perform_pdf_edit(file_path: str, original_text: str, new_text: str) -> dict:
    local_path, is_tmp = await _resolve_local(file_path)
    try:
        doc = fitz.open(local_path)
        try:
            report = pdf_editor.replace_text(doc, original_text, new_text)
            if not report.replacements:
                return {"success": False, "message": f"Could not find '{original_text}' in the document."}

            edited_key = blob_service.new_key("edited_")
            await blob_service.put(edited_key, doc.tobytes())
        finally:
            doc.close()
    finally:
        if is_tmp:
            os.unlink(local_path)

    return {
        "success": True,
        "edited_file_path": edited_key,
        "replacements": report.replacements,
        "pages": report.pages,
        "warnings": report.warnings,
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

    # 3. Build messages (system + history + current message)
    messages = [{"role": "system", "content": _SYSTEM_INSTRUCTION}]
    for msg in history:
        messages.append({"role": "user" if msg["role"] == "user" else "assistant", "content": msg["content"]})
    messages.append({
        "role": "user",
        "content": f"[Relevant document context]\n{relevant_context}\n\n[User question]\n{question}",
    })

    # 4. Call OpenAI with function calling (tool_choice=required forces a tool call)
    try:
        response = _client.chat.completions.create(
            model=MODEL, messages=messages, tools=_PDF_TOOLS, tool_choice="required",
        )
    except RateLimitError as e:
        if getattr(e, "code", None) == "insufficient_quota":
            return {"answer": "The AI service is out of quota right now. Please contact support.", "is_edit": False}
        return {"answer": "The AI service is temporarily rate-limited. Please wait a moment and try again.", "is_edit": False}
    except (APIConnectionError, APIStatusError) as e:
        if isinstance(e, APIStatusError) and e.status_code < 500:
            raise
        # the SDK already retried; give the user a friendly message
        return {"answer": "The AI service is experiencing high demand right now. Please try again in a moment.", "is_edit": False}

    # 5. Dispatch based on which tool the model chose
    result = None
    reply = response.choices[0].message

    if reply.tool_calls:
        func = reply.tool_calls[0].function
        try:
            args = json.loads(func.arguments or "{}")
        except json.JSONDecodeError:
            args = {}

        if func.name in ("answer_question", "summarize"):
            key = "response" if func.name == "answer_question" else "summary"
            answer = args.get(key, "")
            redis_service.add_message(document_id, "user", question)
            redis_service.add_message(document_id, "assistant", answer)
            result = {"answer": answer, "is_edit": False, "citations": [str(p) for p in source_pages]}

        elif func.name == "edit_pdf" and not allow_edit:
            answer = "You have view-only access to this document, so I can't edit it."
            result = {"answer": answer, "is_edit": False}

        elif func.name == "edit_pdf":
            original_text = args.get("original_text", "")
            new_text = args.get("new_text", "")

            edit_result = await _perform_pdf_edit(file_path, original_text, new_text)

            if edit_result["success"]:
                if document and db:
                    previous = document.edited_file_path
                    document.edited_file_path = edit_result["edited_file_path"]
                    db.commit()
                    if blob_service.is_blob_key(previous):  # superseded by this edit
                        try:
                            await blob_service.delete(previous)
                        except Exception:
                            pass
                n = edit_result.get("replacements", 1)
                answer = f"Done! Changed \"{original_text}\" → \"{new_text}\""
                answer += f" in {n} places." if n > 1 else "."
                answer += " You can download the updated PDF."
                if edit_result.get("warnings"):
                    answer += "\n\nHeads up:\n" + "\n".join(f"- {w}" for w in edit_result["warnings"])
                redis_service.add_message(document_id, "user", question)
                redis_service.add_message(document_id, "assistant", answer)
                result = {
                    "answer": answer,
                    "is_edit": True,
                    "editedPdfUrl": f"/documents/{document_id}/file?edited=true&v={int(time.time())}"
                }
            else:
                answer = f"I couldn't make that edit: {edit_result['message']}. Try being more specific about the exact text."
                result = {"answer": answer, "is_edit": False}

    # Fallback if no function call returned (shouldn't happen with tool_choice=required)
    if result is None:
        fallback = reply.content or "I couldn't process your request."
        redis_service.add_message(document_id, "user", question)
        redis_service.add_message(document_id, "assistant", fallback)
        result = {"answer": fallback, "is_edit": False}

    return result
