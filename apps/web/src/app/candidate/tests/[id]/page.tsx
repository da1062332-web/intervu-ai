'use client';

import * as React from 'react';
import { TestDetailsPage } from '@/modules/candidate/pages/TestDetailsPage';

export default function CandidateTestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // @ts-expect-error - React.use is not in current types
  const { id } = React.use(params);

  return <TestDetailsPage testId={id} />;
}
