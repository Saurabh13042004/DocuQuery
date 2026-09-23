import React, { useState } from 'react';
import { Check, Copy, FileText, ThumbsDown, ThumbsUp, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageType } from '../types';

interface ChatMessageProps {
  message: MessageType;
  onViewEditedPdf?: (url: string) => void;
}

/** Renders **bold** and "- " / "* " bullet lines; everything else is plain text. */
const RichText: React.FC<{ text: string }> = ({ text }) => {
  const inline = (line: string, key: number) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={`${key}-${i}`} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={`${key}-${i}`}>{part}</React.Fragment>
      ),
    );

  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5 marker:text-primary">
        {bullets.map((b, i) => (
          <li key={i}>{inline(b, i)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  text.split('\n').forEach((line, i) => {
    const m = line.match(/^\s*[-*•]\s+(.*)$/);
    if (m) {
      bullets.push(m[1]);
      return;
    }
    flush();
    if (line.trim() === '') return;
    blocks.push(
      <p key={`p-${i}`} className="[&:not(:first-child)]:mt-2">
        {inline(line, i)}
      </p>,
    );
  });
  flush();
  return <>{blocks}</>;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onViewEditedPdf }) => {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const time = new Date(message.timestamp);
  const timeLabel = Number.isNaN(time.getTime())
    ? ''
    : time.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (message.isUser) {
    return (
      <div className="flex animate-rise justify-end">
        <div className="max-w-[88%] sm:max-w-[75%]">
          <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-[0_7px_18px_rgba(37,99,235,0.15)]">
            {message.content}
          </div>
          {timeLabel && <p className="mt-1.5 text-right font-mono text-[10px] text-muted-foreground">{timeLabel}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex animate-rise gap-3">
      <span
        aria-hidden
        className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-[13px] font-extrabold text-primary-foreground"
      >
        D
      </span>
      <div className="min-w-0 max-w-[92%] sm:max-w-[80%]">
        <div className="rounded-2xl rounded-tl-md border bg-card px-4 py-3 text-sm leading-relaxed shadow-[0_1px_2px_rgba(49,93,151,0.05)]">
          <RichText text={message.content} />

          {message.editedPdfUrl && (
            <button
              type="button"
              onClick={() => onViewEditedPdf?.(message.editedPdfUrl!)}
              className="mt-3 flex w-full items-center gap-3 rounded-[9px] border border-success/30 bg-success/5 px-3 py-2.5 text-left transition-colors hover:bg-success/10"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-success/15 text-[#1f7a5a]">
                <Wand2 className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold">Edit applied</span>
                <span className="block text-xs text-muted-foreground">View the edited PDF</span>
              </span>
              <FileText className="h-4 w-4 shrink-0 text-[#1f7a5a]" />
            </button>
          )}

          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
              <span className="kicker">Source</span>
              {message.citations.map((p) => (
                <span
                  key={p}
                  className="rounded-md bg-accent px-2 py-0.5 font-mono text-[11px] font-medium text-primary"
                >
                  Page {p}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            'mt-1.5 flex items-center gap-0.5 transition-opacity',
            'md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100',
          )}
        >
          {timeLabel && <span className="mr-2 font-mono text-[10px] text-muted-foreground">{timeLabel}</span>}
          <button
            type="button"
            aria-label="Good answer"
            aria-pressed={feedback === 'positive'}
            onClick={() => setFeedback(feedback === 'positive' ? null : 'positive')}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-md transition-colors',
              feedback === 'positive' ? 'bg-success/15 text-[#1f7a5a]' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Bad answer"
            aria-pressed={feedback === 'negative'}
            onClick={() => setFeedback(feedback === 'negative' ? null : 'negative')}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-md transition-colors',
              feedback === 'negative' ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Copy answer"
            onClick={handleCopyText}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
