class LLMError(Exception):
    """Base class for model-provider failures the assistant knows how to explain to a user."""


class LLMRateLimitError(LLMError):
    pass


class LLMQuotaError(LLMError):
    pass


class LLMUnavailableError(LLMError):
    pass
