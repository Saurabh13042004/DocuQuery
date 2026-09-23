import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePdf } from '../context/PdfContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { uploadPDF } from '../services/api';

interface UploadModalProps {
  onClose: () => void;
}

const MAX_MB = 10;
const UPLOAD_COST = 2; // credits — keep in step with COSTS["upload"] in the backend

const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  const { fetchUserDocuments } = usePdf();
  const { refreshUser, team, user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !isUploading && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isUploading, onClose]);

  const pick = (candidate: File | undefined) => {
    if (!candidate) return;
    setError(null);
    if (candidate.type !== 'application/pdf' && !candidate.name.toLowerCase().endsWith('.pdf')) {
      setError('That isn’t a PDF. Choose a .pdf file.');
      return;
    }
    if (candidate.size > MAX_MB * 1024 * 1024) {
      setError(`That file is over the ${MAX_MB} MB limit.`);
      return;
    }
    setFile(candidate);
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadPDF(file, !!team && shared);
      await fetchUserDocuments();
      refreshUser().catch(() => {}); // keep the credit counter live
      onClose();
    } catch (e) {
      const res = axios.isAxiosError(e) ? e.response : undefined;
      const detail = res?.data?.detail;
      setError(
        res?.status === 402
          ? `Not enough credits. ${typeof detail === 'object' ? detail?.message ?? '' : detail ?? ''}`.trim()
          : 'Couldn’t upload this document. Please try again.',
      );
      setIsUploading(false);
    }
  };

  const enough = (user?.credits ?? UPLOAD_COST) >= UPLOAD_COST;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end p-0 sm:place-items-center sm:p-4">
      <div
        className="absolute inset-0 animate-in fade-in bg-foreground/40 backdrop-blur-[2px] duration-200"
        onClick={() => !isUploading && onClose()}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        className="relative w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-4 rounded-t-2xl border bg-card shadow-[0_30px_80px_rgba(16,33,62,0.25)] duration-300 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
          <div>
            <div className="kicker mb-2">New accession</div>
            <h2 id="upload-title" className="text-2xl font-extrabold tracking-[-0.05em]">
              Upload a PDF
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              pick(e.dataTransfer.files[0]);
            }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 border-dashed px-5 py-9 text-center transition-all duration-200',
              isDragging
                ? 'scale-[1.01] border-primary bg-accent'
                : file
                  ? 'border-success/50 bg-success/5'
                  : 'border-[#c8dafa] bg-[#f7faff] hover:border-primary/60',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => pick(e.target.files?.[0])}
            />

            {file ? (
              <div className="flex items-center gap-3 text-left">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-[0_8px_18px_rgba(70,109,165,0.13)]">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{file.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-white hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-card text-primary shadow-[0_8px_18px_rgba(70,109,165,0.13)]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold">Drag a PDF here</p>
                <p className="mt-1 text-[13px] text-muted-foreground">or</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => inputRef.current?.click()}>
                  Browse files
                </Button>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  PDF · up to {MAX_MB} MB
                </p>
              </>
            )}

            {isUploading && (
              <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-[#dbe8f9]">
                <div className="h-full w-1/3 animate-[upload-slide_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
              </div>
            )}
          </div>

          {team && (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px] font-bold">
              <input
                type="checkbox"
                checked={shared}
                onChange={(e) => setShared(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />
              Share with {team.name}
            </label>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-[9px] border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-[13px] font-semibold text-destructive"
            >
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <CheckCircle2 className={cn('h-3.5 w-3.5', enough ? 'text-success' : 'text-destructive')} />
              {UPLOAD_COST} credits to file &amp; index
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" /> Filing…
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
