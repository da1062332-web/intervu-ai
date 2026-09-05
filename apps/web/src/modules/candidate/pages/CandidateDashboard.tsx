'use client';

import { useMemo } from 'react';
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
import { CandidateSubscriptionSection } from '../components/CandidateSubscriptionSection';
import { CandidateReferralCard } from '../components/CandidateReferralCard';

import { useSubscriptionStore } from '@/store/subscription.store';

export function CandidateDashboard() {
  const { user } = useAuth();
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useCandidateDashboard(user?.id);
  const { data: metrics, isLoading: isMetricsLoading } = useCandidateDashboardMetrics(user?.id);

  const hasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const planSlug = useSubscriptionStore((state) => state.planSlug);
  const planName = useSubscriptionStore((state) => state.planName);

  const isReferralUnlocked = useMemo(() => {
    if (!hasActivePlan) return false;
    return (
      planSlug === 'referral-pass' ||
      Boolean(planName?.toLowerCase().includes('referral'))
    );
  }, [hasActivePlan, planSlug, planName]);

  // Exclude the hero assessment displayed in CandidateOverviewCard from AvailableAssessmentSection
  const filteredDashboard = useMemo(() => {
    if (!dashboard) return null;
    const activeTest = dashboard.availableTests.find(
      (t) =>
        t.hasActiveAttempt ||
        (dashboard.activeTests &&
          dashboard.activeTests.some((a) => a.testId === t.id || a.id === t.id)),
    );
    const enrolled = dashboard.availableTests.find((t) => t.status === 'ENROLLED');
    const referral = isReferralUnlocked
      ? dashboard.availableTests.find((t) => t.status === 'ENROLLED' || t.canReattempt) ||
        dashboard.availableTests[0]
      : null;
    const paid = hasActivePlan ? dashboard.availableTests[0] : null;

    const heroId = (activeTest || enrolled || referral || paid)?.id;
    if (!heroId) return dashboard;

    return {
      ...dashboard,
      availableTests: dashboard.availableTests.filter((t) => t.id !== heroId),
    };
  }, [dashboard, isReferralUnlocked, hasActivePlan]);

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
        isLoading={isDashboardLoading && isMetricsLoading}
      />

      {/* Side-by-side Layout: Available Assessments & Attempt History with matched heights */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch'>
        {/* Left Area (7 cols on desktop): Available Assessments 2x2 Grid */}
        <div className='lg:col-span-7 h-full'>
          <AvailableAssessmentSection
            dashboard={filteredDashboard}
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

      {/* 7. Plans & Subscription Status Section */}
      <CandidateSubscriptionSection />

      {/* 8. Dynamic Referral Program Section */}
      <CandidateReferralCard />
    </div>
  );
}
