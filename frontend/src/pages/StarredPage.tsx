import React from 'react';
import { Star, Loader } from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import { useSearch } from '../context/SearchContext';
import DocumentCard from '../components/DocumentCard';
import { Card, CardContent } from '@/components/ui/card';

const StarredPage: React.FC = () => {
  const { documents, isLoading, updateDocument, deleteDocument } = usePdf();
  const { searchQuery } = useSearch();

  // Filter and get starred documents
  const starredDocuments = documents
    .filter(doc => {
      if (!doc.starred) return false;
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });

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
            <Star className="h-6 w-6" />
            Starred Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Documents you've marked as favorites
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {starredDocuments.length} document{starredDocuments.length !== 1 ? 's' : ''}
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

      {/* Empty Starred State */}
      {!isLoading && starredDocuments.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No starred documents</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Star your important documents to quickly access them later. Click the star icon on any document to add it here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Starred Documents List */}
      {!isLoading && starredDocuments.length > 0 && (
        <div className="space-y-3">
          {starredDocuments.map((doc) => (
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
    </div>
  );
};

export default StarredPage;