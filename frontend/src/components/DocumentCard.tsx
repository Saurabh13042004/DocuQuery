import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Star, MoreVertical, MessageSquare, Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Document {
  id: string;
  name: string;
  updatedAt?: string;
  folder?: string;
  starred?: boolean;
}

interface DocumentCardProps {
  document: Document;
  viewMode: 'grid' | 'list';
  onStarToggle: (id: string, starred: boolean) => void;
  onDelete: (id: string) => void;
  onMoveToFolder: (id: string, folder: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  viewMode,
  onStarToggle,
  onDelete,
  onMoveToFolder,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (viewMode === 'list') {
    return (
      <TooltipProvider>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/app/chat/${document.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors truncate"
                      >
                        {document.name}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{document.name}</p>
                    </TooltipContent>
                  </Tooltip>
                  {document.folder && (
                    <Badge variant="secondary" className="text-xs">
                      {document.folder}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Updated {formatDate(document.updatedAt || '')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600"
                      onClick={() => onStarToggle(document.id, !!document.starred)}
                    >
                      <Star className={`h-4 w-4 ${document.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{document.starred ? 'Remove from starred' : 'Add to starred'}</p>
                  </TooltipContent>
                </Tooltip>

                <Link to={`/app/chat/${document.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onMoveToFolder(document.id, 'Work')}>
                      Move to Work
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveToFolder(document.id, 'Personal')}>
                      Move to Personal
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(document.id)} className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // Grid view
  return (
    <TooltipProvider>
      <Card className="hover:shadow-md transition-shadow group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600"
                    onClick={() => onStarToggle(document.id, !!document.starred)}
                  >
                    <Star className={`h-4 w-4 ${document.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{document.starred ? 'Remove from starred' : 'Add to starred'}</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onMoveToFolder(document.id, 'Work')}>
                    Move to Work
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMoveToFolder(document.id, 'Personal')}>
                    Move to Personal
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(document.id)} className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/app/chat/${document.id}`}
                  className="block font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                >
                  {document.name}
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{document.name}</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(document.updatedAt || '')}
              </div>
              {document.folder && (
                <Badge variant="secondary" className="text-xs">
                  {document.folder}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border">
            <Link to={`/app/chat/${document.id}`}>
              <Button size="sm" className="w-full gap-2">
                <MessageSquare className="h-3 w-3" />
                Chat
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default DocumentCard;