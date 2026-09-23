import os
import boto3
import pymupdf as fitz
from dotenv import load_dotenv
from google import genai
from google.genai import types
from datetime import datetime

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
