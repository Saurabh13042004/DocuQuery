from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Protocol


class _Message(Protocol):
    content: str
    is_user: bool
    timestamp: datetime | None


@dataclass(frozen=True)
class ChatExport:
    content: str
    filename: str
    media_type: str


def render_chat_export(
    document_name: str, messages: Iterable[_Message], fmt: str, exported_at: datetime
) -> ChatExport:
    lines = [f"# Chat Export — {document_name}", f"Exported: {exported_at.strftime('%Y-%m-%d %H:%M UTC')}", ""]
    for msg in messages:
        who = "**You**" if msg.is_user else "**DocuQuery**"
        stamp = msg.timestamp.strftime("%H:%M") if msg.timestamp else ""
        lines += [f"### {who}  _{stamp}_", msg.content, ""]

    stem = document_name.replace(" ", "_").removesuffix(".pdf")
    if fmt == "md":
        return ChatExport("\n".join(lines), f"chat_{stem}.md", "text/markdown")
    return ChatExport("\n".join(lines), f"chat_{stem}.txt", "text/plain")
