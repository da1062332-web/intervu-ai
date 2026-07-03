'use client';


import { CandidateDashboardHeader } from '@/components/candidate/dashboard/CandidateDashboardHeader';

import { UpcomingTests } from '../components/UpcomingTests';
import { Recommendations } from '../components/Recommendations';
import { PerformanceSnapshot } from '../components/PerformanceSnapshot';
import { AssessmentStatusPanel } from '../components/AssessmentStatusPanel';
import { AttemptHistoryTable } from '../components/AttemptHistoryTable';
import { RecentAttempts } from '../components/RecentAttempts';

export function CandidateDashboard() {
  return (
    <div className='space-y-8 animate-fade-in-up'>
      <CandidateDashboardHeader />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content Column */}
        <div className='lg:col-span-2 flex flex-col gap-8'>
          <AssessmentStatusPanel />
          <UpcomingTests />
          <AttemptHistoryTable />
        </div>

        {/* Sidebar Content Column */}
        <div className='flex flex-col gap-8'>
          <Recommendations />
          <PerformanceSnapshot />
          <RecentAttempts />
        </div>
      </div>
    </div>
  );
}
