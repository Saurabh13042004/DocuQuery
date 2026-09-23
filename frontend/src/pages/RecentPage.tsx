import React, { useMemo } from 'react';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocumentBrowser from '../components/app/DocumentBrowser';
import { EmptyState, PageContainer, PageHeader } from '../components/app/ui';
import { usePdf } from '../context/PdfContext';
import { useOutletContext } from 'react-router-dom';
import type { AppOutletContext } from '../components/Layout';

const RecentPage: React.FC = () => {
  const { documents, isLoading } = usePdf();
  const { openUpload } = useOutletContext<AppOutletContext>();

  const recent = useMemo(
    () =>
      [...documents]
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 10),
    [documents],
  );

  return (
    <PageContainer>
      <PageHeader kicker="Recently filed" title="Recent" description="Your ten most recently filed documents." />
      <DocumentBrowser
        documents={recent}
        isLoading={isLoading}
        sortable={false}
        empty={
          <EmptyState
            icon={<Clock className="h-6 w-6" />}
            title="Nothing filed recently"
            description="Documents you upload will show up here, newest first."
            action={
              <Button onClick={openUpload}>
                <Plus /> Upload PDF
              </Button>
            }
          />
        }
      />
    </PageContainer>
  );
};

export default RecentPage;
