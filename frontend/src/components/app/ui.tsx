import React from 'react';
import { cn } from '@/lib/utils';

/** Scrollable page body with consistent gutters and max width. */
export const PageContainer: React.FC<{ children: React.ReactNode; className?: string; wide?: boolean }> = ({
  children,
  className,
  wide,
}) => (
  <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10', wide ? 'max-w-[1280px]' : 'max-w-6xl', className)}>
    {children}
  </div>
);

/** Kicker + title + description on the left, actions on the right. */
export const PageHeader: React.FC<{
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ kicker, title, description, actions, className }) => (
  <div className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="min-w-0 animate-rise">
      {kicker && (
        <div className="kicker mb-3 flex items-center gap-2.5">
          <span className="h-px w-7 bg-primary" />
          {kicker}
        </div>
      )}
      <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.05em] sm:text-[34px]">{title}</h1>
      {description && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/** Mono label with a rule underneath, as used between landing sections. */
export const SectionLabel: React.FC<{ left: React.ReactNode; right?: React.ReactNode; className?: string }> = ({
  left,
  right,
  className,
}) => (
  <div className={cn('kicker mb-4 flex items-center justify-between gap-4 border-b pb-3', className)}>
    <span>{left}</span>
    {right && <span>{right}</span>}
  </div>
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => (
  <div
    className={cn(
      'bg-blueprint relative overflow-hidden rounded-2xl border px-6 py-14 text-center sm:py-16',
      className,
    )}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_50%,rgba(255,255,255,0.85),transparent)]" />
    <div className="relative mx-auto flex max-w-sm flex-col items-center">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary shadow-[0_12px_24px_rgba(70,109,165,0.13)]">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold tracking-[-0.04em]">{title}</h3>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('relative overflow-hidden rounded-lg bg-[#e9f0fa]', className)}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
  </div>
);
