'use client';

import * as React from 'react';
import { TestInstructionsPage } from '@/modules/candidate/pages/TestInstructionsPage';

export default function CandidateTestInstructionsPage({ params }: { params: Promise<{ id: string }> }) {
  // @ts-expect-error - React.use is not in current types
  const { id } = React.use(params);

  return <TestInstructionsPage testId={id} />;
}
