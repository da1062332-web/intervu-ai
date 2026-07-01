'use client';

import { useCandidateDashboard } from '../hooks/useCandidateDashboard';
import { CandidateDashboardHeader } from '@/components/candidate/dashboard/CandidateDashboardHeader';
import { CandidateDashboardSkeleton } from '@/components/candidate/dashboard/CandidateDashboardSkeleton';
import { CandidateDashboardError } from '@/components/candidate/dashboard/CandidateDashboardError';
import { UpcomingTests } from '../components/UpcomingTests';
import { Recommendations } from '../components/Recommendations';
import { PerformanceSnapshot } from '../components/PerformanceSnapshot';
import { AssessmentStatusPanel } from '../components/AssessmentStatusPanel';
import { AttemptHistoryTable } from '../components/AttemptHistoryTable';
import { RecentAttempts } from '../components/RecentAttempts';

export function CandidateDashboard() {
  const { data, isLoading, error, refetch } = useCandidateDashboard();

  if (isLoading) {
    return <CandidateDashboardSkeleton />;
  }

  if (error || !data) {
    return <CandidateDashboardError error={error || 'No data found'} onRetry={refetch} />;
  }

  return (
    <div className='space-y-8 animate-fade-in-up'>
      <CandidateDashboardHeader />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content Column */}
        <div className='lg:col-span-2 flex flex-col gap-8'>
          <AssessmentStatusPanel />
          <UpcomingTests tests={data.availableTests} />
          <AttemptHistoryTable />
        </div>

        {/* Sidebar Content Column */}
        <div className='flex flex-col gap-8'>
          <Recommendations recommendations={data.recommendations} />
          <PerformanceSnapshot skills={data.skillProgress} />
          <RecentAttempts history={data.completedAttempts || []} />
        </div>
      </div>
    </div>
  );
}
