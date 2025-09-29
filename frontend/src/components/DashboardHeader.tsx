import React from 'react';
import { Search, Filter, Grid3X3, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardHeaderProps {
  onUploadClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterCategory: string;
  onFilterChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onUploadClick,
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="border-b border-border bg-background">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">My Documents</h1>
            <p className="text-sm text-muted-foreground">Manage and organize your PDF documents</p>
          </div>
          <Button onClick={onUploadClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Upload PDF
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter */}
          <Select value={filterCategory} onValueChange={onFilterChange}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="starred">Starred</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>
          
          {/* View Mode */}
          <div className="flex border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-7 w-7 p-0"
            >
              <Grid3X3 className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-7 w-7 p-0"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;