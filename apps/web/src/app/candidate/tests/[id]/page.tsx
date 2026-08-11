'use client';

import * as React from 'react';
import { TestDetailsPage } from '@/modules/candidate/pages/TestDetailsPage';

export default function CandidateTestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  return (
    <React.Suspense fallback={<div className='flex justify-center p-8'><div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' /></div>}>
      <TestDetailsPage testId={id} />
    </React.Suspense>
  );
}
