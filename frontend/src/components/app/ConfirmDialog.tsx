import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  description,
  confirmLabel = 'Delete',
  busy,
  error,
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div
        className="absolute inset-0 animate-in fade-in bg-foreground/40 backdrop-blur-[2px] duration-200"
        onClick={() => !busy && onCancel()}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative w-full max-w-[400px] animate-in fade-in zoom-in-95 rounded-2xl border bg-card p-6 shadow-[0_30px_80px_rgba(16,33,62,0.25)] duration-200"
      >
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <h2 id="confirm-title" className="text-xl font-extrabold tracking-[-0.04em]">
          {title}
        </h2>
        <p id="confirm-desc" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-[13px] font-semibold text-destructive">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" /> Deleting…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
