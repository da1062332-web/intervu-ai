'use client';

import { useParams } from 'next/navigation';
import { useExecution } from '@/features/candidate/execution/hooks/useExecution';
import { ExecutionLayout } from '@/features/candidate/execution/components/ExecutionLayout';
import { ExecutionSkeleton } from '@/features/candidate/execution/components/ExecutionSkeleton';
import { ExecutionError } from '@/features/candidate/execution/components/ExecutionError';
import { AssessmentErrorBoundary } from '@/features/candidate/execution/components/errors/AssessmentErrorBoundary';
import { SessionExpired } from '@/features/candidate/execution/components/errors/SessionExpired';
import { AssessmentUnavailable } from '@/features/candidate/execution/components/errors/AssessmentUnavailable';
import { NetworkRecovery } from '@/features/candidate/execution/components/errors/NetworkRecovery';

export default function AssessmentExecutionPage() {
  const params = useParams();
  const id = params?.id as string;

  const { loading, error } = useExecution(id);

  if (loading) {
    return <ExecutionSkeleton />;
  }

  if (!id) {
    return <ExecutionError error='Invalid Assessment ID' />;
  }

  if (error) {
    switch (error) {
      case 'EXPIRED':
        return <SessionExpired />;
      case 'NOT_FOUND':
      case 'FORBIDDEN':
      case 'UNAUTHORIZED':
        return <AssessmentUnavailable />;
      case 'OFFLINE': // Handled via network monitor
        return <NetworkRecovery />;
      default:
        return <ExecutionError error={error} />;
    }
  }

  return (
    <AssessmentErrorBoundary>
      <ExecutionLayout />
    </AssessmentErrorBoundary>
  );
}
