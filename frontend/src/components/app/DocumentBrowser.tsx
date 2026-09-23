import React, { useMemo, useState } from 'react';
import { LayoutGrid, List, Search, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import DocumentCard from '../DocumentCard';
import ConfirmDialog from './ConfirmDialog';
import { Skeleton } from './ui';
import { usePdf } from '../../context/PdfContext';
import { useSearch } from '../../context/SearchContext';
import { DocumentType } from '../../types';

type Tab = 'all' | 'starred' | 'shared';
type Sort = 'newest' | 'oldest' | 'name';

interface DocumentBrowserProps {
  documents: DocumentType[];
  isLoading: boolean;
  /** Shown when there are no documents at all (before any search/filter). */
  empty: React.ReactNode;
  /** Show the All / Starred / Shared tabs. */
  tabs?: boolean;
  /** Show the sort control. */
  sortable?: boolean;
}

const VIEW_KEY = 'docuquery:view';

const DocumentBrowser: React.FC<DocumentBrowserProps> = ({ documents, isLoading, empty, tabs, sortable = true }) => {
  const { updateDocument, deleteDocument } = usePdf();
  const { searchQuery, setSearchQuery } = useSearch();
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });
  const [pendingDelete, setPendingDelete] = useState<DocumentType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const changeView = (v: 'grid' | 'list') => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* not critical */
    }
  };

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = documents.filter((d) => {
      if (tab === 'starred' && !d.starred) return false;
      if (tab === 'shared' && !d.shared) return false;
      return !q || d.name.toLowerCase().includes(q);
    });
    if (sortable) {
      list = [...list].sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        const diff = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        return sort === 'oldest' ? -diff : diff;
      });
    }
    return list;
  }, [documents, searchQuery, tab, sort, sortable]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    const ok = await deleteDocument(pendingDelete.id);
    setDeleting(false);
    if (ok) setPendingDelete(null);
    else setDeleteError('Couldn’t delete this document. Please try again.');
  };

  if (!isLoading && documents.length === 0) return <>{empty}</>;

  const counts = {
    all: documents.length,
    starred: documents.filter((d) => d.starred).length,
    shared: documents.filter((d) => d.shared).length,
  };

  return (
    <section aria-label="Documents">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents…"
            aria-label="Search documents"
            className="h-10 w-full rounded-[9px] border border-input bg-card pl-10 pr-9 text-sm transition-all placeholder:text-muted-foreground/70 hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {tabs && (
            <div role="tablist" aria-label="Filter documents" className="flex rounded-[9px] border bg-card p-1">
              {(['all', 'starred', 'shared'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-colors',
                    tab === t ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t} <span className="ml-0.5 font-mono text-[10px] opacity-60">{counts[t]}</span>
                </button>
              ))}
            </div>
          )}
          {sortable && (
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-10 w-[140px] rounded-[9px] text-[13px] font-bold" aria-label="Sort documents">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
              </SelectContent>
            </Select>
          )}
          <div role="group" aria-label="Layout" className="flex rounded-[9px] border bg-card p-1">
            {(
              [
                ['grid', LayoutGrid, 'Grid view'],
                ['list', List, 'List view'],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                aria-label={label}
                aria-pressed={view === mode}
                onClick={() => changeView(mode)}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-md transition-colors',
                  view === mode ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'space-y-2'}>
          {Array.from({ length: view === 'grid' ? 6 : 4 }).map((_, i) => (
            <Skeleton key={i} className={view === 'grid' ? 'h-[210px] rounded-xl' : 'h-[66px] rounded-xl'} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="text-sm font-bold">No documents match.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? `Nothing filed under “${searchQuery}”.` : 'Try a different filter.'}
          </p>
          {(searchQuery || tab !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTab('all');
              }}
              className="mt-4 text-[13px] font-bold text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'space-y-2',
          )}
        >
          {visible.map((doc, i) => (
            <div key={doc.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <DocumentCard
                document={doc}
                viewMode={view}
                onStarToggle={(id, starred) => updateDocument(id, { starred: !starred })}
                onDelete={() => {
                  setDeleteError('');
                  setPendingDelete(doc);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this document?"
          description={
            <>
              <strong className="text-foreground">{pendingDelete.name}</strong> and its chat history will be permanently
              removed. This can’t be undone.
            </>
          }
          busy={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
};

export default DocumentBrowser;
