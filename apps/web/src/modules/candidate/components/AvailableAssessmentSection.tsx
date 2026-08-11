'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ArrowRight, Code, Palette, Cloud, Compass } from 'lucide-react';
import { CandidateDashboardData } from '../services/dashboard.service';

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

  // Fallback items matching exact design mockup if empty in demo/test
  const defaultTests = [
    {
      id: 'mock-dsa',
      title: 'Data Structures & Algorithms',
      description:
        'Core computer science concepts focusing on arrays, trees, and dynamic programming.',
      difficulty: 'Medium',
      durationMinutes: 90,
      iconType: 'code',
      badgeStyle: 'bg-[#f1f5f9] text-[#64748b] dark:bg-slate-800 dark:text-slate-300',
      iconBg:
        'bg-[#eff2ff] dark:bg-indigo-950/50 text-[#6366f1] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40',
      attemptCount: 0,
      maxAttempts: 3,
      canReattempt: true,
    },
    {
      id: 'mock-ui',
      title: 'UI/UX Principles',
      description:
        'Fundamentals of user-centered design, wireframing, and accessibility standards.',
      difficulty: 'Easy',
      durationMinutes: 45,
      iconType: 'palette',
      badgeStyle: 'bg-[#f1f5f9] text-[#64748b] dark:bg-slate-800 dark:text-slate-300',
      iconBg:
        'bg-[#ecfdf5] dark:bg-emerald-950/50 text-[#10b981] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40',
      attemptCount: 0,
      maxAttempts: 3,
      canReattempt: true,
    },
    {
      id: 'mock-aws',
      title: 'AWS Architecture',
      description:
        'Advanced scenarios covering VPCs, IAM, and serverless infrastructure deployments.',
      difficulty: 'Hard',
      durationMinutes: 120,
      iconType: 'cloud',
      badgeStyle: 'bg-[#f1f5f9] text-[#64748b] dark:bg-slate-800 dark:text-slate-300',
      iconBg:
        'bg-[#f3e8ff] dark:bg-purple-950/50 text-[#9333ea] dark:text-purple-400 border border-purple-100 dark:border-purple-900/40',
      attemptCount: 0,
      maxAttempts: 3,
      canReattempt: true,
    },
  ];

  const actualTests =
    dashboard.availableTests && dashboard.availableTests.length > 0
      ? dashboard.availableTests.slice(0, 3).map((t, index) => {
          const icons = ['code', 'palette', 'cloud'];
          const iconBgList = [
            'bg-[#eff2ff] text-[#6366f1] dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100/50',
            'bg-[#ecfdf5] text-[#10b981] dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100/50',
            'bg-[#f3e8ff] text-[#9333ea] dark:bg-purple-950/50 dark:text-purple-400 border-purple-100/50',
          ];
          return {
            id: t.id,
            title: t.title,
            description:
              (t as any).description ||
              (index === 0
                ? 'Core computer science concepts focusing on practical real-world algorithmic problems.'
                : index === 1
                  ? 'Evaluate your front-end layout strategies and component design patterns.'
                  : 'Advanced system design, scalable architecture, and distributed services.'),
            difficulty:
              (t as any).difficulty || (index === 0 ? 'Medium' : index === 1 ? 'Easy' : 'Hard'),
            durationMinutes: t.durationMinutes || (index === 0 ? 90 : index === 1 ? 45 : 120),
            iconType: icons[index % 3],
            iconBg: iconBgList[index % 3],
            badgeStyle: 'bg-[#f1f5f9] text-muted-foreground dark:bg-slate-800',
            attemptCount: t.attemptCount,
            maxAttempts: t.maxAttempts,
            canReattempt: t.canReattempt,
          };
        })
      : defaultTests;

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
        {actualTests.map((test) => {
          const IconComponent =
            test.iconType === 'palette' ? Palette : test.iconType === 'cloud' ? Cloud : Code;
          return (
            <div
              key={test.id}
              onClick={() => router.push(`/candidate/tests/${test.id}`)}
              className='rounded-[24px] border border-border/50 bg-card p-6 shadow-2xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[240px]'
            >
              <div>
                <div className='flex items-center justify-between gap-2 mb-5'>
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${test.iconBg}`}
                  >
                    <IconComponent className='size-5' />
                  </div>
                  <span className='px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-[#f1f5f9] dark:bg-slate-800/80 text-muted-foreground border border-border/40'>
                    {test.difficulty}
                  </span>
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
                  {test.maxAttempts !== undefined && (
                    <span className='flex items-center gap-1 text-xs font-medium text-muted-foreground border-l border-border/50 pl-4'>
                      Attempts: {test.attemptCount}/{test.maxAttempts}
                    </span>
                  )}
                </div>
                {test.canReattempt !== false && (
                  <span className='text-[#6366f1] dark:text-indigo-400 group-hover:translate-x-1 transition-transform font-extrabold'>
                    <ArrowRight className='size-4' />
                  </span>
                )}
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
            Discover 40+ more assessments tailored to your skills.
          </p>
        </div>
      </div>
    </div>
  );
}
