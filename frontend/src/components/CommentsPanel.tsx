import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getComments, addComment, toggleComment } from '../services/api';
import { CommentType } from '../types';

interface CommentsPanelProps {
  documentId: number;
  onCount?: (open: number) => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ documentId, onCount }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [error, setError] = useState('');

  const update = (next: CommentType[]) => {
    setComments(next);
    onCount?.(next.filter((c) => !c.resolved).length);
  };

  useEffect(() => {
    getComments(documentId).then(update).catch(() => setError('Could not load comments'));
  }, [documentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const c = await addComment(documentId, text, page ? parseInt(page) : undefined);
      update([...comments, c]);
      setText('');
      setPage('');
    } catch {
      setError('Could not post comment');
    }
  };

  const resolve = async (id: number) => {
    const c = await toggleComment(id);
    update(comments.map((x) => (x.id === id ? c : x)));
  };

  return (
    <div className="border-b bg-background p-4 max-h-64 overflow-y-auto space-y-3 shrink-0">
      {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
      {comments.map((c) => (
        <div key={c.id} className={`text-sm ${c.resolved ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <b className="text-foreground">{c.user_name}</b>
              {c.page ? ` · p.${c.page}` : ''} · {new Date(c.created_at).toLocaleString()}
            </span>
            <button onClick={() => resolve(c.id)} className="flex items-center gap-1 hover:text-foreground">
              <Check className="h-3 w-3" /> {c.resolved ? 'Reopen' : 'Resolve'}
            </button>
          </div>
          <p className="mt-0.5">{c.content}</p>
        </div>
      ))}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <form onSubmit={submit} className="flex gap-2">
        <Input className="h-8 text-sm" placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} />
        <Input className="h-8 w-16 text-sm" type="number" min={1} placeholder="Page" value={page} onChange={(e) => setPage(e.target.value)} />
        <Button type="submit" size="sm" className="h-8" disabled={!text.trim()}>Post</Button>
      </form>
    </div>
  );
};

export default CommentsPanel;
