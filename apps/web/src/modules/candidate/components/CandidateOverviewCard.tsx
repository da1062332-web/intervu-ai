'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, HelpCircle, ArrowRight, Sparkles, CheckCircle2, BarChart2, Gift } from 'lucide-react';
import { CandidateDashboardData } from '../services/dashboard.service';
import { useSubscriptionStore } from '@/store/subscription.store';

interface CandidateOverviewCardProps {
  dashboard?: CandidateDashboardData | null;
  isLoading?: boolean;
}

export function CandidateOverviewCard({ dashboard, isLoading }: CandidateOverviewCardProps) {
  const router = useRouter();
  const hasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const planSlug = useSubscriptionStore((state) => state.planSlug);
  const planName = useSubscriptionStore((state) => state.planName);
  const entitlements = useSubscriptionStore((state) => state.entitlements);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  const isReferralUnlocked = useMemo(() => {
    if (!hasActivePlan) return false;
    return (
      planSlug === 'referral-pass' ||
      Boolean(planName?.toLowerCase().includes('referral'))
    );
  }, [hasActivePlan, planSlug, planName]);

  const latestAssessment = useMemo(() => {
    if (!dashboard) return null;

    // 1. Any active in-progress attempt takes highest priority
    const activeTest = dashboard.availableTests.find(
      (t) =>
        t.hasActiveAttempt ||
        (dashboard.activeTests &&
          dashboard.activeTests.some((a) => a.testId === t.id || a.id === t.id)),
    );
    if (activeTest) return activeTest;

    // 2. Candidate has specifically enrolled in an assessment
    const enrolled = dashboard.availableTests.find((t) => t.status === 'ENROLLED');
    if (enrolled) return enrolled;

    // 3. User entered a referral code / has an active referral reward pass
    if (isReferralUnlocked) {
      const referralTest = dashboard.availableTests.find(
        (t) => t.status === 'ENROLLED' || t.canReattempt,
      );
      if (referralTest) return referralTest;
      return dashboard.availableTests[0] || null;
    }

    // 4. If user is a paid subscriber (Pro / VIP) but hasn't chosen an assessment yet,
    // show the top available test from their plan so they can start right away
    if (hasActivePlan && dashboard.availableTests.length > 0) {
      return dashboard.availableTests[0];
    }

    // 5. If user has NO active plan, NO enrollments, and did NOT enter any code:
    // Do NOT force an un-enrolled or locked assessment onto the hero banner!
    return null;
  }, [dashboard, isReferralUnlocked, hasActivePlan]);

  const activeAttempt = useMemo(() => {
    if (!dashboard) return null;
    if (!latestAssessment) return dashboard.activeTests[0] || null;
    return (
      dashboard.activeTests.find(
        (a) =>
          a.testId === latestAssessment.id ||
          a.testName === latestAssessment.title ||
          a.id === latestAssessment.id,
      ) || null
    );
  }, [latestAssessment, dashboard]);

  if (isLoading) {
    return (
      <div className='rounded-[28px] border border-border/60 shadow-xs bg-card p-8 sm:p-10'>
        <Skeleton className='h-7 w-44 mb-4 rounded-lg' />
        <Skeleton className='h-8 w-80 mb-5' />
        <div className='flex gap-3'>
          <Skeleton className='h-8 w-28 rounded-xl' />
          <Skeleton className='h-8 w-24 rounded-xl' />
          <Skeleton className='h-8 w-32 rounded-xl' />
        </div>
      </div>
    );
  }

  if (!latestAssessment && !activeAttempt) {
    return (
      <div className='rounded-[28px] border border-border/60 bg-gradient-to-r from-[#eff2ff]/60 via-[#f7eefe]/60 to-[#f4ebff]/60 dark:from-purple-950/20 dark:to-indigo-950/20 p-8 sm:p-10 text-center flex flex-col items-center justify-center shadow-xs'>
        <div className='p-3.5 bg-card rounded-2xl mb-3 text-muted-foreground shadow-2xs'>
          <CheckCircle2 className='size-6 text-[#6366f1]' />
        </div>
        <h3 className='text-base font-bold text-foreground'>No Immediate Assessments Assigned</h3>
        <p className='text-sm text-muted-foreground max-w-md mt-1 font-normal'>
          You don&apos;t have any pending assessments assigned right now. Browse our catalog below to explore and get started.
        </p>
        <Button
          variant='outline'
          size='sm'
          className='mt-5 rounded-xl font-bold text-xs h-10 px-6 border-indigo-200 text-[#6366f1] hover:bg-indigo-50'
          onClick={() => router.push('/candidate/assessments')}
        >
          Explore Catalog
        </Button>
      </div>
    );
  }

  const title =
    latestAssessment?.title ||
    activeAttempt?.testName ||
    activeAttempt?.title ||
    'Assessment';
  const durationMinutes =
    latestAssessment?.durationMinutes ?? (activeAttempt?.remainingMinutes !== undefined ? activeAttempt.remainingMinutes : undefined);
  const questionCount = latestAssessment?.questionCount;
  const isInProgress = Boolean(latestAssessment?.hasActiveAttempt || activeAttempt);
  const difficulty = (latestAssessment as any)?.difficulty || 'N/A';
  const maxAttempts = latestAssessment?.maxAttempts;
  const attemptCount = latestAssessment?.attemptCount ?? 0;

  const handleAction = () => {
    if (!hasActivePlan) {
      openPricingModal();
      return;
    }
    if (isInProgress) {
      const launchId = activeAttempt?.instanceId || activeAttempt?.id || latestAssessment?.id;
      router.push(`/candidate/tests/${launchId}/launch?resume=true`);
    } else if (latestAssessment?.id) {
      router.push(`/candidate/tests/${latestAssessment.id}/instructions`);
    }
  };

  return (
    <div className='rounded-[28px] border border-indigo-100/80 dark:border-indigo-900/40 bg-gradient-to-r from-[#eff2ff] via-[#f7eefe] to-[#f4ebff] dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 p-7 sm:p-9 shadow-sm transition-all hover:shadow-md relative overflow-hidden'>
      <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10'>
        <div className='space-y-4 min-w-0 flex-1'>
          {isReferralUnlocked ? (
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/50 dark:border-emerald-800/40 shadow-2xs'>
              <Gift className='size-3.5 text-emerald-600 dark:text-emerald-400' />
              <span>🎁 Free Assessment Unlocked via Referral</span>
            </div>
          ) : (
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#fff3e0] dark:bg-amber-950/40 text-[#d97706] dark:text-amber-300 text-[11px] font-bold border border-amber-200/50 dark:border-amber-800/40'>
              <Sparkles className='size-3.5 fill-current' />
              <span>{isInProgress ? 'Active Assessment in Progress' : 'Recommended Next Step'}</span>
            </div>
          )}

          <h2 className='text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight truncate'>
            {title}
          </h2>

          <div className='flex flex-wrap items-center gap-2.5 pt-1'>
            {isReferralUnlocked && maxAttempts && (
              <span className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300/60 dark:border-emerald-800/60'>
                <Sparkles className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                <span>{attemptCount} / {maxAttempts} Free Attempts Used</span>
              </span>
            )}
            <span className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-slate-800/80 text-muted-foreground text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60'>
              <BarChart2 className='size-3.5 text-muted-foreground/80' />
              Difficulty: <strong className='text-foreground font-bold ml-0.5'>{difficulty}</strong>
            </span>
            {durationMinutes !== undefined && (
              <span className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-slate-800/80 text-muted-foreground text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60'>
                <Clock className='size-3.5 text-muted-foreground/80' />
                <strong className='text-foreground font-bold'>{durationMinutes}m</strong>
              </span>
            )}
            {questionCount !== undefined && (
              <span className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f1f5f9] dark:bg-slate-800/80 text-muted-foreground text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60'>
                <HelpCircle className='size-3.5 text-muted-foreground/80' />
                <strong className='text-foreground font-bold'>{questionCount} Questions</strong>
              </span>
            )}
          </div>
        </div>

        <div className='w-full lg:w-auto shrink-0 flex items-center justify-end pt-2 lg:pt-0'>
          <Button
            size='lg'
            className='w-full sm:w-auto px-8 py-6 font-bold text-sm rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5'
            onClick={handleAction}
          >
            {!hasActivePlan
              ? 'Choose a Plan to Start'
              : isInProgress
                ? 'Resume Assessment'
                : isReferralUnlocked
                  ? 'Start Free Assessment'
                  : 'Start Assessment'}
            <ArrowRight className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
