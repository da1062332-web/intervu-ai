'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { TestLaunchPage } from '@/modules/candidate/pages/TestLaunchPage';

export default function CandidateTestLaunchPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

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
