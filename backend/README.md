# DocuQuery backend

FastAPI + SQLAlchemy. Layered so business rules don't depend on HTTP, the database driver or any
vendor SDK.

```
app/
  main.py            app factory: middleware, error handlers, routers, startup schema check
  container.py       composition root: the only place that picks concrete adapters
  ports.py           interfaces for storage and email (Protocols)

  api/               HTTP only: parse request -> call a service -> shape the response
    deps.py            FastAPI dependencies (adapters, per-request services, current user)
    routes/            one controller module per feature (auth, account, documents, chat, teams)
  services/          use-cases and business rules. No FastAPI imports; raise domain errors
  repositories/      every SQLAlchemy query lives here
  domain/            enums, plan/price catalog, permission rules (pure functions)
  models/            ORM tables            schemas/    request/response models + validation
  core/              config, security (hashing/JWT), database, exceptions
  utils/             small pure helpers

  rag/               retrieval-augmented generation (see below)
  pdf/               reader, editor (text replacement that keeps the page's look), edit service
  infrastructure/    adapters: OpenAI, Upstash Vector, Upstash Redis, Upstash Blob, SMTP
scripts/             one-off ops (reindex, migrate files to Blob, set a user's plan)
tests/               unit/ (services, rag, adapters, pdf) and api/ (HTTP contract)
```

**Dependency rule:** `api -> services -> repositories/domain`, and services talk to the outside
world only through the Protocols in `ports.py` and `rag/interfaces.py`. Nothing in `services/`,
`rag/` or `domain/` imports FastAPI, an SDK or `infrastructure/`.

**Errors:** services raise `AppError` subclasses (`NotFoundError`, `PermissionDeniedError`,
`InsufficientCreditsError`, ...). One handler turns them into `{"detail": ...}` responses. A missing
document is a 404 (never a 403) so its existence isn't leaked.

**Validation:** at the edge in `schemas/` (lengths, normalised emails, enum-typed roles/plans/categories),
on uploads by content (size, `%PDF-` header, parseable) rather than by filename, and again in the
services where a rule protects data (seat limits, role hierarchy, ownership).

## RAG

```
upload  -> DocumentIndexer:  TextChunker -> Embedder -> VectorStore
ask     -> DocumentAssistant: Retriever -> build messages (+ ChatMemory) -> LLMClient -> ToolRegistry
```

| Piece | Role | Swap it for |
|---|---|---|
| `Embedder`, `VectorStore`, `LLMClient`, `ChatMemory` (`rag/interfaces.py`) | ports | any provider / store |
| `TextChunker` | page-aware sliding window | semantic or structure-aware chunking |
| `VectorRetriever` | embed question, query store | hybrid + reranker (implement `Retriever`) |
| `DocumentAssistant` | one turn of the loop; each step is a method | graph nodes |
| `AnswerQuestionTool`, `SummarizeTool`, `EditPdfTool` | what the model can do | more tools |

**Adding a capability** (extract-to-table, compare documents, ...) means writing an `AgentTool` (a
`ToolSpec` plus `run()`) and registering it in `container.build_assistant`. The assistant is untouched.

**Moving to LangGraph or Google ADK:** the steps in `DocumentAssistant.reply` (`retrieve`,
`build_messages`, the model call, `run_tool`, `remember`) map one-to-one to graph nodes, and the
`ToolSpec`/`AgentTool` pairs wrap directly as LangGraph tools or ADK function tools. The ports, indexer,
repositories, services and API stay as they are; only the orchestrator behind `DocumentAssistant`
changes. The vector store works with dense-only and hybrid Upstash indexes and can filter by several
documents at once (`document_ids`), which multi-document agents will need.

## Testing

```
python -m pytest            # ~400 tests, no network, ~6 s
```

Services run against an in-memory SQLite database and fakes for every port (`tests/fakes.py`), so the
real business code is exercised end to end. API tests override the adapter providers in `api/deps.py`
(`app.dependency_overrides`). `tests/conftest.py` sets fake credentials before anything is imported so
a test can never reach a real service, even if a real `.env` is present.

## Configuration

Read once into `core/config.py::Settings`; see `.env.example`. Integrations are built lazily, so the app
imports without credentials and reports exactly which variable is missing when a feature needs it.
`SECRET_KEY` is required when `ENVIRONMENT=production`.

## Operations

```
python -m scripts.reindex_documents                      # re-embed all documents (after changing model/index)
python -m scripts.migrate_files_to_blob [--apply]        # move old local-disk files into Blob
python -m scripts.set_user_plan you@example.com starter [--apply]
```

The database schema is created and extended on startup (`core/database.py::init_db`, additive and
idempotent). Alembic is the natural next step once a change needs a rename or a type change.
