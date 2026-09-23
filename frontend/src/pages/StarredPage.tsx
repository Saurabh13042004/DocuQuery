import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DocumentBrowser from '../components/app/DocumentBrowser';
import { EmptyState, PageContainer, PageHeader } from '../components/app/ui';
import { usePdf } from '../context/PdfContext';

const StarredPage: React.FC = () => {
  const { documents, isLoading } = usePdf();
  const starred = useMemo(() => documents.filter((d) => d.starred), [documents]);

  return (
    <PageContainer>
      <PageHeader kicker="Pinned" title="Starred" description="Documents you’ve starred for quick access." />
      <DocumentBrowser
        documents={starred}
        isLoading={isLoading}
        empty={
          <EmptyState
            icon={<Star className="h-6 w-6" />}
            title="No starred documents"
            description="Star a document from your dashboard and it will be pinned here."
            action={
              <Button asChild>
                <Link to="/app">Go to dashboard</Link>
              </Button>
            }
          />
        }
      />
    </PageContainer>
  );
};

export default StarredPage;
