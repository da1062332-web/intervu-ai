'use client';

import * as React from 'react';
import { TestInstructionsPage } from '@/modules/candidate/pages/TestInstructionsPage';

export default function CandidateTestInstructionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = (React as any).use(params);

  return (
    <React.Suspense fallback={<div className='flex justify-center p-8'><div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' /></div>}>
      <TestInstructionsPage testId={id} />
    </React.Suspense>
  );
}
