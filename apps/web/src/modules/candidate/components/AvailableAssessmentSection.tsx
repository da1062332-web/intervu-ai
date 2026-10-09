'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ArrowRight, Code, Palette, Cloud, Compass, Lock, Gift, CheckCircle2, FileText, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CandidateDashboardData } from '../services/dashboard.service';
import { useTestCatalog } from '../hooks/useTestCatalog';
import { useSubscriptionStore } from '@/store/subscription.store';

interface AvailableAssessmentSectionProps {
  dashboard?: CandidateDashboardData | null;
  isLoading?: boolean;
  error?: any;
  compact?: boolean;
}

export function AvailableAssessmentSection({
  dashboard,
  isLoading,
  error,
  compact = true,
}: AvailableAssessmentSectionProps) {
  const router = useRouter();
  const hasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const planSlug = useSubscriptionStore((state) => state.planSlug);
  const planName = useSubscriptionStore((state) => state.planName);
  const entitlements = useSubscriptionStore((state) => state.entitlements);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  const isReferralUnlocked =
    hasActivePlan &&
    (planSlug === 'referral-pass' ||
      Boolean(planName?.toLowerCase().includes('referral')));
  const { pagination } = useTestCatalog({ limit: 1 });
  const totalCount = pagination?.total || 0;

  if (isLoading) {
    return (
      <div className='space-y-5'>
        <div className='flex items-center justify-between pb-1'>
          <Skeleton className='h-7 w-52' />
          <Skeleton className='h-5 w-20' />
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='h-[230px] w-full rounded-[24px] border border-border/40' />
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return null;
  }

  if (!hasActivePlan || !dashboard.availableTests || dashboard.availableTests.length === 0) {
    return (
      <div className='flex flex-col h-full space-y-4'>
        <div className='flex items-center justify-between gap-3 pb-1 shrink-0'>
          <h3 className='text-xl sm:text-2xl font-bold text-foreground tracking-tight'>
            Available Assessments
          </h3>
        </div>
        <div className='rounded-[24px] border border-border/50 bg-card p-6 shadow-2xs flex flex-col items-center justify-center text-center h-full min-h-[240px] flex-1'>
          <div className='w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#6366f1] dark:text-indigo-400 flex items-center justify-center mb-3 shadow-2xs border border-indigo-100 dark:border-indigo-900/50'>
            <Lock className='size-6' />
          </div>
          <h4 className='font-bold text-base text-foreground tracking-tight'>
            {!hasActivePlan ? 'Subscription Plan Required' : 'No Assessments in Your Plan'}
          </h4>
          <p className='text-xs text-muted-foreground font-normal mt-1.5 max-w-[320px] leading-relaxed'>
            {!hasActivePlan
              ? 'You do not have an active subscription or your free referral attempts have concluded. Choose a plan to unlock full access to all mock tests and assessments.'
              : 'Your current subscription plan does not include any active assessments at this time.'}
          </p>
          <button
            type='button'
            className='mt-4 rounded-xl font-bold text-xs h-9 px-5 bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm transition-all'
            onClick={openPricingModal}
          >
            {!hasActivePlan ? 'Choose a Plan' : 'Upgrade Plan'}
          </button>
        </div>
      </div>
    );
  }

  const testsToRender = compact
    ? dashboard.availableTests.slice(0, 3)
    : dashboard.availableTests;

  const actualTests = testsToRender.map((t, index) => {
    const icons = ['code', 'palette', 'cloud'];
    const iconBgList = [
      'bg-[#eff2ff] text-[#6366f1] dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100/50',
      'bg-[#ecfdf5] text-[#10b981] dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100/50',
      'bg-[#f3e8ff] text-[#9333ea] dark:bg-purple-950/50 dark:text-purple-400 border-purple-100/50',
    ];
    return {
      id: t.id,
      title: t.title,
      description: t.description || 'No description available.',
      difficulty: t.difficulty || 'Mid',
      durationMinutes: t.durationMinutes || 20,
      iconType: icons[index % 3],
      iconBg: iconBgList[index % 3],
      attemptCount: t.attemptCount ?? 0,
      maxAttempts: t.maxAttempts ?? 2,
      canReattempt: t.canReattempt,
      currentVersionNumber: t.currentVersionNumber || 1,
      hasNewVersion: t.hasNewVersion,
      questionCount: t.questionCount || 20,
    };
  });

  return (
    <div className='flex flex-col h-full space-y-4'>
      <div className='flex items-center justify-between gap-3 pb-1 shrink-0'>
        <div>
          <h3 className='text-xl sm:text-2xl font-bold text-foreground tracking-tight'>
            Available Assessments
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Your current assigned mock tests and practice materials
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          className='text-xs font-semibold text-muted-foreground hover:text-foreground h-8 px-3 rounded-xl border border-border/60 hover:bg-muted/50 gap-1'
          onClick={() => router.push('/candidate/assessments')}
        >
          <span>View All</span>
          <Plus className='size-3.5' />
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 flex-1 items-stretch'>
        {actualTests.slice(0, 1).map((test: any) => {
          const handleCardClick = () => {
            if (!hasActivePlan) {
              useSubscriptionStore.getState().openQuotaExhaustedModal();
              return;
            }
            router.push(`/candidate/tests/${test.id}/instructions`);
          };

          return (
            <div
              key={test.id}
              className='rounded-[24px] border border-border/60 bg-card p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full min-h-[220px]'
            >
              <div>
                <div className='flex items-center justify-between gap-2 mb-4'>
                  <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20'>
                    FREE TIER
                  </span>
                  <div className='w-8 h-8 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground'>
                    <FileText className='size-4' />
                  </div>
                </div>

                <h4 className='font-bold text-base text-foreground tracking-tight'>
                  {test.title}
                </h4>

                <p className='text-xs text-muted-foreground font-medium mt-1.5 flex items-center gap-2'>
                  <span>Version: V{test.currentVersionNumber}</span>
                  <span>•</span>
                  <span>Difficulty: {test.difficulty}</span>
                  <span>•</span>
                  <span>Duration: {test.durationMinutes}m</span>
                </p>

                <p className='text-xs text-muted-foreground/80 font-normal mt-2'>
                  {test.questionCount} description questions
                </p>
              </div>

              <div className='flex items-center justify-between pt-5 mt-4 border-t border-border/30'>
                <span className='text-xs font-semibold text-muted-foreground'>
                  Attempts: <strong className='text-foreground font-bold'>{test.attemptCount} / {test.maxAttempts}</strong>
                </span>

                <Button
                  size='sm'
                  onClick={handleCardClick}
                  className='rounded-xl font-bold text-xs h-9 px-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm transition-all'
                >
                  Launch Test
                </Button>
              </div>
            </div>
          );
        })}

        {/* 2nd Card: Explore Catalog */}
        <div
          className='rounded-[24px] border border-border/60 bg-card p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full min-h-[220px]'
        >
          <div>
            <div className='flex items-center justify-between gap-2 mb-4'>
              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                DISCOVER
              </span>
              <div className='w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400'>
                <CheckCircle2 className='size-4' />
              </div>
            </div>

            <h4 className='font-bold text-base text-foreground tracking-tight'>
              Explore Catalog
            </h4>

            <p className='text-xs text-muted-foreground font-normal mt-2 leading-relaxed'>
              Explore new assessment catalogues to sharpen your skills. Unlocked catalog tracks spanning Infosys, Wipro, and Cognizant readiness mock evaluations.
            </p>
          </div>

          <div className='flex items-center justify-between pt-5 mt-4 border-t border-border/30'>
            <span className='text-xs font-semibold text-muted-foreground'>
              Over 10+ Specialized Modules
            </span>

            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push('/candidate/assessments')}
              className='rounded-xl font-bold text-xs h-9 px-3.5 gap-1.5 border-border/70 hover:bg-muted text-foreground transition-all'
            >
              <span>Browse Catalog</span>
              <ExternalLink className='size-3.5' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
