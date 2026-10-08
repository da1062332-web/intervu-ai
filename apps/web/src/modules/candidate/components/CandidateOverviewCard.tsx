'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, HelpCircle, ArrowRight, Sparkles, CheckCircle2, BarChart2, Gift, Play } from 'lucide-react';
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
  const versionNumber =
    activeAttempt?.versionNumber ?? latestAssessment?.currentVersionNumber ?? null;
  const isLegacyAttempt = Boolean(activeAttempt?.isLegacy);
  const hasNewVersion = Boolean(!isInProgress && latestAssessment?.hasNewVersion);

  const handleAction = () => {
    if (!hasActivePlan) {
      useSubscriptionStore.getState().openQuotaExhaustedModal();
      return;
    }
    if (isInProgress) {
      const launchId = activeAttempt?.instanceId || activeAttempt?.id || latestAssessment?.id;
      router.push(`/candidate/tests/${launchId}/launch?resume=true`);
    } else if (latestAssessment?.id) {
      router.push(`/candidate/tests/${latestAssessment.id}/instructions`);
    }
  };

  const testCode =
    (latestAssessment as any)?.code ||
    (latestAssessment?.title
      ? latestAssessment.title.replace(/[^A-Za-z0-9]/g, '_').toUpperCase().slice(0, 16)
      : 'TCS_NQT_V1');
  const description =
    latestAssessment?.description ||
    'Evaluate your quantitative aptitude, logical reasoning, and programmatic debugging prowess under timed condition simulated for the upcoming recruitment cycle.';

  return (
    <div className='rounded-[28px] border border-border/70 bg-card p-6 sm:p-8 md:p-9 shadow-sm transition-all hover:shadow-md relative overflow-hidden'>
      <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10'>
        {/* Left Column: Details & Launch Button */}
        <div className='space-y-4 min-w-0 flex-1'>
          {isReferralUnlocked ? (
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20 shadow-2xs'>
              <Gift className='size-3.5 text-emerald-400' />
              <span>FREE ASSESSMENT UNLOCKED VIA REFERRAL</span>
            </div>
          ) : (
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-sky-400 text-[11px] font-bold border border-sky-500/20 shadow-2xs'>
              <Sparkles className='size-3 text-sky-400' />
              <span>{isInProgress ? 'ACTIVE ASSESSMENT IN PROGRESS' : 'RECOMMENDED NEXT STEP'}</span>
            </div>
          )}

          <div className='space-y-2'>
            <div className='flex items-center gap-2.5 flex-wrap'>
              <h2 className='text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight'>
                {title}
              </h2>
            </div>

            <div className='flex flex-wrap items-center gap-2 pt-1'>
              <span className='px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60'>
                Version: V{versionNumber ?? 1}
              </span>
              <span className='px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60'>
                Difficulty: {difficulty}
              </span>
              {durationMinutes !== undefined && (
                <span className='px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60 flex items-center gap-1'>
                  <Clock className='size-3' />
                  <span>{durationMinutes}m</span>
                </span>
              )}
              <span className='px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60 flex items-center gap-1'>
                <HelpCircle className='size-3' />
                <span>{questionCount ?? 20} questions</span>
              </span>
            </div>
          </div>

          <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl font-normal'>
            {description}
          </p>

          <div className='pt-2'>
            <Button
              size='md'
              className='px-6 py-2.5 h-11 font-bold text-xs sm:text-sm rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer'
              onClick={handleAction}
            >
              <Play className='size-3.5 fill-current' />
              <span>
                {!hasActivePlan
                  ? 'Choose a Plan to Start'
                  : isInProgress
                    ? 'Resume Assessment'
                    : isReferralUnlocked
                      ? 'Start Free Assessment'
                      : 'Start Assessment'}
              </span>
            </Button>
          </div>
        </div>

        {/* Right Column: Hero Illustration Card */}
        <div
          onClick={handleAction}
          className='relative w-full lg:w-[380px] xl:w-[420px] aspect-[16/10] rounded-2xl overflow-hidden border border-border/70 shadow-lg group cursor-pointer shrink-0 transition-all hover:border-indigo-500/50 hover:shadow-indigo-500/10'
          title='Click to start or resume assessment'
        >
          <img
            src='/images/assessment_hero_banner.jpg'
            alt={title}
            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none' />

          {/* Status Overlay */}
          <div className='absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-sm'>
            <span className='size-2 rounded-full bg-emerald-400 animate-pulse' />
            <span>{isInProgress ? 'Attempt Active' : 'Ready to Launch'}</span>
          </div>

          {/* Test Code Overlay */}
          <div className='absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[10px] font-mono font-bold text-slate-300 shadow-sm'>
            {testCode}
          </div>
        </div>
      </div>
    </div>
  );
}
