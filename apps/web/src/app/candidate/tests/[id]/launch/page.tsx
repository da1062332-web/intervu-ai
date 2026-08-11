'use client';

import * as React from 'react';
import { TestLaunchPage } from '@/modules/candidate/pages/TestLaunchPage';

export default function CandidateTestLaunchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  return (
    <React.Suspense
      fallback={
        <div className='flex justify-center p-8'>
          <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
        </div>
      }
    >
      <TestLaunchPage testId={id} />
    </React.Suspense>
  );
}
