'use client';

import { EmptyStateCard } from '@/components/ui/empty-state';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <EmptyStateCard
      title='No Assessments Found'
      description="We couldn't find any assessments matching your filters. Try clearing them or searching something else."
      icon={<Search className='text-muted-foreground size-6' />}
      actionLabel='Reset Filters'
      onAction={onReset}
      cardClassName='min-h-[350px] p-6'
    />
  );
}
