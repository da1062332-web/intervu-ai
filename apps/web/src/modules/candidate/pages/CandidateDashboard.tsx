'use client';

import { CandidateDashboardHeader } from '@/components/candidate/dashboard/CandidateDashboardHeader';

import { UpcomingTests } from '../components/UpcomingTests';
import { PerformanceSnapshot } from '../components/PerformanceSnapshot';
import { AssessmentStatusPanel } from '../components/AssessmentStatusPanel';
import { AttemptHistoryTable } from '../components/AttemptHistoryTable';

export function CandidateDashboard() {
  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      <CandidateDashboardHeader />

      <div className='flex flex-col gap-8'>
        {/* Top metrics row */}
        <PerformanceSnapshot />

        {/* Assessment Panels (2-column layout) */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <AssessmentStatusPanel />
          <UpcomingTests />
        </div>

        {/* History Table */}
        <div className='w-full'>
          <AttemptHistoryTable />
        </div>
      </div>
    </div>
  );
}
