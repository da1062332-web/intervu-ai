'use client';

import Link from 'next/link';
import { useTestDetails } from '../hooks/useTestDetails';
import { useCandidateDashboard } from '../hooks/useCandidateDashboard';
import { TestOverview } from '../components/TestOverview';
import { SyllabusBreakdown } from '../components/SyllabusBreakdown';
import { SectionBreakdown } from '../components/SectionBreakdown';
import { EligibilityInfo } from '../components/EligibilityInfo';
import { EnrollmentCard } from '../components/EnrollmentCard';
import { useEnrollments } from '../hooks/useEnrollments';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useSubscriptionStore } from '@/store/subscription.store';
import { MonthlyQuotaWarning } from '../components/MonthlyQuotaWarning';
import {
  TestDetailsSkeleton,
  MetadataSkeleton,
} from '@/features/candidate/tests/components/TestDiscoveryLoaders';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';
import { ChevronLeft, ArrowRight } from 'lucide-react';

interface TestDetailsPageProps {
  testId: string;
}

export function TestDetailsPage({ testId }: TestDetailsPageProps) {
  const { user } = useAuth();
  const { data: test, isLoading, error, refetch } = useTestDetails(testId);
  const { data: enrollmentsData } = useEnrollments(user?.id);

  const { data: dashboardData } = useCandidateDashboard(user?.id);

  const hasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const entitlements = useSubscriptionStore((state) => state.entitlements);
  const currentPeriodEnd = useSubscriptionStore((state) => state.currentPeriodEnd);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);
  const checkSubscription = useSubscriptionStore((state) => state.checkSubscription);
  const loadEntitlements = useSubscriptionStore((state) => state.loadEntitlements);

  useEffect(() => {
    if (hasActivePlan === null || !entitlements) {
      checkSubscription().then((active) => {
        if (active) loadEntitlements();
      });
    }
  }, [hasActivePlan, entitlements, checkSubscription, loadEntitlements]);

  const monthlyRoundsRemaining = entitlements?.features?.monthlyRoundsRemaining;
  const monthlyRoundsLimit = entitlements?.features?.monthlyRoundsLimit;

  // Candidate has active plan and zero remaining monthly rounds
  const isQuotaExhausted = Boolean(
    hasActivePlan &&
      monthlyRoundsRemaining !== null &&
      monthlyRoundsRemaining !== undefined &&
      monthlyRoundsRemaining <= 0
  );

  const enrollment = enrollmentsData?.enrollments?.find((e: any) => e.testId === testId);
  const isCompleted = dashboardData?.completedAttempts?.some((c) => c.testId === testId);
  const isActive = dashboardData?.activeTests?.some((a) => a.testId === testId);

  const availableTest = dashboardData?.availableTests?.find((t) => t.id === testId);
  
  const completedCount = dashboardData?.completedAttempts?.filter((c) => c.testId === testId).length || 0;
  const maxAttempts = availableTest?.maxAttempts ?? null;
  const canReAttempt = availableTest?.canReattempt ?? (maxAttempts !== null ? completedCount < maxAttempts : true);

  const enrollmentStatus = isActive
    ? 'STARTED'
    : (isCompleted && !canReAttempt)
      ? 'COMPLETED'
      : (isCompleted && canReAttempt)
        ? 'RE_EXAM'
        : enrollment
          ? enrollment.status
          : 'AVAILABLE';

  if (isLoading) {
    return (
      <div className='flex flex-col min-h-screen pb-20'>
        <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
          <div className='container max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='icon' disabled className='shrink-0'>
                <ChevronLeft className='size-5' />
              </Button>
              <div className='h-6 w-32 bg-muted rounded animate-pulse' />
            </div>
          </div>
        </div>

        <main className='flex-1 container max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
              <TestDetailsSkeleton />
            </div>
            <div className='lg:col-span-1 space-y-6'>
              <MetadataSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !test) {
    return (
      <TestDiscoveryError
        error={new Error(error || 'Failed to load test details')}
        reset={refetch}
      />
    );
  }

  return (
    <div className='flex flex-col min-h-screen pb-20'>
      <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
        <div className='container max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              asChild
              className='shrink-0 hover:bg-muted/50 rounded-xl transition-colors'
            >
              <Link href='/candidate/tests'>
                <ChevronLeft className='size-5' />
              </Link>
            </Button>
            <h1 className='text-xl font-heading font-semibold tracking-tight text-foreground'>
              Test Overview
            </h1>
          </div>
        </div>
      </div>

      <main className='flex-1 container max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6'>
        {/* Early Monthly Quota Warning Banner */}
        {isQuotaExhausted && !isActive && (
          <MonthlyQuotaWarning
            monthlyRoundsRemaining={monthlyRoundsRemaining}
            monthlyRoundsLimit={monthlyRoundsLimit}
            currentPeriodEnd={currentPeriodEnd || entitlements?.currentPeriodEnd}
            hasActivePlan={hasActivePlan}
            onUpgrade={openPricingModal}
          />
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content Column */}
          <div className='lg:col-span-2 flex flex-col space-y-6'>
            <TestOverview test={test} />
            <SectionBreakdown sections={test.sections} />
            <SyllabusBreakdown syllabus={(test as any).syllabus} />
            <EligibilityInfo eligibility={(test as any).eligibility} />
          </div>

          {/* Sidebar Content Column */}
          <div className='flex flex-col space-y-6'>
            <div className='sticky top-24'>
              <EnrollmentCard
                testId={testId}
                testName={test.title}
                company={test.company || 'SkillitriX'}
                status={(test as any).status || enrollmentStatus}
                isQuotaExhausted={isQuotaExhausted}
                onUpgrade={openPricingModal}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
