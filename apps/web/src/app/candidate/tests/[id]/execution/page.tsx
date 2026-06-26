'use client';

import { useParams } from 'next/navigation';
import { useExecution } from '@/features/candidate/execution/hooks/useExecution';
import { ExecutionLayout } from '@/features/candidate/execution/components/ExecutionLayout';
import { ExecutionSkeleton } from '@/features/candidate/execution/components/ExecutionSkeleton';
import { ExecutionError } from '@/features/candidate/execution/components/ExecutionError';

export default function AssessmentExecutionPage() {
  const params = useParams();
  const id = params?.id as string;

  const { loading, error } = useExecution(id);

  if (loading) {
    return <ExecutionSkeleton />;
  }

  if (error || !id) {
    return <ExecutionError error={error || 'Invalid Assessment ID'} />;
  }

  return <ExecutionLayout />;
}
