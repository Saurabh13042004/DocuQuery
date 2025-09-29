import React from 'react';
import { Clock, Loader } from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import { useSearch } from '../context/SearchContext';
import DocumentCard from '../components/DocumentCard';
import { Card, CardContent } from '@/components/ui/card';

const RecentPage: React.FC = () => {
  const { documents, isLoading, updateDocument, deleteDocument } = usePdf();
  const { searchQuery } = useSearch();

  // Filter and get recent documents (last 10)
  const recentDocuments = documents
    .filter(doc => {
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .slice(0, 10);

  const handleStarToggle = (id: string, starred: boolean) => {
    updateDocument(id, { starred: !starred });
  };

  const handleMoveToFolder = (id: string, folder: string) => {
    updateDocument(id, { folder });
  };

  const handleDelete = (id: string) => {
    if (deleteDocument) {
      deleteDocument(id);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Recent Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Your last 10 recently accessed documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {recentDocuments.length} document{recentDocuments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading your documents...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && documents.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No recent documents</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Upload some documents to see them appear in your recent list.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Documents List */}
      {!isLoading && recentDocuments.length > 0 && (
        <div className="space-y-3">
          {recentDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              viewMode="list"
              onStarToggle={handleStarToggle}
              onDelete={handleDelete}
              onMoveToFolder={handleMoveToFolder}
            />
          ))}
        </div>
      )}

      {/* No Recent Results */}
      {!isLoading && documents.length > 0 && recentDocuments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <p className="text-muted-foreground mb-4">No recent documents match your search.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecentPage;