# DocuQuery — Product Roadmap

## Current State (Done)
- [x] FastAPI + Neon PostgreSQL backend
- [x] JWT auth (bcrypt + PyJWT)
- [x] PDF upload, text extraction (PyMuPDF)
- [x] Gemini 2.5 Flash agentic function calling (answer / edit / summarize)
- [x] Hybrid RAG — Upstash Vector DenseSparseHybrid (gemini-embedding-001, 768-dim)
- [x] Per-document chat history — Upstash Redis
- [x] PDF text editing (embedded font extraction, rawdict baseline, full-span redraw)
- [x] Case-insensitive text search with smart case replacement
- [x] Credit & plan system (Free 20cr / Starter $9 500cr / Pro $29 2000cr)
- [x] Unit test suite (pytest + pytest-asyncio, SQLite in-memory)
- [x] Docker hot-reload (uvicorn --reload + Vite dev server)
- [x] Makefile for test commands

---

## Phase 1 — Core Product Fixes & Quick Wins
*Target: 2 weeks*

### Bug Fixes
- [ ] Fix PDF font preservation (debug logs added — awaiting output to identify root cause)
- [x] Handle 402 insufficient-credits gracefully in all frontend error states
- [x] Refresh sidebar credit counter after every upload/ask operation

### Quick Wins (High impact, low effort)
- [x] Export chat as Markdown (Export button in chat header, `GET /documents/{id}/export?format=md`)
- [x] Saved prompt templates — 6 chips above input (Summarize, Key dates, Action items, Explain simply, Key risks, Main parties)
- [x] Smart citations — page numbers stored in vector metadata, `[Page N]` injected into RAG context, Gemini cites naturally, `pg N` badges shown under answers
- [ ] PDF viewer — highlight the cited passage in the viewer

---

## Phase 2 — Team Plan ($79/month)
*Target: Month 1–2 | Unlocks biggest revenue jump*

### Team Workspaces
- [x] Invite teammates by email
- [x] Shared document library (team can see each other's PDFs)
- [x] Role-based access — Viewer / Editor / Admin
- [x] Team usage dashboard (credits used, docs uploaded, top users)
- [x] Team plan billing ($79/month, 5 seats, 1500 credits/seat)

### Collaboration
- [x] Comments and annotations on PDF pages
- [ ] @mention teammates in chat
- [x] Shared saved prompts across team

---

## Phase 3 — Document Factory (B2B Core)
*Target: Month 2–3 | Unlocks Business plan $99/month*

### Template Studio
- [ ] Upload DOCX template or design in-app
- [ ] Variable detection — AI auto-detects `{{name}}`, `{{date}}`, `{{amount}}` etc.
- [ ] Variable type inference (date → auto-format, currency → ₹/$ handling, name → capitalize)
- [ ] Template preview with sample data
- [ ] Template library — pre-built templates:
  - [ ] Offer letter
  - [ ] Appointment letter
  - [ ] Experience / relieving certificate
  - [ ] Salary revision letter
  - [ ] CA engagement letter
  - [ ] Audit report cover letter
  - [ ] NDA
  - [ ] Service agreement
  - [ ] Invoice
  - [ ] Participation certificate

### Data Ingestion
- [ ] Excel / CSV upload → map columns to template variables
- [ ] Google Sheets live sync
- [ ] Airtable connector
- [ ] Manual JSON / API payload
- [ ] AI-assisted column mapping (auto-suggests which column maps to which variable)

### Bulk Generation Engine
- [ ] Preview mode — generate 3 samples before full run
- [ ] AI validation — flag rows with missing/malformed data before generating
- [ ] Bulk generate up to 10,000 PDFs in one job
- [ ] Progress indicator with estimated time
- [ ] Download as ZIP
- [ ] Per-recipient email delivery (attach their PDF)
- [ ] Generation history with re-run capability

---

## Phase 4 — Vertical Features
*Target: Month 3–4 | 3× higher willingness to pay*

### CA / Chartered Accountant Mode
- [ ] ITR filing acknowledgement letter generator
- [ ] Tax computation summary from spreadsheet
- [ ] Form 16 covering letter bulk generation
- [ ] GST notice AI response drafter (upload notice → AI drafts reply)
- [ ] Client engagement letter with ICAI clause library
- [ ] Balance sheet narrative generator (upload financials → AI writes summary)
- [ ] GSTIN validation in templates
- [ ] Tally XML / Zoho Books data connector

### HR Mode
- [ ] Offer letter with CTC breakup table
- [ ] Bulk offer letter generation from ATS / payroll Excel
- [ ] Appraisal letter generator
- [ ] Warning / show-cause letter templates
- [ ] Transfer order generator
- [ ] Full & Final settlement letter

### Legal Mode
- [ ] Contract clause extraction ("show all indemnification clauses")
- [ ] Risk flagging on uploaded contracts
- [ ] Contract comparison — diff two versions
- [ ] Clause library (add / substitute clauses)
- [ ] NDA generator with party name fill

### Research Mode
- [ ] Multi-paper upload and cross-paper Q&A
- [ ] Citation extraction (BibTeX / APA output)
- [ ] Methodology / results section summarizer
- [ ] Literature review generator across uploaded papers

### Finance Mode
- [ ] Financial ratio extraction from annual reports
- [ ] Quarter-over-quarter comparison across multiple filings
- [ ] Investor summary generator
- [ ] Red-flag detector in financial statements

---

## Phase 5 — Growth & Distribution
*Target: Month 3–4*

### Viral Loops
- [ ] Public shareable chat link (`/share/abc123`) — "Powered by DocuQuery" watermark on free
- [ ] Embed widget — let users put a DocuQuery chat on their own website
- [ ] Referral program — 100 credits per referral that converts to paid

### Chrome Extension
- [ ] Detect PDF open in browser tab
- [ ] Sidebar opens DocuQuery chat for that PDF
- [ ] Works on any URL ending in `.pdf`
- [ ] One-click save to DocuQuery library

### Integrations
- [ ] Slack bot — `/docuquery <question>` in any channel with PDF context
- [ ] Notion — export chat summary to a Notion page
- [ ] Google Drive — import PDFs directly from Drive
- [ ] Zapier / Make connector (webhook on generation complete)
- [ ] WhatsApp delivery of generated PDFs

---

## Phase 6 — API & Enterprise
*Target: Month 4–5 | Unlocks Agency $299/month + Enterprise*

### API Platform
- [ ] REST API with API key management
- [ ] Generate PDF from template via API (`POST /api/generate`)
- [ ] Ask question via API (`POST /api/ask`)
- [ ] Webhook on generation complete / document indexed
- [ ] API usage dashboard and rate limits
- [ ] SDK — Python, Node.js

### Enterprise Features
- [ ] SSO / SAML login (Okta, Azure AD, Google Workspace)
- [ ] Audit logs — who generated what, when, from which IP
- [ ] Custom data retention policies (GDPR / DPDP compliance)
- [ ] Dedicated instance / VPC deployment option
- [ ] SLA — 99.9% uptime guarantee
- [ ] Custom AI instructions per workspace ("always respond in Hindi")
- [ ] IP allowlist / SAML-enforced login

### White-Label
- [ ] Agency can rebrand DocuQuery with their logo / domain
- [ ] Remove "Powered by DocuQuery" branding
- [ ] Custom email domain for document delivery
- [ ] Reseller billing dashboard

---

## Phase 7 — AI Intelligence Layer
*Target: Month 5–6 | The moat*

- [ ] Cross-document search — semantic search across entire document library
- [ ] "Ask about all your contracts" — multi-doc Q&A
- [ ] AI data extraction to table — extract structured data from any set of PDFs into a spreadsheet
- [ ] Anomaly detection — flag unusual clauses, numbers, or changes across document versions
- [ ] Document health score — completeness, risk level, missing fields
- [ ] Auto-tagging and classification on upload
- [ ] Scheduled document review — "alert me if any contract expires in 30 days"

---

## Phase 8 — Monetisation Additions
*Target: Month 4 onward*

- [ ] Stripe payment integration (currently upgrade is free / manual)
- [ ] Monthly credit top-up (buy 200 extra credits any time)
- [ ] Annual plan discount (2 months free)
- [ ] Credit gifting between team members
- [ ] Usage analytics for users — credits spent per operation, per document
- [ ] Invoice PDF generation for billing (eat your own dog food)

---

## Pricing Targets

| Plan | Price | Monthly Credits | Target User |
|---|---|---|---|
| Free | $0 | 20 one-time | Try it |
| Starter | $9/mo | 500 | Individual |
| Pro | $29/mo | 2,000 | Power user |
| Business | $99/mo | 10,000 | CA firm / SMB |
| Agency | $299/mo | Unlimited gen | Staffing / SaaS agency |
| Enterprise | Custom | Custom | Large org |

### Path to $100K / month
```
500  × Agency   $299  =  $149,500
400  × Business  $99  =   $39,600
800  × Pro       $29  =   $23,200
2000 × Starter    $9  =   $18,000
                     ≈  $230,300 / month
```

---

## Go-To-Market Priority

1. **CA firms** — Partner with ICAI communities; one firm = 200+ client docs/month
2. **Staffing / HR firms** — "200 offer letters in 2 minutes" demo closes itself
3. **Digital agencies** — ProductHunt + IndieHackers; agencies resell to their clients
4. **White-label** — Agencies pay $299, charge their clients $500; they do the selling
5. **API-first developers** — Build on top of DocuQuery; passive revenue

---

## Tech Debt & Infrastructure
- [ ] Remove debug `print()` logs from pdf_service.py (added for font diagnosis)
- [ ] Add background job queue (Celery / RQ) for bulk PDF generation
- [ ] S3 storage for generated PDFs (currently local `pdfs/` folder)
- [ ] Rate limiting on API routes
- [ ] Sentry error tracking
- [ ] Structured logging (replace prints with Python logging)
- [ ] CI/CD pipeline (GitHub Actions → Docker build → deploy)
- [ ] Staging environment
