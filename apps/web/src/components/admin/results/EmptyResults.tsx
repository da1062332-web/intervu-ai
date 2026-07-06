import React from 'react';
import { ClipboardList } from 'lucide-react';
import { EmptyStateCard } from '@/components/ui/empty-state';

export function EmptyResults() {
  return (
    <EmptyStateCard
      title='No evaluation results yet.'
      description='Results will appear once evaluation is completed.'
      icon={<ClipboardList className='h-8 w-8' />}
      cardClassName='h-64'
    />
  );
}
