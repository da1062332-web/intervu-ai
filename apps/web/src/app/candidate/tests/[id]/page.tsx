'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { TestDetailsPage } from '@/modules/candidate/pages/TestDetailsPage';

export default function CandidateTestDetailsPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  return (
    <React.Suspense fallback={<div className='flex justify-center p-8'><div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' /></div>}>
      <TestDetailsPage testId={id} />
    </React.Suspense>
  );
}
