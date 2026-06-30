'use client';

import React from 'react';
import { WorkflowDetail } from '@/modules/workflows';
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkflowDetailPage(props: PageProps) {
  const params = (React as any).use(props.params);

  return (
    <div className='container mx-auto py-8 max-w-[1400px]'>
      <WorkflowDetail examId={params.id} />
    </div>
  );
}
