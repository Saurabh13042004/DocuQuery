import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, MessageSquare, MoreHorizontal, Star, Trash2, Users } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DocumentType } from '../types';

interface DocumentCardProps {
  document: DocumentType;
  viewMode: 'grid' | 'list';
  onStarToggle: (id: string, starred: boolean) => void;
  onDelete: (id: string) => void;
}

const MS_DAY = 86_400_000;

/** "Today", "Yesterday", "3 days ago", then a plain date. */
export function formatFiled(iso: string): { short: string; full: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { short: '—', full: '' };
  const full = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / MS_DAY);
  if (days <= 0) return { short: 'Today', full };
  if (days === 1) return { short: 'Yesterday', full };
  if (days < 7) return { short: `${days} days ago`, full };
  return { short: full, full };
}

const title = (name: string) => name.replace(/\.pdf$/i, '');

const Actions: React.FC<Pick<DocumentCardProps, 'document' | 'onStarToggle' | 'onDelete'> & { className?: string }> = ({
  document: doc,
  onStarToggle,
  onDelete,
  className,
}) => (
  <div
    className={cn(
      'relative z-10 flex items-center gap-0.5 transition-opacity',
      // Always visible on touch; on hover-capable screens reveal on hover/focus unless starred.
      'md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:data-[open=true]:opacity-100',
      doc.starred && 'md:opacity-100',
      className,
    )}
  >
    <button
      type="button"
      onClick={() => onStarToggle(doc.id, doc.starred)}
      aria-pressed={doc.starred}
      aria-label={doc.starred ? `Remove ${doc.name} from starred` : `Star ${doc.name}`}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Star className={cn('h-4 w-4', doc.starred && 'fill-amber-400 text-amber-400')} />
    </button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${doc.name}`}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link to={`/app/chat/${doc.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Open
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStarToggle(doc.id, doc.starred)}>
          <Star className="mr-2 h-4 w-4" /> {doc.starred ? 'Unstar' : 'Star'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(doc.id)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

const DocumentCard: React.FC<DocumentCardProps> = ({ document: doc, viewMode, onStarToggle, onDelete }) => {
  const filed = formatFiled(doc.uploadedAt);

  if (viewMode === 'list') {
    return (
      <article className="group relative flex items-center gap-3 rounded-xl border bg-card px-3 py-3 transition-all duration-200 hover:border-primary/30 hover:shadow-[0_10px_30px_rgba(49,93,151,0.08)] sm:gap-4 sm:px-4">
        <Link to={`/app/chat/${doc.id}`} className="absolute inset-0 z-0 rounded-xl" aria-label={`Open ${doc.name}`} />
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] bg-accent text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold">{title(doc.name)}</h3>
          <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>PDF</span>
            <span aria-hidden>·</span>
            <span title={filed.full}>Filed {filed.short}</span>
            {doc.shared && (
              <span className="inline-flex items-center gap-1 text-success">
                <Users className="h-3 w-3" /> Shared
              </span>
            )}
          </p>
        </div>
        <Actions document={doc} onStarToggle={onStarToggle} onDelete={onDelete} />
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-[#a3b3c8] transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_22px_45px_rgba(49,93,151,0.1)]">
      <Link to={`/app/chat/${doc.id}`} className="absolute inset-0 z-0" aria-label={`Open ${doc.name}`} />

      <div className="bg-blueprint relative h-32 overflow-hidden">
        <div className="absolute left-1/2 top-5 w-[104px] -translate-x-1/2 rotate-[-4deg] rounded-lg bg-white p-3 shadow-[0_14px_28px_rgba(70,109,165,0.2)] transition-transform duration-300 group-hover:rotate-[-2deg] group-hover:-translate-y-1">
          <span className="rounded bg-[#ef6868] px-1.5 py-0.5 font-mono text-[8px] text-white">PDF</span>
          <div className="mt-3 grid gap-1.5">
            <i className="block h-1 w-full rounded bg-[#e8eff9]" />
            <i className="block h-1 w-4/5 rounded bg-[#e8eff9]" />
            <i className="block h-1 w-3/5 rounded bg-[#b6d2fb]" />
            <i className="block h-1 w-[90%] rounded bg-[#e8eff9]" />
          </div>
        </div>
        <Actions document={doc} onStarToggle={onStarToggle} onDelete={onDelete} className="absolute right-2 top-2" />
        {doc.shared && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-success">
            <Users className="h-3 w-3" /> Shared
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug">{title(doc.name)}</h3>
        <p className="mt-auto pt-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground" title={filed.full}>
          Filed {filed.short}
        </p>
      </div>
    </article>
  );
};

export default DocumentCard;
