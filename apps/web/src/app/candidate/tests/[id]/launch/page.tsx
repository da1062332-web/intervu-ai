'use client';

import * as React from 'react';
import { TestLaunchPage } from '@/modules/candidate/pages/TestLaunchPage';

export default function CandidateTestLaunchPage({ params }: { params: Promise<{ id: string }> }) {
  // @ts-expect-error - React.use is not in current types
  const { id } = React.use(params);

  return <TestLaunchPage testId={id} />;
}
