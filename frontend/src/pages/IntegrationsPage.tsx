import React from 'react';
import { Cloud, FileSpreadsheet, FileText, MessageSquare, NotebookPen } from 'lucide-react';
import { PageContainer, PageHeader } from '../components/app/ui';

const INTEGRATIONS = [
  { name: 'Google Drive', icon: Cloud, body: 'Import PDFs straight from Drive and save edited copies back.' },
  { name: 'Dropbox', icon: Cloud, body: 'File documents from Dropbox without downloading them first.' },
  { name: 'OneDrive', icon: FileText, body: 'Connect Microsoft OneDrive for Office-heavy teams.' },
  { name: 'Notion', icon: NotebookPen, body: 'Send cited answers to a Notion page or database.' },
  { name: 'Slack', icon: MessageSquare, body: 'Ask your registry questions from any Slack channel.' },
  { name: 'Excel & Sheets', icon: FileSpreadsheet, body: 'Feed a spreadsheet in to generate hundreds of PDFs at once.' },
];

const IntegrationsPage: React.FC = () => (
  <PageContainer wide>
    <PageHeader
      kicker="Connections"
      title="Integrations"
      description="Nothing is connected yet. Here’s what’s on the index."
    />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {INTEGRATIONS.map(({ name, icon: Icon, body }, i) => (
        <div
          key={name}
          className="animate-rise rounded-xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_30px_rgba(49,93,151,0.08)]"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-start justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-[9px] bg-accent text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Pending
            </span>
          </div>
          <h3 className="mt-4 text-[17px] font-extrabold tracking-[-0.03em]">{name}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
      ))}
    </div>
  </PageContainer>
);

export default IntegrationsPage;
