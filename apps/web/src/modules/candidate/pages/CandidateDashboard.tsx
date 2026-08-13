'use client';

import { CandidateDashboardHeader } from '@/components/candidate/dashboard/CandidateDashboardHeader';
import {
  useCandidateDashboard,
  useCandidateDashboardMetrics,
} from '../hooks/useCandidateDashboard';
import { useAuth } from '@/hooks/use-auth';
import { CandidateOverviewCard } from '../components/CandidateOverviewCard';
import { CandidateKpiSection } from '../components/CandidateKpiSection';
import { AvailableAssessmentSection } from '../components/AvailableAssessmentSection';
import { CandidateHistorySection } from '../components/CandidateHistorySection';
import { CandidateProgressSection } from '../components/CandidateProgressSection';

export function CandidateDashboard() {
  const { user } = useAuth();
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useCandidateDashboard(user?.id);
  const { data: metrics, isLoading: isMetricsLoading } = useCandidateDashboardMetrics(user?.id);

  return (
    <div className='mx-auto w-full max-w-[1440px] px-6 sm:px-8 md:px-12 lg:px-16 py-6 md:py-8 space-y-7 md:space-y-8 animate-fade-in-up'>
      {/* 1. Big Welcome Header */}
      <CandidateDashboardHeader />

      {/* 2. Recently Added / Active Assessment Hero Card */}
      <CandidateOverviewCard dashboard={dashboard} isLoading={isDashboardLoading} />

      {/* 3. KPI Stat Cards */}
      <CandidateKpiSection
        dashboard={dashboard}
        metrics={metrics}
        isLoading={isDashboardLoading || isMetricsLoading}
      />

      {/* Side-by-side Layout: Available Assessments & Attempt History with matched heights */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch'>
        {/* Left Area (7 cols on desktop): Available Assessments 2x2 Grid */}
        <div className='lg:col-span-7 h-full'>
          <AvailableAssessmentSection
            dashboard={dashboard}
            isLoading={isDashboardLoading}
            error={dashboardError}
            compact={true}
          />
        </div>

        {/* Right Area (5 cols on desktop): Attempt History Card Feed */}
        <div className='lg:col-span-5 h-full'>
          <CandidateHistorySection compact={true} />
        </div>
      </div>

      {/* 6. Progress Analytics (Side-by-side cards at the bottom) */}
      <CandidateProgressSection compact={true} />
    </div>
  );
}
