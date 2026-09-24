import json
from types import SimpleNamespace as NS

import httpx
import pytest
from openai import APIConnectionError, BadRequestError, InternalServerError, RateLimitError

from app.infrastructure.llm.openai_client import OpenAIChatClient
from app.infrastructure.llm.openai_embedder import OpenAIEmbedder
from app.rag.errors import LLMQuotaError, LLMRateLimitError, LLMUnavailableError
from app.rag.tools import AnswerQuestionTool
from app.rag.types import ChatTurn

REQUEST = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")


def http_error(cls, status, code=None):
    return cls("boom", response=httpx.Response(status, request=REQUEST), body={"code": code} if code else None)


class FakeSDK:
    def __init__(self, result=None, error=None):
        self.result, self.error, self.calls = result, error, []
        self.chat = NS(completions=NS(create=self._create))
        self.embeddings = NS(create=self._create)

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.result


def completion(tool_calls=None, content=None):
    return NS(choices=[NS(message=NS(tool_calls=tool_calls, content=content))])


def raw_call(name, arguments):
    return NS(function=NS(name=name, arguments=arguments))


MESSAGES = [ChatTurn("system", "be brief"), ChatTurn("user", "hi")]
TOOLS = [AnswerQuestionTool.spec]


async def test_chat_sends_messages_and_tools_in_the_openai_format_and_parses_tool_calls():
    sdk = FakeSDK(completion([raw_call("answer_question", json.dumps({"response": "yes"}))]))
    result = await OpenAIChatClient("k", "gpt-x", client=sdk).chat(MESSAGES, TOOLS, tool_choice="required")

    call = sdk.calls[0]
    assert call["model"] == "gpt-x" and call["tool_choice"] == "required"
    assert call["messages"] == [{"role": "system", "content": "be brief"}, {"role": "user", "content": "hi"}]
    assert call["tools"][0]["type"] == "function" and call["tools"][0]["function"]["name"] == "answer_question"
    assert [(c.name, c.arguments) for c in result.tool_calls] == [("answer_question", {"response": "yes"})]


async def test_chat_without_tools_omits_the_tool_parameters_and_returns_text():
    sdk = FakeSDK(completion(content="plain"))
    result = await OpenAIChatClient("k", "m", client=sdk).chat(MESSAGES, [])
    assert sdk.calls[0]["tools"] is None and sdk.calls[0]["tool_choice"] is None
    assert result.text == "plain" and result.tool_calls == []


@pytest.mark.parametrize("arguments", ["not json", "", "[1, 2]", None])
async def test_malformed_tool_arguments_become_an_empty_dict_instead_of_crashing(arguments):
    sdk = FakeSDK(completion([raw_call("answer_question", arguments)]))
    result = await OpenAIChatClient("k", "m", client=sdk).chat(MESSAGES, TOOLS)
    assert result.tool_calls[0].arguments == {}


@pytest.mark.parametrize("error,expected", [
    (http_error(RateLimitError, 429, "insufficient_quota"), LLMQuotaError),
    (http_error(RateLimitError, 429, "rate_limit_exceeded"), LLMRateLimitError),
    (http_error(InternalServerError, 503), LLMUnavailableError),
    (APIConnectionError(request=REQUEST), LLMUnavailableError),
])
async def test_provider_errors_are_translated_to_domain_errors(error, expected):
    with pytest.raises(expected):
        await OpenAIChatClient("k", "m", client=FakeSDK(error=error)).chat(MESSAGES, TOOLS)


async def test_client_side_errors_are_not_disguised_as_outages():
    with pytest.raises(BadRequestError):
        await OpenAIChatClient("k", "m", client=FakeSDK(error=http_error(BadRequestError, 400))).chat(MESSAGES, TOOLS)


async def test_embedder_requests_the_configured_dimensions_and_keeps_input_order():
    sdk = FakeSDK(NS(data=[NS(embedding=[1.0, 2.0]), NS(embedding=[3.0, 4.0])]))
    vectors = await OpenAIEmbedder("k", "emb-model", 768, client=sdk).embed(["a", "b"])
    assert vectors == [[1.0, 2.0], [3.0, 4.0]]
    assert sdk.calls[0] == {"model": "emb-model", "input": ["a", "b"], "dimensions": 768}


async def test_embedder_skips_the_network_for_empty_input():
    sdk = FakeSDK()
    assert await OpenAIEmbedder("k", "m", 768, client=sdk).embed([]) == [] and sdk.calls == []
