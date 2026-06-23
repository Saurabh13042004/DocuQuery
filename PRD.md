# DocuQuery — Product Requirements Document

**Version:** 1.0  
**Date:** June 2026  
**Status:** Active  
**Owner:** Saurabh Shukla

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Mission](#2-vision--mission)
3. [Problem Statement](#3-problem-statement)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Target Users & Personas](#5-target-users--personas)
6. [USP & Positioning](#6-usp--positioning)
7. [Product Architecture](#7-product-architecture)
8. [Feature Requirements by Phase](#8-feature-requirements-by-phase)
9. [Pricing & Monetisation](#9-pricing--monetisation)
10. [Success Metrics](#10-success-metrics)
11. [Technical Requirements](#11-technical-requirements)
12. [Go-To-Market](#12-go-to-market)
13. [Risks & Mitigations](#13-risks--mitigations)

---

## 1. Executive Summary

DocuQuery is a **document intelligence workspace** — for anyone who has a PDF they need to understand, edit, or act on, and for businesses that need to generate, process, or extract from PDFs at scale.

It serves two layers simultaneously:

- **Individual layer** — Upload any PDF, chat with it in plain language, make text edits, get answers instantly. No technical skill required. Better than ChatGPT for documents because it actually reads your file.
- **Business layer** — Generate hundreds of PDFs from templates and data, extract structured tables, run team workflows. The layer that drives revenue.

The product targets both the $28B document management market (enterprise/SMB) and the 50M+ people who receive PDFs daily and have no good tool to understand or edit them.

**Revenue Target:** $100,000 USD/month within 12 months of launch.

**Core Loop:**
```
Raw Data / Excel / DB
        ↓  generate
Professional Branded PDF
        ↓  chat / ask / analyze
Insights, Answers, Edits
        ↓  extract
Structured JSON / Table / Report
        ↓  deliver
Client / Team / System
```

No current product owns this full loop for SMBs. DocuQuery will.

---

## 2. Vision & Mission

**Vision:**  
Anyone who receives, creates, or works with a document — from a student trying to understand their rental agreement to a CA firm processing 300 client files — reaches for DocuQuery first.

**Mission:**  
Replace the Word → PDF → Email workflow with an AI-native document operations platform that generates at scale, answers questions intelligently, and extracts structured data — all without a data team or enterprise budget.

**What We Are Not:**  
- Not a traditional PDF editor (Adobe territory)  
- Not an enterprise OCR pipeline (RunPulse territory)  
- Not a doc storage tool (Google Drive territory)  
- Not a form builder (Typeform territory)

**What We Are:**  
The operating system for business documents — generation, intelligence, and extraction in one place.

---

## 3. Problem Statement

### The Gap in the Market

| Tool | What It Does | What It Fails At |
|---|---|---|
| Google Docs / Word | Create one document at a time | Can't bulk-generate, no AI Q&A, no extraction |
| Adobe Acrobat | View, annotate, basic form fill | No AI, no bulk generation, expensive |
| RunPulse / Kofax | Extract structured data from docs at scale | No chat, no generation, Fortune 500 pricing |
| ChatPDF / PDF.ai | Chat with a single PDF | No generation, no extraction, no team features |
| Mail merge (Word) | Bulk generation from template | Clunky, breaks often, no AI, no cloud |

### The Pain by Persona

**Normal person with a PDF:**  
Received a 40-page rental agreement on WhatsApp. Doesn't know what the notice period is, what happens if they break the lease, or whether the maintenance clause is fair. Options: read all 40 pages (won't), pay a lawyer (can't afford), ask a friend (doesn't know either). With DocuQuery: upload → "What is the notice period if I want to vacate?" → answer in 5 seconds.

Got a job offer letter with a typo in their name. Can't edit a PDF without Adobe Acrobat ($25/month). With DocuQuery: upload → click the text → fix the name → download corrected PDF.

**CA firm (300 clients):**  
Downloads data from Tally → opens Word → finds last year's letter → manually replaces 12 fields → saves → converts to PDF → emails. Repeated 300 times per filing season. ~60 hours of manual work per quarter.

**HR team (200 hires/year):**  
Every offer letter is a Word doc opened from a shared folder, manually edited, converted to PDF, emailed. No version control. Wrong CTC sent to wrong candidate twice this year.

**SaaS agency (10 new clients/month):**  
Each onboarding has 6 documents — MSA, NDA, SOW, onboarding checklist, invoice, welcome letter. Each manually assembled. 4 hours per new client = 40 hours/month just on paperwork.

**PE analyst:**  
Reviews 50 CIMs (Confidential Information Memos) per month. Manually reads each PDF. No way to compare across them. No way to extract KPIs into a spreadsheet automatically.

---

## 4. Competitive Landscape

### Primary Competitor Analysis: RunPulse

RunPulse (Pulse AI) is the most technically sophisticated player in document extraction. Understanding them defines DocuQuery's positioning.

**What RunPulse Does:**
- Document → Structured Data (one direction only)
- Vision OCR + layout analysis on complex PDFs
- Schema-based JSON extraction via API
- Fortune 500 clients: Samsung, Cloudera, UC Berkeley, PE firms
- 1B+ pages processed
- SOC2 Type II, ISO 27001, HIPAA, GDPR certified
- Python SDK, TypeScript SDK, REST API
- Private VPC / on-premises deployment

**What RunPulse Does NOT Do:**
- No conversational chat on documents
- No PDF generation from templates
- No PDF editing
- No template library
- No SMB pricing (enterprise contracts only)
- No India-specific verticals (CA, GST, ITR)
- No end-to-end workflow — pure extraction pipeline

**Relationship to DocuQuery:**

```
RunPulse:   Document → Data           (extraction only)
DocuQuery:  Data → Document → Chat → Extraction   (full loop)
```

They are not direct competitors. RunPulse is a B2B data pipeline. DocuQuery is a document workspace. However, DocuQuery should adopt RunPulse's strongest technical capability — schema-based structured extraction — for SMBs who cannot afford RunPulse.

**RunPulse Capabilities to Replicate for SMB Market:**

| RunPulse Feature | DocuQuery Implementation | Priority |
|---|---|---|
| Schema-based JSON extraction | "Extract to table" with AI-defined or user-defined schema | P0 |
| Table parsing → Excel export | Table detection + CSV/XLSX download | P0 |
| Document split by topic | AI-powered section splitting for long docs | P1 |
| Layout-aware text extraction | Column detection, header awareness | P1 |
| Multi-format (images, PPT) | OCR for scanned PDFs + image upload | P1 |
| Private deployment | Docker self-host option | P2 |
| SOC2 / HIPAA | Third-party audit (Month 8+) | P3 |

### Other Competitors

| Competitor | Strength | DocuQuery Advantage |
|---|---|---|
| ChatPDF | Simple, free, popular | No generation, no extraction, no team |
| PDF.ai | Clean UI, chat | No bulk gen, no CA/HR features |
| Adobe Acrobat | Brand trust | Expensive, no AI Q&A, no bulk gen |
| Notion AI | Good for notes | Can't handle structured PDF workflows |
| DocuSign | e-signature leader | No AI, no generation, no Q&A |

### DocuQuery Win Matrix

| Capability | ChatPDF | PDF.ai | RunPulse | Adobe | DocuQuery |
|---|---|---|---|---|---|
| Chat with PDF | ✅ | ✅ | ❌ | ❌ | ✅ |
| Edit text in PDF | ❌ | ❌ | ❌ | ✅ (paid) | ✅ |
| Summarize / plain English | ✅ | ✅ | ❌ | ❌ | ✅ |
| No signup needed | ✅ | ❌ | ❌ | ❌ | ❌ (free tier) |
| Works on any PDF type | ✅ | ✅ | ✅ | ✅ | ✅ |
| OCR for scanned docs | ❌ | ❌ | ✅ | ✅ | ✅ (roadmap) |
| Bulk PDF generation | ❌ | ❌ | ❌ | ❌ | ✅ |
| Schema extraction | ❌ | ❌ | ✅ | ❌ | ✅ (roadmap) |
| Template library | ❌ | ❌ | ❌ | ❌ | ✅ |
| Team workspaces | ❌ | ❌ | ✅ | ✅ | ✅ (roadmap) |
| SMB / individual pricing | ✅ | ✅ | ❌ | ❌ | ✅ |
| India/CA vertical | ❌ | ❌ | ❌ | ❌ | ✅ |
| Full loop | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 5. Target Users & Personas

### Persona 0 — Arjun, Everyday PDF User (Volume Persona)
- **Age:** 22, anywhere — student, job seeker, salaried professional, freelancer
- **Who:** Anyone who receives a PDF they need to understand or change
- **Common situations:**
  - Got a rental agreement, doesn't know what clause 9 means
  - Received a loan sanction letter, wants to know total interest payable
  - Has a job offer, wants to fix a typo in their name before signing and returning
  - Got a 50-page government circular, needs the 3 relevant lines for their case
  - Doing research, has 5 papers, wants the methodology section from each
  - Received a bank statement PDF, wants to know total spend in a category
- **Tools used:** WhatsApp (where they received the PDF), Google, ChatGPT (but it can't read their files)
- **WTP:** $0 on free tier → converts to Starter ($9/mo) if they use it weekly
- **Key jobs:** Understand → Summarize → Edit → Ask a specific question → Download
- **Success metric:** "I got the answer to my rental agreement question in 2 minutes, not a day"
- **Why they matter:** This is the top of the acquisition funnel. ChatPDF has 6M+ users from this exact persona. Every student, professional, or citizen who interacts with documents is a potential user. Many later become business users when they join a CA firm, HR team, or start a company. Free tier converts ~3% to paid; viral because they share the "wow this just read my PDF" moment.

---

### Persona 1 — Rajan, CA Partner (Primary)
- **Age:** 38, Bangalore
- **Firm:** 4-person CA firm, 280 clients
- **Pain:** Spends 3 hours every day generating letters, notices, and reports manually in Word
- **Tools used:** Tally, Excel, MS Word, Gmail
- **WTP:** ₹4,999/month ($60) if it saves 60+ hours/quarter
- **Key jobs:** Filing letters, audit reports, engagement letters, client communication
- **Success metric:** "I generate all March filing letters in 20 minutes instead of 3 days"

### Persona 2 — Priya, HR Manager (Primary)
- **Age:** 31, Mumbai
- **Company:** 400-person manufacturing company
- **Pain:** 80 offer letters per month, each manually prepared in Word. Wrong offer sent to wrong candidate twice.
- **Tools used:** Excel (ATS), Word, Gmail
- **WTP:** $79/month (saves 40 hours/month at $25/hr billing = $1,000 saved)
- **Key jobs:** Offer letters, appointment letters, appraisal letters, experience certificates
- **Success metric:** "Zero manual offer letter prep; generated from HRMS export"

### Persona 3 — Ankit, Founder of a 12-person SaaS Agency (Primary)
- **Age:** 29, Pune
- **Pain:** Each new client onboarding needs 6 documents. He does it manually. 10 new clients/month = 60 documents.
- **Tools used:** Notion, Google Docs, Stripe, Slack
- **WTP:** $99/month (saves 40 hours/month)
- **Key jobs:** MSA, NDA, SOW, invoices, proposals, onboarding packs
- **Success metric:** "New client onboarding docs generated in 5 minutes, not 4 hours"

### Persona 4 — Meera, PE/VC Analyst (Secondary)
- **Age:** 26, Delhi
- **Pain:** Reviews 40-60 CIMs/month. No way to search across them. Manually builds comparison tables.
- **Tools used:** Excel, Google Drive, email
- **WTP:** $29-$99/month
- **Key jobs:** Extract KPIs, compare financials, summarize investment theses
- **Success metric:** "Extract revenue, EBITDA, headcount from 50 CIMs into one spreadsheet"

### Persona 5 — Dev, Developer at a Fintech (Secondary)
- **Age:** 27, Hyderabad
- **Pain:** Needs to process 10,000 bank statements/month to extract transactions
- **Tools used:** Python, REST APIs
- **WTP:** $299/month (API plan)
- **Key jobs:** Programmatic PDF extraction, webhook on completion, batch processing
- **Success metric:** "1000 statements processed overnight via API, zero manual work"

---

## 6. USP & Positioning

### Core USP

> **"DocuQuery is the document workspace for modern businesses — generate professional PDFs from your data, understand them through AI chat, extract structured insights, and edit them — all in one workflow, at prices any business can afford."**

### Positioning Statement

For CA firms, HR teams, and agencies that are drowning in manual document work, DocuQuery is the AI-native document operations platform that handles generation, Q&A, editing, and extraction in one place. Unlike RunPulse (enterprise-only extraction) or ChatPDF (chat only), DocuQuery owns the complete document lifecycle — from data to PDF to insight.

### The Full Loop Diagram (Marketing Asset)

```
┌─────────────────────────────────────────────────────────┐
│                    DOCUQUERY LOOP                        │
│                                                         │
│  [Excel / DB / Form]  →  GENERATE  →  [PDF Document]   │
│                                              ↓           │
│  [Structured Data]  ←  EXTRACT  ←  CHAT / EDIT / SIGN  │
│                                                         │
│  All in one tab. No switching tools.                    │
└─────────────────────────────────────────────────────────┘
```

### Tagline Options
- "Generate. Understand. Extract. Repeat."
- "The document OS for modern businesses"
- "RunPulse for the rest of us"
- "Your entire document workflow. One tool."

---

## 7. Product Architecture

### Current Stack
- **Backend:** FastAPI, SQLAlchemy, Neon PostgreSQL (psycopg2)
- **AI:** Gemini 2.5 Flash (function calling), gemini-embedding-001 (768-dim embeddings)
- **Vector DB:** Upstash Vector (DenseSparseHybrid, cosine)
- **Cache:** Upstash Redis (per-document chat history)
- **PDF Engine:** PyMuPDF (fitz) — text extraction, editing, font handling
- **Auth:** bcrypt + PyJWT (24h tokens)
- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, React Router v6
- **Infra:** Docker Compose, hot reload (uvicorn --reload + Vite dev server)

### Planned Additions by Phase
- **OCR:** pytesseract + pdf2image (scanned PDFs)
- **Job Queue:** Celery + Redis (bulk generation)
- **Storage:** AWS S3 (generated PDFs at scale)
- **Payments:** Stripe (subscriptions + top-ups)
- **Email:** AWS SES or Resend (bulk document delivery)
- **Table Extraction:** PyMuPDF table API + pandas → CSV/Excel
- **Schema Extraction:** Gemini structured output + Pydantic schemas

---

## 8. Feature Requirements by Phase

---

### Phase 1 — Stability & Quick Wins
**Timeline:** Week 1–2  
**Goal:** Fix known bugs, ship high-perceived-value features with low effort

---

#### P1.1 PDF Font Preservation Fix
**Priority:** P0 (blocking good UX)  
**Problem:** After editing a PDF, the font family and size change. Gaps appear.  
**Root Cause:** When using `rawdict` mode, spans have no `text` field — text must be reconstructed from `chars`. Also, embedded font extraction via `fitz.Font(fontbuffer=...)` may fail silently.  
**Requirements:**
- Use `page.get_text("dict")` which has both `text` and `origin` fields
- Extract embedded font from PDF via `doc.extract_font(xref)` with subset prefix stripping (`ABCDEF+FontName` → `FontName`)
- Use `fitz.TextWriter` with embedded font for insertion
- Fall back gracefully: embedded → base14 style match → Helvetica
- Debug logs must show which font was used for each span

**Acceptance Criteria:**
- [ ] Edit "Saurabh" → "Rishabh" in a resume PDF — font family and size identical to original
- [ ] No visible gap or spacing change after edit
- [ ] Debug logs show `[edit] inserting with EMBEDDED font` for most common PDFs

---

#### P1.2 Smart Citations with Page Numbers
**Priority:** P0  
**Problem:** Answers don't cite where in the document the information came from. Users can't verify.  
**Requirements:**
- Every answer_question tool response must include page number and section reference
- Format: *"Based on page 3, Section 2.1: [answer]"*
- Update system prompt to require citations
- Update vector chunk metadata to store page number per chunk
- Display citation as a clickable link in chat → scrolls PDF viewer to that page

**Acceptance Criteria:**
- [ ] All Q&A answers include page number reference
- [ ] Clicking citation scrolls PDF viewer to correct page
- [ ] Citation appears grayed out below answer bubble

---

#### P1.3 Export Chat as PDF / Markdown
**Priority:** P1  
**Problem:** Users want to share conversation output with clients.  
**Requirements:**
- "Export" button in chat header
- Options: PDF (styled), Markdown (.md), plain text (.txt)
- PDF export includes: document name, date, each Q&A pair with citations
- Backend: `GET /documents/{id}/export?format=pdf|md|txt`
- Frontend: download triggers automatically

**Acceptance Criteria:**
- [ ] Export button visible in chat view header
- [ ] PDF export downloads with correct formatting
- [ ] Markdown export includes all messages in proper MD format

---

#### P1.4 Saved Prompt Templates
**Priority:** P1  
**Problem:** Users type the same prompts repeatedly. Increases friction, reduces usage.  
**Requirements:**
- Pre-built templates accessible from chat input
- Default templates: "Summarize this document", "Extract key action items", "Explain in simple terms", "List all dates and deadlines", "Find potential risks"
- Users can save custom prompts
- Stored per user in DB (new `SavedPrompt` model)
- Shown as chips above chat input or in a dropdown

**Acceptance Criteria:**
- [ ] Clicking a template fills the chat input
- [ ] Users can save a new template from any message they've typed
- [ ] Templates persist across sessions

---

#### P1.5 OCR for Scanned PDFs
**Priority:** P0 (40% of Indian business PDFs are scanned)  
**Problem:** PyMuPDF extracts no text from scanned PDFs (they're images). Q&A returns nothing.  
**Requirements:**
- Detect if extracted text < 100 chars → assume scanned
- Fall back to `pdf2image` + `pytesseract` OCR pipeline
- OCR result fed into same embedding + vector pipeline
- Add `pytesseract`, `pdf2image`, `Pillow` to requirements.txt
- Processing time warning in UI ("Scanned PDF — OCR in progress, ~30 seconds")

**Acceptance Criteria:**
- [ ] Upload a phone-photo PDF → text extracted → Q&A works
- [ ] Upload a tax notice scan → can ask "what is the notice date?"
- [ ] OCR banner shown during processing

---

### Phase 2 — Team Plan ($79/month)
**Timeline:** Month 1–2  
**Goal:** Unlock the highest-revenue plan tier. One team account = 9× Starter ARPU.

---

#### P2.1 Team Workspaces
**Priority:** P0  
**New Models:** `Team`, `TeamMember` (role: owner/admin/editor/viewer)  
**Requirements:**
- Owner can create a workspace (name, logo upload)
- Invite members by email → email invite link → they join on sign-up or login
- Shared document library — all team members see shared docs
- Documents can be personal (only owner) or shared (team-visible)
- Team usage dashboard: credits consumed, docs uploaded, top users, last active

**API Endpoints:**
- `POST /teams` — create team
- `POST /teams/{id}/invite` — send invite
- `GET /teams/{id}/members` — list members
- `PATCH /teams/{id}/members/{user_id}` — change role
- `DELETE /teams/{id}/members/{user_id}` — remove member
- `GET /teams/{id}/documents` — shared docs
- `GET /teams/{id}/usage` — usage stats

**Acceptance Criteria:**
- [ ] Owner invites 4 teammates via email
- [ ] All 5 members see the same shared document library
- [ ] Editor can upload and chat; Viewer can only read
- [ ] Admin can see usage dashboard per member

---

#### P2.2 Role-Based Access Control
**Priority:** P0 (required for team plan)  

| Role | Upload | Chat | Edit PDF | Delete | Manage Members | Billing |
|---|---|---|---|---|---|---|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Editor | ✅ | ✅ | ✅ | Own only | ❌ | ❌ |
| Viewer | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Acceptance Criteria:**
- [ ] Viewer cannot see Upload button
- [ ] Editor cannot delete another member's document
- [ ] Owner is the only one who can change billing plan

---

#### P2.3 Shared Prompt Library
**Priority:** P1  
**Requirements:**
- Team admins can publish prompt templates to the whole team
- Team members can use shared templates
- Templates can be tagged by category (HR, Legal, Finance, General)

---

#### P2.4 In-Document Comments
**Priority:** P2  
**Requirements:**
- Any team member can leave a comment on a chat message or PDF page
- Comments appear in a sidebar panel
- Comment author, timestamp, resolved/open status
- Email notification on new comment (if enabled)

---

### Phase 3 — Document Factory
**Timeline:** Month 2–3  
**Goal:** The core B2B differentiator. No competitor has this for SMBs.

---

#### P3.1 Template Studio
**Priority:** P0  
**Requirements:**
- Upload DOCX template OR design from scratch in-app (rich text editor)
- AI auto-detects variables — scans document and finds `{{variable_name}}` patterns
- AI also suggests variables from context ("I see 'Dear [Name]' — should this be `{{recipient_name}}`?")
- Variable type inference: name (capitalize), date (format picker), currency (₹/$, decimal places), number, text, email
- Template preview with synthetic sample data
- Template versioning (v1, v2, etc.) with changelog

**Template Library (Pre-built):**
- Offer Letter (India format, CTC breakup)
- Appointment Letter
- Experience Certificate
- Relieving Letter
- Salary Revision Letter
- CA Engagement Letter
- Tax Computation Summary Letter
- Audit Representation Letter
- NDA (mutual and one-way)
- Service Agreement / MSA
- Invoice (GST-compliant)
- Participation Certificate
- Internship Certificate
- Warning Letter
- Transfer Order

**Acceptance Criteria:**
- [ ] Upload a DOCX with `{{name}}` fields → variables detected automatically
- [ ] Preview shows realistic sample data
- [ ] Template saved to library and reusable

---

#### P3.2 Data Ingestion Layer
**Priority:** P0  
**Requirements:**
- **Excel/CSV upload:** drag-and-drop file → column preview → map columns to template variables (AI suggests mapping)
- **Google Sheets sync:** paste sheet URL → authorize → live sync (re-pull before generation)
- **Manual entry:** JSON-like form for small batches (1–10 records)
- **API / Webhook:** POST a JSON payload to generate one PDF programmatically
- AI column mapper: if Excel has `Employee Name`, AI maps it to `{{employee_name}}` automatically
- Validation pass: AI flags rows with missing required fields, suspicious values (negative salary, future DOB), or formatting issues before generating

**Acceptance Criteria:**
- [ ] Upload Excel with 200 rows → column mapping suggested → 200 offer letters generated
- [ ] Google Sheets URL pasted → sheet columns pulled → mapping shown
- [ ] Validation flags row 47 where salary column is empty

---

#### P3.3 Bulk Generation Engine
**Priority:** P0  
**Requirements:**
- Preview mode: generate 3 sample PDFs before full run — user must approve
- Bulk run: generate up to 10,000 PDFs (background job via Celery)
- Progress bar: "Generated 342 / 1,000 documents"
- Error report: list of rows that failed generation with reason
- Output options:
  - Download as ZIP
  - Email each recipient (attach their PDF, customizable subject/body)
  - Store all in DocuQuery library (searchable, chattable)
  - Webhook POST when complete
- Generation history: every batch job saved with date, template used, row count, status

**Acceptance Criteria:**
- [ ] 500 offer letters generated in < 3 minutes
- [ ] Each recipient gets their own PDF emailed to them
- [ ] Failed rows logged with reason (e.g., "missing joining_date in row 23")
- [ ] ZIP downloaded with files named `{candidate_name}_offer_letter.pdf`

---

#### P3.4 Schema-Based Extraction ("Extract to Table")
**Priority:** P0 — Closes the gap with RunPulse for SMBs  
**Requirements:**
- User selects one or more uploaded PDFs
- Clicks "Extract to Table"
- Defines schema — either:
  - AI suggests schema based on document type (detected automatically)
  - User types fields: "name, email, joining date, CTC, designation"
- Gemini structured output extracts data matching schema from each PDF
- Result shown as an interactive table in UI
- Export as CSV / XLSX
- Batch mode: run same schema across 100 PDFs → 100 rows in output table

**Use Cases:**
- HR: Extract candidate details from 100 resumes → spreadsheet
- CA: Extract PAN, name, income, tax from 200 ITR PDFs → client master
- PE Analyst: Extract revenue, EBITDA, headcount from 50 CIMs → comparison table
- Insurance: Extract policy number, premium, expiry from 200 policies

**API:**
```
POST /extract/schema
{
  "document_ids": [1, 2, 3, ...],
  "schema": {
    "candidate_name": "string",
    "email": "string",
    "years_experience": "number",
    "current_ctc": "currency_inr",
    "skills": "array"
  }
}
→ returns rows array + downloadable file URL
```

**Acceptance Criteria:**
- [ ] Upload 10 resumes → extract to table → CSV has 10 rows with correct data
- [ ] AI suggests schema ("I detect these are resumes. Suggested fields: name, email, experience, skills, current company")
- [ ] Missing field shown as blank, not an error

---

#### P3.5 Table-Aware Chat Answers
**Priority:** P1  
**Requirements:**
- When answering a question that involves tabular data, format the answer as a markdown table
- When source is a table in the PDF, cite the table name and page
- Example: "What were Q3 revenues?" → answer rendered as table with quarter/value columns

---

#### P3.6 Document Split
**Priority:** P1  
**Requirements:**
- Upload a long PDF (50+ pages)
- "Split by Topic" button
- AI identifies logical sections (Definitions / Payment Terms / Termination / Schedules etc.)
- Each section becomes independently chatted with
- Useful for long contracts, audit reports, annual reports

---

### Phase 4 — Vertical Modes
**Timeline:** Month 3–4  
**Goal:** Charge 3× more per user by solving a specific vertical's exact pain

---

#### P4.1 CA / Accountant Mode
**Business Plan feature ($99/month)**

| Feature | Description |
|---|---|
| ITR letter generator | Template + client master Excel → 300 filing letters in 5 min |
| Tax computation summary | Upload computation sheet → AI generates narrative letter |
| Form 16 bulk letters | Payroll Excel → covering letters for all employees |
| GST notice responder | Upload notice → AI drafts reply referencing past responses |
| GSTIN validator | Validates GSTIN format in templates before generation |
| Audit engagement letter | ICAI-standard template with clause library |
| Balance sheet narrator | Upload P&L/BS → AI writes management commentary |
| Tally XML connector | Import client data directly from Tally |
| Client master sync | Maintain master list; reuse across all templates |

---

#### P4.2 HR Mode
**Business Plan feature ($99/month)**

| Feature | Description |
|---|---|
| Offer letter wizard | Step-by-step: select grade → CTC → auto-fills offer letter |
| CTC breakup table | Auto-calculates HRA, PF, gratuity, take-home |
| Bulk offer generation | Upload recruiting Excel → generate all offer letters |
| Appraisal letter | Template + performance rating → personalized letter |
| Warning / Show-cause | Pre-written templates, customizable |
| Full & final settlement | Auto-calculates notice pay, gratuity, pending leaves |
| e-Stamp integration | Appointment letter with legal stamp value |
| HRMS connector | Integrate with Keka, Darwinbox, BambooHR data export |

---

#### P4.3 Legal Mode
**Agency Plan feature ($299/month)**

| Feature | Description |
|---|---|
| Contract clause extractor | "Show all indemnification clauses across these 10 contracts" |
| Risk flagging | Highlight aggressive or unusual clauses automatically |
| Contract comparison | Diff two versions of the same contract side-by-side |
| Clause library | Approved fallback clauses user can substitute |
| NDA generator | Party names + type (mutual/one-way) → NDA in 30 seconds |
| Limitation of liability scanner | Flag missing or weak liability caps |
| Renewal date tracker | Extract all contract expiry dates → alert dashboard |

---

#### P4.4 Research Mode
**Pro Plan feature ($29/month)**

| Feature | Description |
|---|---|
| Multi-paper upload | Upload 20 research papers, ask across all |
| Citation extraction | BibTeX / APA output for every reference found |
| Methodology summarizer | "Summarize Section 3 from all uploaded papers" |
| Cross-paper comparison | "How do these 5 papers differ on sample size?" |
| Literature review generator | AI writes literature review from uploaded papers |

---

#### P4.5 Finance Mode
**Business Plan feature ($99/month)**

| Feature | Description |
|---|---|
| Financial ratio extractor | Upload annual report → get P/E, EBITDA, ROE, D/E table |
| Multi-period comparison | Upload 5 years of reports → see trend table |
| Red flag detector | Flag unusual items: revenue recognition changes, auditor notes |
| Investor summary generator | One-pager from annual report |
| CIM analyzer | Extract KPIs from CIM → comparison spreadsheet |

---

### Phase 5 — Growth & Distribution
**Timeline:** Month 3–4  
**Goal:** Build viral acquisition loops that compound over time

---

#### P5.1 Public Shareable Chat Links
**Priority:** P0 (viral loop)**  
**Requirements:**
- Any chat can be shared as a public URL `/share/{token}`
- Free tier shows "Powered by DocuQuery" banner with CTA
- Paid plans can remove watermark
- Shared chats are read-only, no auth required
- Share button in chat header → copies link

---

#### P5.2 Referral Program
**Priority:** P1  
**Requirements:**
- User gets unique referral link
- Referred user signs up → both get 100 bonus credits after referral converts to paid
- Referral dashboard: invited count, converted count, credits earned

---

#### P5.3 Chrome Extension
**Priority:** P1 (biggest acquisition channel)**  
**Requirements:**
- Detects when user is viewing a PDF URL in browser
- Opens DocuQuery sidebar with chat for that PDF
- "Save to DocuQuery" button → adds to library
- Works on any `.pdf` URL (court filings, financial reports, government notices)
- One-click install from Chrome Web Store

---

#### P5.4 Slack Integration
**Priority:** P1  
**Requirements:**
- Install DocuQuery Slack app
- `/docuquery @document-name what is the termination clause?` in any channel
- Bot responds with answer + citation
- Works on documents already in user's DocuQuery library

---

#### P5.5 Notion Integration
**Priority:** P2  
**Requirements:**
- "Export to Notion" button in chat
- Creates a new Notion page with full chat transcript
- Supports Notion OAuth for auth

---

#### P5.6 Google Drive Integration
**Priority:** P1  
**Requirements:**
- "Import from Drive" in Upload modal
- Browse Google Drive folders, select PDFs
- Imported directly to DocuQuery without downloading
- Google OAuth flow

---

### Phase 6 — API Platform & Enterprise
**Timeline:** Month 4–5  
**Goal:** Unlock Agency plan ($299/month) and enterprise deals

---

#### P6.1 API Platform
**Priority:** P0 for Agency plan**  

**Endpoints:**
```
POST   /api/v1/generate          Generate PDF from template + data
POST   /api/v1/ask               Ask question about a document
POST   /api/v1/extract/schema    Extract structured data with schema
POST   /api/v1/documents         Upload a document
GET    /api/v1/documents/{id}    Get document metadata
DELETE /api/v1/documents/{id}    Delete document
POST   /api/v1/webhooks          Register webhook endpoint
GET    /api/v1/usage             Get API usage stats
```

**Requirements:**
- API key management (create, rotate, revoke)
- Per-key rate limits and credit limits
- Usage dashboard with per-endpoint breakdown
- Python SDK (`pip install docuquery`)
- TypeScript SDK (`npm install docuquery`)
- Webhook: `generation.complete`, `extraction.complete`, `ask.complete`
- OpenAPI / Swagger docs auto-generated

---

#### P6.2 White-Label
**Priority:** P1 for Agency plan**  
**Requirements:**
- Agency can upload their logo + set brand colors
- All generated PDFs have agency branding, not DocuQuery
- Custom subdomain: `docs.agencyname.com`
- "Powered by DocuQuery" removed from all surfaces
- Agency can resell DocuQuery seats to their clients at any price they choose
- Agency billing dashboard: manage sub-accounts, usage per client

---

#### P6.3 SSO / SAML Login
**Priority:** P0 for Enterprise**  
**Requirements:**
- Support Google Workspace SAML
- Support Okta, Azure AD, OneLogin
- SAML 2.0 SP-initiated flow
- Auto-provision users on first login
- Force SSO for domain (no email/password fallback)

---

#### P6.4 Audit Logs
**Priority:** P0 for Enterprise / Compliance**  
**Requirements:**
- Every action logged: login, upload, generation, download, delete, member invite, plan change
- Log viewer in admin panel with filters (user, date range, action type)
- Export logs as CSV
- Logs retained for 12 months
- Immutable (no deletion of log entries)

---

#### P6.5 Private Deployment / Self-Host
**Priority:** P2**  
**Requirements:**
- Docker Compose self-host option with all services bundled
- Customer brings their own Gemini API key
- Customer brings their own storage (S3-compatible)
- Documented installation guide
- License key activation
- Priced at $500/month minimum for self-hosted

---

### Phase 7 — AI Intelligence Layer
**Timeline:** Month 5–6  
**Goal:** Build the moat. Features no competitor can replicate quickly.

---

#### P7.1 Cross-Document Search
**Priority:** P0**  
**Requirements:**
- Search bar in dashboard: "Find all contracts mentioning 'force majeure'"
- Semantic search across entire document library
- Results show document name, page, highlighted excerpt
- Filter by document type, date range, folder
- Powered by existing Upstash Vector index (already built)

---

#### P7.2 AI Data Extraction to Table (Batch Schema Extract)
**Priority:** P0 — Flagship competitive differentiator vs RunPulse**  
**Requirements:**
- User selects multiple documents of same type (e.g., 50 resumes)
- Defines or accepts AI-suggested schema
- DocuQuery extracts matching data from every document
- Results in interactive, sortable, filterable table
- Export to CSV / Excel / Google Sheets
- Charge per row: 1 credit per 10 rows extracted (separate from ask credit)

---

#### P7.3 Document Health Score
**Priority:** P2**  
**Requirements:**
- Every uploaded document gets an AI health score (0–100)
- Dimensions: completeness, risk level, readability, missing fields, unusual clauses
- CA use: "This engagement letter is missing the fee clause — score: 62/100"
- Shown as badge on document card in dashboard

---

#### P7.4 Auto-Tagging on Upload
**Priority:** P1**  
**Requirements:**
- When a document is uploaded, AI classifies it: Invoice / Contract / Resume / Report / Notice / Certificate
- Auto-applies tag to document
- Tags filterable in dashboard
- User can override or add custom tags

---

#### P7.5 Contract Expiry Tracker
**Priority:** P1 for Legal/CA mode**  
**Requirements:**
- AI extracts all dates and deadlines from uploaded contracts
- Shows calendar view of upcoming deadlines
- Email alert: "Contract with Client XYZ expires in 30 days"
- New model: `DocumentAlert` with trigger date, document_id, alert_type

---

#### P7.6 Anomaly Detection
**Priority:** P2**  
**Requirements:**
- "Compare this contract with our standard template and flag deviations"
- "This invoice has an unusually high line item — flag for review"
- "This year's P&L shows a 40% revenue jump not explained in notes"
- Powered by Gemini with a specialized system prompt per document type

---

### Phase 8 — Monetisation Infrastructure
**Timeline:** Month 4 onward  
**Goal:** Proper billing system, growth levers, revenue optimisation

---

#### P8.1 Stripe Integration
**Priority:** P0 (currently upgrades are free — must fix before real revenue)**  
**Requirements:**
- Stripe Checkout for plan subscriptions (Starter, Pro, Business, Agency)
- Stripe Customer Portal for self-serve plan changes / cancellation
- Webhook: `invoice.payment_succeeded` → add monthly credits
- Webhook: `invoice.payment_failed` → downgrade to free
- Annual plan: 2 months free (10 months pricing)
- Trial: 14-day free trial for Starter/Pro (no card required)

---

#### P8.2 Credit Top-Up
**Priority:** P1**  
**Requirements:**
- Buy extra credits anytime: 100 credits for $1.50, 500 for $6, 2000 for $20
- Top-up never expires
- Stripe one-time payment
- Immediately credited to account

---

#### P8.3 Usage Analytics for Users
**Priority:** P1**  
**Requirements:**
- User dashboard showing: credits used this month, by operation type, by document
- Chart: daily credit usage over last 30 days
- Projection: "At this rate, your credits run out in 8 days"
- Upgrade prompt when < 20% credits remain

---

#### P8.4 Generation-Based Billing (Business+)
**Priority:** P1**  
**Requirements:**
- Business plan includes 10,000 PDF generations/month
- Overage: $0.01 per extra PDF generated
- Usage shown in billing dashboard
- Alert when 80% of generation quota used

---

## 9. Pricing & Monetisation

### Plan Structure

| Plan | Price | Credits | Generations | Team | Key Features |
|---|---|---|---|---|---|
| **Free** | $0 | 20 one-time | — | — | Try the product |
| **Starter** | $9/mo | 500/mo | — | 1 user | Chat, edit, basic extract |
| **Pro** | $29/mo | 2,000/mo | — | 1 user | + Multi-PDF, schema extract, citations |
| **Business** | $99/mo | 10,000/mo | 1,000 PDFs | 5 seats | + Template factory, CA/HR modes, table export |
| **Agency** | $299/mo | Unlimited | Unlimited | 20 seats | + API, white-label, Legal mode, webhooks |
| **Enterprise** | Custom | Custom | Custom | Custom | + SSO, audit logs, SLA, private deploy |

### Credit Costs (Operations)
| Operation | Credits | Notes |
|---|---|---|
| Upload & index PDF | 2 | Per document |
| Ask / Summarize | 1 | Per message |
| Edit PDF | 2 | 1 ask + 1 edit |
| Schema extraction | 1 per 10 rows | Batch extraction |
| OCR (scanned PDF) | 3 | Extra processing cost |

### Path to $100K/Month

```
Agency   $299 ×  500 accounts  =  $149,500
Business  $99 ×  400 accounts  =   $39,600
Pro       $29 ×  800 users     =   $23,200
Starter    $9 × 2,000 users    =   $18,000
─────────────────────────────────────────
                    Total       =  $230,300/month
```

Breakeven at 50% above target. Requires:
- 500 agencies → achievable via CA firm partnerships + white-label
- 400 Business plans → CA firms + HR teams
- 800 Pro users → power users, PE analysts
- 2,000 Starter users → individual professionals

---

## 10. Success Metrics

### North Star Metric
**Documents Generated or Processed per Month** — combines uploads, PDF generation, and extractions into one number that reflects actual value delivered.

### Phase Metrics

| Phase | Primary KPI | Target |
|---|---|---|
| 1 (Stability) | Font fix pass rate | 95% of edits visually identical |
| 1 (Stability) | OCR success rate | 90% of scanned PDFs text-extracted |
| 2 (Team) | Team plan conversion | 10% of Pro users upgrade to Team |
| 3 (Factory) | PDFs generated/month | 50,000 by Month 3 |
| 3 (Factory) | Extraction jobs/month | 500 schema extractions/month |
| 4 (Verticals) | CA firm sign-ups | 50 CA firms on Business plan |
| 5 (Growth) | Chrome extension installs | 5,000 in Month 3 |
| 6 (API) | API customers | 20 Agency plan customers |
| 8 (Revenue) | MRR | $100,000 by Month 12 |

### Health Metrics (Track Weekly)
- DAU / MAU ratio (target > 40%)
- Credits consumed per active user per week
- Churn rate per plan (target < 5% monthly for paid)
- Time to first value (target < 5 minutes from sign-up to first Q&A answer)
- NPS (target > 50)

---

## 11. Technical Requirements

### Performance
- PDF upload → indexed and ready for Q&A in < 30 seconds (< 5MB PDF)
- Q&A response in < 5 seconds (P95)
- Bulk generation: 100 PDFs in < 2 minutes
- API: P95 latency < 2 seconds for `/ask`, < 500ms for `/me`

### Reliability
- 99.5% uptime SLA (Starter/Pro)
- 99.9% uptime SLA (Business/Agency)
- Automated retries on Gemini 429 rate limit errors
- Background job retry with exponential backoff (Celery)

### Security
- All data encrypted at rest (AES-256) and in transit (TLS 1.2+)
- PDF files auto-deleted from server after 48 hours (stored in S3)
- JWT tokens expire in 24 hours
- API keys hashed in DB (not stored plaintext)
- GDPR: user can delete all data via account settings

### Scalability
- Celery workers horizontally scalable for bulk generation
- Upstash Vector auto-scales (no infra management)
- Neon PostgreSQL auto-scales compute
- S3 for file storage (no disk limits)

### Compliance Targets
- Month 6: GDPR compliance documentation
- Month 8: SOC 2 Type II audit initiated
- Month 10: ISO 27001 roadmap
- Month 12: HIPAA BAA available (healthcare vertical)

---

## 12. Go-To-Market

### Channels by Phase

**Month 1–2 (Seed users — both individual and business):**
- SEO content: "how to read a PDF without Adobe", "how to edit text in a PDF free", "chat with PDF online" — these are 50K–500K/month searches, high intent, free to rank on
- Reddit: r/india, r/LegalAdviceIndia, r/CharteredAccountant, r/humanresources — answer questions, naturally mention DocuQuery when relevant
- Twitter/X: post "I just asked my rental agreement a question and it answered instantly" demo video — individual users share this
- LinkedIn outreach: CA firms, HR managers, agency owners
- Product Hunt prep
- Target: 500 free users, 50 paying

**Month 2–3 (CA Vertical push):**
- Partner with ICAI student/professional communities
- WhatsApp group outreach (CA study groups)
- Write content: "How AI can save CA firms 60 hours/month"
- Referral: CA refers another CA → both get 2 months free Business plan
- Target: 50 CA firms on Business plan

**Month 3–4 (ProductHunt launch):**
- Feature: Bulk PDF generation (most visually impressive)
- Tagline: "Generate 500 offer letters in 2 minutes"
- Demo video: upload Excel → watch 200 PDFs generate live
- Target: Top 5 product of the day

**Month 4–5 (Agency/White-label):**
- Pitch directly to digital agencies on LinkedIn
- Offer: first month free for agencies who white-label
- Partner with HR tech blogs and CA newsletters
- Target: 20 Agency accounts ($6,000 MRR from this cohort alone)

### Messaging by Persona

| Persona | Hook | Channel |
|---|---|---|
| Everyday user | "Ask your PDF anything. Edit it. Download it. Free." | SEO, Reddit, Twitter/X, WhatsApp |
| Students | "Stop reading 80 pages. Ask the paper what you need to know." | Twitter, Discord, college groups |
| CA firms | "Generate all March filing letters in 20 minutes, not 3 days" | LinkedIn, WhatsApp, ICAI groups |
| HR teams | "Zero manual offer letter prep. Upload Excel, generate 200 letters." | LinkedIn, HR WhatsApp groups |
| Agencies | "Client onboarding docs in 5 minutes, not 4 hours" | IndieHackers, ProductHunt |
| PE analysts | "Extract revenue and EBITDA from 50 CIMs into one spreadsheet" | LinkedIn, Twitter |
| Developers | "PDF generation API. 3 lines of code." | Dev.to, HackerNews |

---

## 13. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Gemini API rate limits / downtime | Medium | High | Cache common responses; fallback to Gemini 1.5 Flash; exponential retry |
| Font preservation fails for uncommon PDFs | High | Medium | Debug log pipeline; fallback font chain; user-facing "font may vary" warning |
| CA vertical doesn't convert as expected | Medium | High | Validate with 5 CA firm interviews before building vertical features |
| Competitor (ChatPDF, PDF.ai) copies template generation | Medium | Medium | Move fast on CA/India vertical — they won't know the GST/ITR nuances |
| Bulk generation jobs fail silently | Medium | High | Celery task tracking, error reports, re-run capability |
| Stripe payment failures cause incorrect credit state | Low | High | Idempotent webhook handlers; credit state locked during payment processing |
| Scanned PDF OCR quality too low for business use | Medium | Medium | Tesseract → fallback to Gemini Vision OCR for complex documents |
| Enterprise sales cycle too long | Low | Medium | Focus on SMB first; enterprise as opportunistic |
| Data breach / security incident | Low | Very High | No plaintext storage of keys/passwords; S3 private buckets; 48h file deletion |

---

## Appendix A — Feature Priority Matrix

| Feature | Impact | Effort | Priority | Phase |
|---|---|---|---|---|
| OCR for scanned PDFs | Very High | Medium | P0 | 1 |
| Smart citations (page numbers) | High | Low | P0 | 1 |
| Schema extraction to table | Very High | High | P0 | 3 |
| Team workspaces | Very High | High | P0 | 2 |
| Bulk PDF generation | Very High | High | P0 | 3 |
| Template studio | Very High | High | P0 | 3 |
| Export chat as PDF | Medium | Low | P1 | 1 |
| Saved prompt templates | Medium | Low | P1 | 1 |
| CA mode features | High | Medium | P1 | 4 |
| Stripe integration | Very High | Medium | P0 | 8 |
| Chrome extension | High | High | P1 | 5 |
| Public shareable links | High | Low | P0 | 5 |
| Google Drive import | Medium | Medium | P1 | 5 |
| Schema extraction API | High | Medium | P0 | 6 |
| White-label | High | Medium | P1 | 6 |
| SSO / SAML | High | High | P2 | 6 |
| Cross-document search | High | Low | P0 | 7 |
| Contract expiry tracker | Medium | Medium | P1 | 7 |
| Self-host / private deploy | Medium | Very High | P3 | 6 |
| SOC2 certification | High (enterprise) | Very High | P3 | — |

---

## Appendix B — API Design (v1)

```
Base URL: https://api.docuquery.com/v1

Authentication: Bearer API key in Authorization header

POST   /documents                    Upload document
GET    /documents/{id}               Get document metadata
DELETE /documents/{id}               Delete document

POST   /ask                          Ask question about document
POST   /generate                     Generate PDF from template + data
POST   /extract                      Extract schema from document(s)
POST   /extract/batch                Batch extract from multiple docs

GET    /templates                    List saved templates
POST   /templates                    Create template
GET    /templates/{id}               Get template
DELETE /templates/{id}               Delete template

GET    /usage                        API usage this month
GET    /credits                      Current credit balance
POST   /webhooks                     Register webhook
DELETE /webhooks/{id}                Deregister webhook

Events emitted via webhook:
  generation.complete
  extraction.complete
  ask.complete
  document.indexed
  credits.low (< 10% remaining)
```

---

*Last updated: June 2026 | Next review: September 2026*
