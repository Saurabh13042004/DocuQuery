import React, { useId, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ---------- Heading ---------- */

export const AuthHeading: React.FC<{ kicker: string; title: React.ReactNode; subtitle?: React.ReactNode }> = ({
  kicker,
  title,
  subtitle,
}) => (
  <div className="mb-8">
    <div className="kicker mb-4 flex items-center gap-2.5">
      <span className="h-px w-8 bg-primary" />
      {kicker}
    </div>
    <h1 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.055em] sm:text-[38px]">{title}</h1>
    {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
  </div>
);

/* ---------- Alert ---------- */

export const Alert: React.FC<{ tone?: 'error' | 'success' | 'info'; children: React.ReactNode; className?: string }> = ({
  tone = 'error',
  children,
  className,
}) => {
  const styles = {
    error: 'border-destructive/25 bg-destructive/5 text-destructive',
    success: 'border-success/30 bg-success/10 text-[#1f7a5a]',
    info: 'border-primary/20 bg-accent text-accent-foreground',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-[9px] border px-3.5 py-3 text-[13px] font-semibold leading-snug', styles, className)}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
};

/* ---------- Field ---------- */

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  labelAside?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, labelAside, trailing, id, className, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
    return (
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-[13px] font-bold">
            {label}
          </label>
          {labelAside}
        </div>
        <div className="relative">
          <Input
            id={inputId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              'h-11',
              error && 'border-destructive/60 hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/10',
              trailing && 'pr-11',
              className,
            )}
            {...props}
          />
          {trailing}
        </div>
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs font-semibold text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Field.displayName = 'Field';

/* ---------- Password ---------- */

export const PasswordField = React.forwardRef<HTMLInputElement, Omit<FieldProps, 'type' | 'trailing'>>((props, ref) => {
  const [shown, setShown] = useState(false);
  return (
    <Field
      ref={ref}
      {...props}
      type={shown ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[9px] text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
});
PasswordField.displayName = 'PasswordField';

/* ---------- Strength meter ---------- */

const LEVELS = [
  { label: 'Too short', color: 'bg-destructive' },
  { label: 'Weak', color: 'bg-destructive' },
  { label: 'Okay', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-success' },
  { label: 'Strong', color: 'bg-success' },
];

export function passwordScore(value: string): number {
  if (value.length < 8) return 0;
  let score = 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 14) score++;
  return Math.min(score, 4);
}

export const PasswordStrength: React.FC<{ value: string }> = ({ value }) => {
  if (!value) return null;
  const score = passwordScore(value);
  const level = LEVELS[score];
  return (
    <div className="-mt-1" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i <= score ? level.color : 'bg-border')}
          />
        ))}
      </div>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        Password strength: <span className="font-medium text-foreground">{level.label}</span>
      </p>
    </div>
  );
};

/* ---------- Submit ---------- */

export const SubmitButton: React.FC<ButtonProps & { loading?: boolean; loadingText?: string }> = ({
  loading,
  loadingText,
  children,
  disabled,
  className,
  ...props
}) => (
  <Button type="submit" size="lg" className={cn('w-full', className)} disabled={disabled || loading} {...props}>
    {loading ? (
      <>
        <Loader2 className="animate-spin" aria-hidden /> {loadingText ?? 'Please wait…'}
      </>
    ) : (
      children
    )}
  </Button>
);
