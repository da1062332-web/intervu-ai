'use client';

import { AttemptHistoryTable } from '../components/AttemptHistoryTable';
import { History } from 'lucide-react';

export function CandidateHistoryPage() {
  return (
    <div className='space-y-6 animate-fade-in-up pb-8'>
      <div className='flex items-center gap-3 border-b pb-6'>
        <div className='bg-primary/10 p-2.5 rounded-lg'>
          <History className='size-6 text-primary' />
        </div>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Assessment History</h1>
          <p className='text-muted-foreground'>
            Review your previous attempts, scores, and access detailed reports.
          </p>
        </div>
      </div>

      <AttemptHistoryTable showFilters defaultLimit={10} />
    </div>
  );
}
