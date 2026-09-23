import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Menu,
  Minus,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/landing.css';

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { href: '#features', id: 'features', label: 'Features' },
  { href: '#method', id: 'method', label: 'Method' },
  { href: '#membership', id: 'membership', label: 'Membership' },
  { href: '#index', id: 'index', label: 'Index' },
];

const FILE_TYPES = [
  'Rental agreements',
  'Offer letters',
  'Loan documents',
  'Research papers',
  'Bank statements',
  'Contracts',
  'Government notices',
];

interface DemoDoc {
  key: string;
  initials: string;
  name: string;
  file: string;
  pages: number;
  question: string;
  answer: React.ReactNode;
  cite: string;
  before: string;
  after: string;
  seconds: string;
}

const DEMO_DOCS: DemoDoc[] = [
  {
    key: 'rental',
    initials: 'RA',
    name: 'Rental agreement',
    file: 'RENTAL_AGREEMENT.PDF',
    pages: 4,
    question: 'What’s the notice period if I want to vacate early?',
    answer: (
      <>
        You need to give <strong>30 days’ written notice</strong> under the termination clause.
      </>
    ),
    cite: 'Page 4 · §9.2',
    before: 'Dear Jhon Doe,',
    after: 'Dear John Doe,',
    seconds: '1.8',
  },
  {
    key: 'loan',
    initials: 'LS',
    name: 'Loan sanction',
    file: 'LOAN_SANCTION.PDF',
    pages: 8,
    question: 'What was the total loan amount and the interest rate?',
    answer: (
      <>
        The sanctioned amount is <strong>₹12,00,000</strong> at <strong>8.9% p.a.</strong> reducing balance.
      </>
    ),
    cite: 'Page 2 · §3.1',
    before: 'Sanctioned on 12 Mar 2026',
    after: 'Sanctioned on 21 Mar 2026',
    seconds: '2.1',
  },
  {
    key: 'offer',
    initials: 'OL',
    name: 'Offer letter',
    file: 'OFFER_LETTER.PDF',
    pages: 3,
    question: 'What’s my joining date and annual CTC?',
    answer: (
      <>
        You join on <strong>1 April 2026</strong> with an annual CTC of <strong>₹14,50,000</strong>.
      </>
    ),
    cite: 'Page 1 · §2',
    before: 'Annual CTC: ₹14,00,000',
    after: 'Annual CTC: ₹14,50,000',
    seconds: '1.6',
  },
];

const STEPS = [
  {
    title: 'File it',
    body: 'Drag in a contract, offer letter, research paper, or scanned notice. It is accessioned and ready to query in seconds.',
  },
  {
    title: 'Query or amend it',
    body: '“What’s the notice period in clause 9?” or “Change the date to March 3rd.” The registry understands both requests.',
  },
  {
    title: 'Take the card',
    body: 'A cited answer, stamped to the exact page it came from — or a corrected file, ready to download.',
  },
];

const ROADMAP = [
  { title: 'Understand', live: true, body: 'Chat with any PDF, answers stamped to the exact page.' },
  { title: 'Edit', live: true, body: 'Fix text in place, in plain English, in a couple of seconds.' },
  { title: 'Generate', live: false, body: 'Turn a spreadsheet into hundreds of branded PDFs at once.' },
  { title: 'Extract', live: false, body: 'Pull structured fields out of a batch of PDFs into a table.' },
];

const COMPARISON = [
  { tool: 'ChatPDF / PDF.ai', chat: true, edit: false, cited: false, price: '$0–20/mo' },
  { tool: 'Adobe Acrobat', chat: false, edit: true, cited: false, price: '$20–30/mo' },
  { tool: 'DocuQuery', chat: true, edit: true, cited: true, price: '$0–29/mo', ours: true },
];

const PLANS = [
  {
    key: 'Free',
    price: 'Free',
    per: '',
    blurb: 'Try it on your next PDF',
    credits: '20 one-time credits',
    features: ['PDF Q&A with citations', 'Real-time PDF editing', 'Personal registry', 'Community support'],
    cta: 'Enroll free',
  },
  {
    key: 'Starter',
    price: '$9',
    per: '/ month',
    blurb: 'For individuals who file weekly',
    credits: '500 credits / month',
    features: [
      'Everything in Free',
      '500 credits every month',
      'Export exchanges to Markdown/text',
      'Email support',
    ],
    cta: 'Join Starter',
    featured: true,
  },
  {
    key: 'Pro',
    price: '$29',
    per: '/ month',
    blurb: 'For power users and growing teams',
    credits: '2,000 credits / month',
    features: ['Everything in Starter', '2,000 credits every month', 'API access', 'Priority support'],
    cta: 'Join Pro',
  },
];

const TARIFF = [
  { label: 'File & index a PDF', cost: '2 cr' },
  { label: 'Ask a question', cost: '1 cr' },
  { label: 'Edit a PDF', cost: '2 cr' },
];

const FAQS = [
  {
    q: 'How does the real-time PDF editing actually work?',
    a: 'Tell DocuQuery what to change — like “change the name from John to Adam” — and it locates the text, edits it in place, and preserves the original font and spacing.',
  },
  {
    q: 'Can I trust the answers, or do I need to double-check everything?',
    a: 'Every answer includes a source page and section so you can verify the original text in context before acting on it.',
  },
  {
    q: 'What file types are supported?',
    a: 'DocuQuery is built for PDFs: contracts, statements, papers, notices, letters, and scanned documents.',
  },
  {
    q: 'Is my document data secure?',
    a: 'Your registry is private by default. Documents are handled for your workspace and never used as public training material.',
  },
  {
    q: 'How do credits work?',
    a: 'Indexing costs 2 credits, questions cost 1 credit, and edits cost 2 credits. Free members receive 20 one-time credits.',
  },
  {
    q: 'Do you support bulk document generation or data extraction?',
    a: 'Those accessions are on the index. Understand and Edit are live today; Generate and Extract are next.',
  },
];

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Membership', href: '#membership' },
    { label: 'Index', href: '#index' },
    { label: 'Sign up', to: '/signup' },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Careers', to: '/careers' },
    { label: 'Contact', to: '/contact' },
  ],
  Legal: [
    { label: 'Privacy', to: '/privacy-policy' },
    { label: 'Terms', to: '/terms-of-service' },
    { label: 'Security', to: '/security' },
    { label: 'GDPR', to: '/gdpr' },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade elements marked [data-reveal] in once they scroll into view. */
function useReveal(root: React.RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }

    el.classList.add('is-ready');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    targets.forEach((t) => io.observe(t));
    return () => {
      io.disconnect();
      el.classList.remove('is-ready');
    };
  }, [root]);
}

/** Tracks scroll progress and which nav section is in view. */
function useScrollState(ids: string[]) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 12);
      progressRef.current?.style.setProperty('--p', String(max > 0 ? window.scrollY / max : 0));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: '-40% 0px -55% 0px' },
    );
    ids.forEach((id) => {
      const node = document.getElementById(id);
      if (node) io.observe(node);
    });
    return () => io.disconnect();
  }, [ids]);

  return { scrolled, active, progressRef };
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const SectionLabel: React.FC<{ left: string; right: React.ReactNode }> = ({ left, right }) => (
  <div className="section-label" data-reveal>
    <span>{left}</span>
    <span>{right}</span>
  </div>
);

const Logo: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <Link to="/" className="logo" onClick={onClick} aria-label="DocuQuery home">
    <span className="logo-mark">D</span>
    DocuQuery
    <small>REGISTRY NO. 001</small>
  </Link>
);

const FaqItem: React.FC<{
  index: number;
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}> = ({ index, q, a, open, onToggle }) => (
  <div className={`faq-item${open ? ' is-open' : ''}`}>
    <h3>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`faq-panel-${index}`}
        id={`faq-q-${index}`}
        onClick={onToggle}
      >
        <span>{String(index + 1).padStart(2, '0')}</span>
        <b>{q}</b>
        <ChevronDown size={18} aria-hidden />
      </button>
    </h3>
    <div className="faq-panel" id={`faq-panel-${index}`} role="region" aria-labelledby={`faq-q-${index}`}>
      <div>
        <p>{a}</p>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const heroArtRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [docIndex, setDocIndex] = useState(0);
  const [demoPaused, setDemoPaused] = useState(false);

  const ctaTo = isAuthenticated ? '/app' : '/signup';
  const ctaLabel = isAuthenticated ? 'Open workspace' : 'Start free';
  const doc = DEMO_DOCS[docIndex];

  useReveal(rootRef);
  const sectionIds = NAV_LINKS.map((l) => l.id);
  const { scrolled, active, progressRef } = useScrollState(sectionIds);

  useEffect(() => {
    const previous = document.title;
    document.title = 'DocuQuery — Chat with your PDF. Edit it just as fast.';
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    const onResize = () => window.innerWidth > 800 && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  // Cycle the demo documents until the visitor takes over.
  useEffect(() => {
    if (demoPaused || prefersReducedMotion()) return;
    const id = window.setInterval(() => setDocIndex((i) => (i + 1) % DEMO_DOCS.length), 7000);
    return () => window.clearInterval(id);
  }, [demoPaused]);

  const onHeroMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const el = heroArtRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const onHeroLeave = () => {
    heroArtRef.current?.style.setProperty('--mx', '0');
    heroArtRef.current?.style.setProperty('--my', '0');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="lp" ref={rootRef}>
      {/* ---------------- Nav ---------------- */}
      <header className={`nav-wrap${scrolled ? ' scrolled' : ''}`}>
        <nav className="nav" aria-label="Primary">
          <Logo onClick={closeMenu} />
          <button
            type="button"
            className="menu-button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-links"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className={`nav-links${menuOpen ? ' open' : ''}`} id="nav-links">
            {NAV_LINKS.map((l) => (
              <a
                key={l.id}
                href={l.href}
                className={active === l.id ? 'active' : undefined}
                onClick={closeMenu}
              >
                {l.label}
              </a>
            ))}
            {!isAuthenticated && (
              <Link to="/login" className="nav-login" onClick={closeMenu}>
                Log in
              </Link>
            )}
            <Link to={ctaTo} className="button button-small" onClick={closeMenu}>
              {isAuthenticated ? 'Open app' : 'Start free'} <ArrowRight size={14} />
            </Link>
          </div>
        </nav>
        <div className="progress" ref={progressRef} aria-hidden />
      </header>

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              REGISTRY NO. 001
            </div>
            <h1>
              Chat with your PDF.
              <br />
              <span>Edit it just as fast.</span>
            </h1>
            <p className="hero-sub">
              Upload any PDF, ask it questions in plain English, and get an answer stamped to the exact page. Need a
              fix instead? Tell DocuQuery what to change and watch it land in seconds.
            </p>
            <div className="hero-actions">
              <Link to={ctaTo} className="button">
                {ctaLabel} <ArrowRight size={16} />
              </Link>
              <a href="#method" className="text-button">
                See the method <ArrowRight size={16} />
              </a>
            </div>
            <div className="hero-proof">
              <Check size={14} aria-hidden />
              <span>20 free credits</span>
              <i aria-hidden />
              <span>No card needed</span>
            </div>
          </div>

          <div className="hero-art" ref={heroArtRef} onPointerMove={onHeroMove} onPointerLeave={onHeroLeave}>
            <div className="blueprint-grid" aria-hidden />
            <div className="floating-file" aria-hidden>
              <div className="file-top">
                <span className="pdf-pill">PDF</span>
                <span>INDEXED</span>
              </div>
              <FileText size={44} strokeWidth={1.4} />
              <b>
                RENTAL
                <br />
                AGREEMENT
              </b>
              <small>04 pages · 2.4 MB</small>
              <div className="file-lines">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="hero-note note-one">
              <span>ANSWER FOUND</span>
              <b>Page 4 · §9.2</b>
            </div>
            <div className="hero-note note-two">
              <span>EDITED IN</span>
              <b>1.8 seconds</b>
              <Check size={15} aria-hidden />
            </div>
          </div>
        </section>

        {/* ---------------- File types ---------------- */}
        <section className="file-types" aria-label="Document types">
          <p>What gets filed here</p>
          <div className="marquee">
            <div className="marquee-track">
              {[0, 1].map((copy) =>
                FILE_TYPES.map((t) => (
                  <React.Fragment key={`${copy}-${t}`}>
                    <span aria-hidden={copy === 1 || undefined}>{t}</span>
                    <b aria-hidden>/</b>
                  </React.Fragment>
                )),
              )}
            </div>
          </div>
        </section>

        {/* ---------------- Workspace demo ---------------- */}
        <section className="workspace-section" id="workspace">
          <SectionLabel
            left="02 / THE WORKSPACE"
            right={
              <span className="live-dot">
                <i />
                LIVE DEMO
              </span>
            }
          />
          <div
            className="workspace-shell"
            data-reveal
            onMouseEnter={() => setDemoPaused(true)}
            onFocus={() => setDemoPaused(true)}
          >
            <aside className="doc-sidebar">
              <div className="sidebar-head">
                <span>Your registry</span>
                <Link to={ctaTo}>
                  <UploadCloud size={14} aria-hidden /> Add file
                </Link>
              </div>
              <div className="doc-list" role="tablist" aria-label="Sample documents">
                {DEMO_DOCS.map((d, i) => (
                  <button
                    key={d.key}
                    type="button"
                    role="tab"
                    aria-selected={i === docIndex}
                    className={`doc-item${i === docIndex ? ' active' : ''}`}
                    onClick={() => {
                      setDocIndex(i);
                      setDemoPaused(true);
                    }}
                  >
                    <span className="doc-icon">{d.initials}</span>
                    <span>
                      <b>{d.name}</b>
                      <small>{d.file}</small>
                    </span>
                    <CheckCircle2 size={17} aria-hidden />
                  </button>
                ))}
              </div>
              <div className="credit-meter">
                <div>
                  <span>Free credits</span>
                  <span>
                    <b>20</b> <em>/ 20</em>
                  </span>
                </div>
                <div className="meter" aria-hidden>
                  <i />
                </div>
                <small>Good for your first filing.</small>
              </div>
            </aside>

            <div className="workspace-main" role="tabpanel">
              <div className="workspace-toolbar">
                <span>
                  <FileText size={15} aria-hidden />
                  <span>{doc.file}</span>
                </span>
                <span className="toolbar-status">
                  <i />
                  Indexed {doc.pages} pages
                </span>
              </div>
              <div className="workspace-grid">
                <div className="query-panel" key={`q-${doc.key}`}>
                  <div className="panel-kicker">
                    <Sparkles size={14} aria-hidden /> ASK &amp; VERIFY
                  </div>
                  <h3>{doc.question}</h3>
                  <div className="answer-card">
                    <div className="answer-label">Answer</div>
                    <p>{doc.answer}</p>
                    <span className="citation">
                      <Quote size={13} aria-hidden /> {doc.cite} <ArrowRight size={13} aria-hidden />
                    </span>
                  </div>
                  <div className="ask-row">
                    <Search size={16} aria-hidden />
                    <span>Ask another question…</span>
                    <Link to={ctaTo} className="ask-btn">
                      Ask <ArrowRight size={13} aria-hidden />
                    </Link>
                  </div>
                </div>
                <div className="edit-panel" key={`e-${doc.key}`}>
                  <div className="panel-kicker">
                    <Wand2 size={14} aria-hidden /> EDIT LOG
                  </div>
                  <div className="edit-card">
                    <div className="edit-tag">
                      <span>Amendment</span>
                      <span>EDITED · {doc.seconds}S</span>
                    </div>
                    <p>
                      <span className="old">{doc.before}</span>
                    </p>
                    <p className="corrected">
                      {doc.after} <Check size={14} aria-hidden />
                    </p>
                    <div className="edit-rule" />
                    <Link to={ctaTo}>
                      Download edited PDF <ArrowRight size={14} aria-hidden />
                    </Link>
                  </div>
                  <div className="preserve-note">
                    <ShieldCheck size={18} aria-hidden />
                    <span>
                      Original formatting preserved
                      <br />
                      <b>Normal PDF output, not a screenshot</b>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Method ---------------- */}
        <section className="section-wrap band band-white method" id="method">
          <SectionLabel left="03 / THE METHOD" right="HOW IT WORKS" />
          <div className="method-head" data-reveal>
            <h2 className="section-title">
              One document.
              <br />
              <em>Three clean moves.</em>
            </h2>
            <p>
              Not a chatbot bolted onto a PDF viewer — a registry built around getting a real answer, or a real fix,
              out of your document.
            </p>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.title} data-reveal style={{ '--d': `${i * 110}ms` } as React.CSSProperties}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <ArrowUpRight size={18} aria-hidden />
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section className="section-wrap feature-section" id="features">
          <SectionLabel left="04 / EVERYTHING ON FILE" right="BUILT FOR THE FULL LOOP" />
          <div className="feature-grid">
            <div className="feature-intro" data-reveal>
              <h2 className="section-title">
                Ask anything.
                <br />
                <em>Verify everything.</em>
              </h2>
              <p>
                Ask your document a question in plain language and get an answer grounded in the actual text — with
                the page and section stamped on the card.
              </p>
              <ul className="check-list">
                {[
                  'Every answer cites its source page',
                  'Click a citation to jump straight to it',
                  'Works on contracts, statements, papers, notices',
                ].map((t) => (
                  <li key={t}>
                    <Check size={16} aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="loan-card" data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>
              <div>
                <span>LOAN_SANCTION.PDF</span>
                <span className="blue-tag">CITED</span>
              </div>
              <p>“What was the total loan amount and the interest rate?”</p>
              <blockquote>
                The sanctioned amount is <strong>₹12,00,000</strong> at <strong>8.9% p.a.</strong> reducing balance.
              </blockquote>
              <span className="citation">
                Page 2 · §3.1 <ArrowRight size={13} aria-hidden />
              </span>
            </div>
          </div>
        </section>

        {/* ---------------- Roadmap ---------------- */}
        <section className="section-wrap band band-tint accession" id="index">
          <SectionLabel left="05 / ACCESSION LOG" right="THE ROAD AHEAD" />
          <div className="accession-head" data-reveal>
            <h2 className="section-title">
              Generate. Understand.
              <br />
              <em>Extract. Repeat.</em>
            </h2>
            <p>The full loop we’re building toward. Two stages are live.</p>
          </div>
          <div className="accession-grid">
            {ROADMAP.map((r, i) => (
              <div
                className={`accession-item${r.live ? '' : ' pending'}`}
                key={r.title}
                data-reveal
                style={{ '--d': `${i * 90}ms` } as React.CSSProperties}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                <h3>
                  {r.title}
                  <small>{r.live ? 'Live' : 'Pending'}</small>
                </h3>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Audience ---------------- */}
        <section className="section-wrap audience">
          <SectionLabel left="06 / PATRON FILES" right="WHO IT’S FOR" />
          <div className="audience-grid">
            <article data-reveal>
              <div className="audience-label">Individual</div>
              <h3>
                For anyone
                <br />
                with a PDF
              </h3>
              <p>
                You got a document on WhatsApp or email and just need to know what it says — or fix a typo before you
                sign it.
              </p>
              <ul>
                <li>“What’s the notice period in my lease?”</li>
                <li>“Fix the typo in my name”</li>
                <li>“Pull the methodology section”</li>
              </ul>
            </article>
            <article className="dark" data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>
              <div className="audience-label">Business</div>
              <h3>
                For CA firms,
                <br />
                HR teams &amp; agencies
              </h3>
              <p>
                Query and edit any client file in seconds. Next accession: generate hundreds of filing or offer
                letters from one spreadsheet.
              </p>
              <ul>
                <li>Answer engagement letter questions instantly</li>
                <li>Correct a CTC or name before sending</li>
                <li>Bulk-generate letters from Excel</li>
              </ul>
            </article>
          </div>
        </section>

        {/* ---------------- Comparison ---------------- */}
        <section className="section-wrap band band-white comparison">
          <SectionLabel left="07 / CROSS-REFERENCE" right="NO COMPROMISES" />
          <h2 className="section-title" data-reveal>
            Chat tools can’t edit.
            <br />
            <em>Editors can’t chat.</em>
          </h2>
          <div className="table-scroll" data-reveal>
            <div className="compare-table" role="table" aria-label="Feature comparison">
              <div className="table-row table-head" role="row">
                <span role="columnheader">Tool</span>
                <span role="columnheader">Chat</span>
                <span role="columnheader">Edit</span>
                <span role="columnheader">Cited</span>
                <span role="columnheader">Price</span>
              </div>
              {COMPARISON.map((r) => (
                <div className={`table-row${r.ours ? ' ours' : ''}`} role="row" key={r.tool}>
                  <span role="cell">{r.tool}</span>
                  {[r.chat, r.edit, r.cited].map((v, i) => (
                    <span role="cell" key={i}>
                      {v ? (
                        <Check size={16} aria-label="Yes" />
                      ) : (
                        <Minus size={14} className="dash" aria-label="No" />
                      )}
                    </span>
                  ))}
                  <span role="cell">{r.price}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Pricing ---------------- */}
        <section className="section-wrap band band-tint pricing" id="membership">
          <SectionLabel left="08 / MEMBERSHIP" right="PAY ONLY IF YOU FILE WEEKLY" />
          <div className="pricing-head" data-reveal>
            <h2 className="section-title">
              Start free.
              <br />
              <em>Stay in control.</em>
            </h2>
            <p>No trials that expire, no card required to try it.</p>
          </div>
          <div className="pricing-grid">
            {PLANS.map((p, i) => (
              <div
                className={`price-card${p.featured ? ' featured' : ''}`}
                key={p.key}
                data-reveal
                style={{ '--d': `${i * 100}ms` } as React.CSSProperties}
              >
                {p.featured && <span className="most-filed">MOST FILED</span>}
                <div className="price-name">{p.key}</div>
                <h3>
                  {p.price}
                  {p.per && <small>{p.per}</small>}
                </h3>
                <p>{p.blurb}</p>
                <b className="credits">{p.credits}</b>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>
                      <Check size={15} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={ctaTo} className={p.featured ? 'button' : 'outline-button'}>
                  {p.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
          <div className="tariff" data-reveal>
            <span>Credit tariff</span>
            {TARIFF.map((t) => (
              <b key={t.label}>
                {t.label} <i>{t.cost}</i>
              </b>
            ))}
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section className="section-wrap band band-white faq">
          <SectionLabel left="09 / CARD INDEX" right="COMMON QUESTIONS" />
          <div className="faq-grid">
            <h2 className="section-title" data-reveal>
              Worth knowing
              <br />
              <em>before filing.</em>
            </h2>
            <div data-reveal style={{ '--d': '100ms' } as React.CSSProperties}>
              {FAQS.map((f, i) => (
                <FaqItem
                  key={f.q}
                  index={i}
                  q={f.q}
                  a={f.a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Closing CTA ---------------- */}
        <section className="closing">
          <div className="closing-mark" data-reveal aria-hidden>
            DQ
          </div>
          <h2 data-reveal style={{ '--d': '80ms' } as React.CSSProperties}>
            Stop reading 40 pages
            <br />
            <em>to find one answer.</em>
          </h2>
          <p data-reveal style={{ '--d': '160ms' } as React.CSSProperties}>
            Upload your first PDF and ask it a question — free, no card required.
          </p>
          <div data-reveal style={{ '--d': '240ms' } as React.CSSProperties}>
            <Link to={ctaTo} className="button">
              {ctaLabel} <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="footer">
        <div>
          <Logo />
          <p>
            The registry for chatting with,
            <br />
            editing, and understanding your PDFs.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <b>{heading}</b>
              {links.map((l) =>
                'to' in l ? (
                  <Link key={l.label} to={l.to}>
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.label} href={l.href}>
                    {l.label}
                  </a>
                ),
              )}
            </div>
          ))}
        </nav>
        <small>© {new Date().getFullYear()} DocuQuery — All rights reserved</small>
      </footer>
    </div>
  );
};

export default LandingPage;
