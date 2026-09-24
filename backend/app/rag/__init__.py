"""Retrieval-augmented generation: chunking, indexing, retrieval and the tool-calling assistant.

Everything here depends only on the Protocols in ``interfaces``; OpenAI, Upstash and Redis are
plugged in from ``app.infrastructure``. To move to LangGraph or ADK, wrap the steps of
``DocumentAssistant`` (retrieve, build messages, call model, run tool) as graph nodes; the ports
and the tool registry stay as they are.
"""
