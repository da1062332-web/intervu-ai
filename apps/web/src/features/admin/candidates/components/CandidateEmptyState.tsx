'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface CandidateEmptyStateProps {
  isSearchOrFilterActive?: boolean;
  onResetFilters?: () => void;
  title?: string;
  description?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export function CandidateEmptyState({
  isSearchOrFilterActive = false,
  onResetFilters,
  title,
  description,
  error = null,
  onRetry,
}: CandidateEmptyStateProps) {
  if (error) {
    return (
      <EmptyState
        variant="error"
        title={title || 'Failed to load candidate data'}
        description={error.message || 'An unexpected server error occurred while loading candidates.'}
        actionLabel={onRetry ? 'Try Again' : undefined}
        onAction={onRetry}
        className="my-12 py-12 border rounded-lg bg-muted/20"
      />
    );
  }

  if (isSearchOrFilterActive) {
    return (
      <EmptyState
        variant="no-results"
        title="No matching candidates found"
        description="We couldn't find any candidates matching your search term or active filters. Try clearing filters."
        actionLabel={onResetFilters ? 'Clear Filters' : undefined}
        onAction={onResetFilters}
        className="my-12 py-12 border rounded-lg bg-muted/20"
      />
    );
  }

  return (
    <EmptyState
      variant="no-data"
      icon={<Users className="w-12 h-12 text-muted-foreground/60" />}
      title={title || 'No candidates enrolled yet'}
      description={description || 'Candidates will automatically appear here once they register or take assessments.'}
      className="my-12 py-12 border rounded-lg bg-muted/20"
    />
  );
}
