import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, FileText, Quote } from 'lucide-react';

export type AuthVariant = 'login' | 'signup' | 'recovery';

const PANEL: Record<AuthVariant, { title: React.ReactNode; body: string; points: string[] }> = {
  login: {
    title: (
      <>
        Your registry,
        <br />
        <em>right where you left it.</em>
      </>
    ),
    body: 'Every document, answer and edit is filed and ready to query.',
    points: ['Answers stamped to the exact page', 'Edits that keep the original formatting'],
  },
  signup: {
    title: (
      <>
        Stop reading 40 pages
        <br />
        <em>to find one answer.</em>
      </>
    ),
    body: 'Upload a PDF and ask it a question. Free, no card required.',
    points: ['20 free credits to start', 'Cited answers you can verify', 'Fix text in plain English'],
  },
  recovery: {
    title: (
      <>
        Locked out?
        <br />
        <em>It happens to everyone.</em>
      </>
    ),
    body: 'Reset links are single-use and expire after 30 minutes.',
    points: ['Your documents stay private', 'Nothing changes until you confirm'],
  },
};

const BrandPanel: React.FC<{ variant: AuthVariant }> = ({ variant }) => {
  const copy = PANEL[variant];
  return (
    <aside
      aria-hidden={false}
      className="bg-blueprint relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
    >
      <div
        className="pointer-events-none absolute inset-0 animate-grid-drift opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(#c1dafa 1px, transparent 1px), linear-gradient(90deg, #c1dafa 1px, transparent 1px)',
          backgroundSize: '31px 31px',
          maskImage: 'linear-gradient(135deg, transparent, #000 35%, #000 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(135deg, transparent, #000 35%, #000 70%, transparent)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(255,255,255,0.55),transparent)]" />

      <div className="kicker relative z-10 px-12 pt-10">Registry No. 001</div>

      {/* Product mock */}
      <div className="relative z-10 mx-auto my-6 h-[340px] w-full max-w-[460px] px-6" aria-hidden>
        <div className="absolute left-6 top-4 w-[250px] animate-float-y rounded-xl bg-white p-5 shadow-[0_22px_48px_rgba(70,109,165,0.17)] [rotate:-4deg]">
          <div className="flex justify-between font-mono text-[9px] text-[#98a8bc]">
            <span className="rounded bg-[#ef6868] px-1.5 py-1 text-white">PDF</span>
            <span>INDEXED</span>
          </div>
          <FileText className="mt-5 h-10 w-10 text-[#a8c7f9]" strokeWidth={1.4} />
          <p className="mt-3 text-[19px] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground">
            RENTAL
            <br />
            AGREEMENT
          </p>
          <p className="mt-2 text-[10px] text-[#8190a7]">04 pages · 2.4 MB</p>
          <div className="mt-5 grid gap-[7px]">
            <i className="block h-[5px] w-[92%] rounded bg-[#e8eff9]" />
            <i className="block h-[5px] w-[78%] rounded bg-[#e8eff9]" />
            <i className="block h-[5px] w-[64%] rounded bg-[#b6d2fb]" />
            <i className="block h-[5px] w-[86%] rounded bg-[#e8eff9]" />
          </div>
        </div>

        <div
          className="absolute right-2 top-16 w-[220px] animate-float-y rounded-xl border border-[#d9e8fb] bg-white p-4 shadow-[0_12px_24px_rgba(70,109,165,0.13)]"
          style={{ animationDelay: '-2.5s' }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8296b0]">Answer</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#50657e]">
            You need to give <strong className="text-foreground">30 days’ written notice</strong> under the termination
            clause.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <Quote className="h-3 w-3" /> Page 4 · §9.2
          </p>
        </div>

        <div
          className="absolute bottom-3 left-2 flex animate-float-y items-center gap-3 rounded-[10px] border border-[#dbe8fa] bg-white px-4 py-3 shadow-[0_12px_24px_rgba(70,109,165,0.13)]"
          style={{ animationDelay: '-4.5s' }}
        >
          <div>
            <p className="font-mono text-[9px] text-[#8093ae]">EDITED IN</p>
            <p className="mt-1 text-[13px] font-bold">1.8 seconds</p>
          </div>
          <Check className="h-4 w-4 text-[#23a777]" />
        </div>
      </div>

      <div className="relative z-10 px-12 pb-12">
        <h2 className="text-[34px] font-normal leading-[1.08] tracking-[-0.055em] [&_em]:not-italic [&_em]:text-primary">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">{copy.body}</p>
        <ul className="mt-5 space-y-2.5">
          {copy.points.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-[13px] font-bold">
              <Check className="h-4 w-4 text-success" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

interface AuthShellProps {
  variant: AuthVariant;
  children: React.ReactNode;
}

const AuthShell: React.FC<AuthShellProps> = ({ variant, children }) => (
  <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <Link to="/" className="flex items-center gap-[9px] font-extrabold tracking-[-0.04em]" aria-label="DocuQuery home">
          <span className="grid h-[29px] w-[29px] place-items-center rounded-[9px] bg-primary text-base text-primary-foreground">
            D
          </span>
          <span className="text-[19px]">DocuQuery</span>
        </Link>
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-[400px] animate-rise">{children}</div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 pb-6 sm:px-10 sm:pb-8">
        <span className="kicker">© {new Date().getFullYear()} DocuQuery</span>
        <nav className="flex gap-5 text-xs font-semibold text-muted-foreground" aria-label="Legal">
          <Link to="/privacy-policy" className="transition-colors hover:text-primary">
            Privacy
          </Link>
          <Link to="/terms-of-service" className="transition-colors hover:text-primary">
            Terms
          </Link>
          <Link to="/contact" className="transition-colors hover:text-primary">
            Help
          </Link>
        </nav>
      </footer>
    </div>

    <BrandPanel variant={variant} />
  </div>
);

export default AuthShell;
