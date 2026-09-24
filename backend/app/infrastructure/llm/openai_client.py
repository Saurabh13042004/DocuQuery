from __future__ import annotations

import asyncio
import json
from typing import Sequence

from openai import APIConnectionError, APIStatusError, OpenAI, RateLimitError

from app.rag.errors import LLMQuotaError, LLMRateLimitError, LLMUnavailableError
from app.rag.types import ChatTurn, LLMResponse, ToolCall, ToolSpec


class OpenAIChatClient:
    def __init__(self, api_key: str, model: str, client: OpenAI | None = None):
        self._client = client or OpenAI(api_key=api_key)
        self.model = model

    async def chat(
        self, messages: Sequence[ChatTurn], tools: Sequence[ToolSpec], tool_choice: str = "auto"
    ) -> LLMResponse:
        try:
            response = await asyncio.to_thread(
                self._client.chat.completions.create,
                model=self.model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                tools=[self._tool(t) for t in tools] or None,
                tool_choice=tool_choice if tools else None,
            )
        except RateLimitError as e:
            if getattr(e, "code", None) == "insufficient_quota":
                raise LLMQuotaError(str(e)) from e
            raise LLMRateLimitError(str(e)) from e
        except APIConnectionError as e:
            raise LLMUnavailableError(str(e)) from e
        except APIStatusError as e:
            if e.status_code >= 500:  # the SDK already retried
                raise LLMUnavailableError(str(e)) from e
            raise

        message = response.choices[0].message
        return LLMResponse(tool_calls=[self._call(c) for c in message.tool_calls or []], text=message.content)

    @staticmethod
    def _tool(spec: ToolSpec) -> dict:
        return {"type": "function", "function": {
            "name": spec.name, "description": spec.description, "parameters": spec.parameters}}

    @staticmethod
    def _call(raw) -> ToolCall:
        try:
            arguments = json.loads(raw.function.arguments or "{}")
        except json.JSONDecodeError:
            arguments = {}
        return ToolCall(name=raw.function.name, arguments=arguments if isinstance(arguments, dict) else {})
