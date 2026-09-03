'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ArrowRight, Code, Palette, Cloud, Compass } from 'lucide-react';
import { CandidateDashboardData } from '../services/dashboard.service';
import { useTestCatalog } from '../hooks/useTestCatalog';
import { useSubscriptionStore } from '@/store/subscription.store';
import { Lock } from 'lucide-react';

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
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);
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
          <p className='text-xs text-muted-foreground font-normal mt-1.5 max-w-[280px] leading-relaxed'>
            {!hasActivePlan
              ? 'Choose an active subscription plan to unlock and practice full-length assessments.'
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
    ? dashboard.availableTests.slice(0, 4)
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
      difficulty: t.difficulty || 'N/A',
      durationMinutes: t.durationMinutes,
      iconType: icons[index % 3],
      iconBg: iconBgList[index % 3],
      badgeStyle: 'bg-[#f1f5f9] text-muted-foreground dark:bg-slate-800',
      attemptCount: t.attemptCount,
      maxAttempts: t.maxAttempts,
      canReattempt: t.canReattempt,
    };
  });

  return (
    <div className='flex flex-col h-full space-y-4'>
      <div className='flex items-center justify-between gap-3 pb-1 shrink-0'>
        <h3 className='text-xl sm:text-2xl font-bold text-foreground tracking-tight'>
          Available Assessments
        </h3>
        {compact && (
          <button
            type='button'
            className='text-[#6366f1] dark:text-indigo-400 hover:underline font-semibold text-xs sm:text-sm flex items-center gap-1 transition-all'
            onClick={() => router.push('/candidate/assessments')}
          >
            View All <ArrowRight className='size-3.5 ml-0.5' />
          </button>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 flex-1 items-stretch'>
        {actualTests.map((test: any) => {
          const IconComponent =
            test.iconType === 'palette' ? Palette : test.iconType === 'cloud' ? Cloud : Code;
          const isLocked = !hasActivePlan || test.isLocked || test.canReattempt === false;

          const handleCardClick = () => {
            if (!hasActivePlan) {
              openPricingModal();
              return;
            }
            router.push(`/candidate/tests/${test.id}`);
          };

          return (
            <div
              key={test.id}
              onClick={handleCardClick}
              className='rounded-[24px] border border-border/50 bg-card p-6 shadow-2xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[240px]'
            >
              <div>
                <div className='flex items-center justify-between gap-2 mb-5'>
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${test.iconBg}`}
                  >
                    <IconComponent className='size-5' />
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {!hasActivePlan && (
                      <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1'>
                        <Lock className='size-3' /> Plan Required
                      </span>
                    )}
                    <span className='px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-[#f1f5f9] dark:bg-slate-800/80 text-muted-foreground border border-border/40'>
                      {test.difficulty}
                    </span>
                  </div>
                </div>

                <h4 className='font-bold text-base text-foreground group-hover:text-[#6366f1] dark:group-hover:text-indigo-400 transition-colors tracking-tight truncate'>
                  {test.title}
                </h4>
                <p className='text-xs text-muted-foreground/80 font-normal mt-2 line-clamp-2 leading-relaxed'>
                  {test.description}
                </p>
              </div>

              <div className='flex items-center justify-between pt-6 mt-4 border-t border-border/30'>
                <div className='flex items-center gap-4'>
                  <span className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
                    <Clock className='size-3.5 text-muted-foreground/80' />
                    <span>{test.durationMinutes}m</span>
                  </span>
                  {(test as any).maxAttempts !== undefined && (
                    <span className='flex items-center gap-1 text-xs font-medium text-muted-foreground border-l border-border/50 pl-4'>
                      Attempts: {(test as any).attemptCount}/{(test as any).maxAttempts}
                    </span>
                  )}
                </div>
                {!hasActivePlan ? (
                  <span className='text-xs font-bold text-indigo-600 flex items-center gap-1'>
                    Unlock <ArrowRight className='size-3.5' />
                  </span>
                ) : (test as any).canReattempt !== false ? (
                  <span className='text-[#6366f1] dark:text-indigo-400 group-hover:translate-x-1 transition-transform font-extrabold'>
                    <ArrowRight className='size-4' />
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}

        {/* 4th Card: Explore Catalog */}
        <div
          onClick={() => router.push('/candidate/assessments')}
          className='rounded-[24px] border border-border/50 bg-card p-6 shadow-2xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all cursor-pointer group flex flex-col items-center justify-center text-center h-full min-h-[240px]'
        >
          <div className='w-14 h-14 rounded-full bg-[#f3e8ff] dark:bg-purple-950/40 text-[#6366f1] dark:text-indigo-400 flex items-center justify-center mb-4 border border-purple-200/50 dark:border-purple-800/40 group-hover:scale-110 transition-transform'>
            <Compass className='size-6' />
          </div>
          <h4 className='font-bold text-base text-foreground tracking-tight group-hover:text-[#6366f1] transition-colors'>
            Explore Catalog
          </h4>
          <p className='text-xs text-muted-foreground font-normal mt-1.5 max-w-[200px] leading-relaxed'>
            {(() => {
              const displayCount = Math.floor(totalCount / 5) * 5;
              if (displayCount >= 5) {
                return `Discover ${displayCount}+ more assessments tailored to your skills.`;
              }
              return 'Discover more assessments tailored to your skills.';
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
