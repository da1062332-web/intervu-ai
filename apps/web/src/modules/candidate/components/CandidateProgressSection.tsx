'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '@/hooks/use-auth';
import dynamic from 'next/dynamic';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Brain, Award, ArrowRight, BarChart2, Users, Lock, Zap } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscription.store';

const ScoreTrendChart = dynamic(
  () => import('./analytics/ScoreTrendChart').then((m) => m.ScoreTrendChart),
  { ssr: false },
);
const TopicAnalysis = dynamic(
  () => import('./analytics/TopicAnalysis').then((m) => m.TopicAnalysis),
  { ssr: false },
);
const PerformanceComparisonChart = dynamic(
  () => import('./analytics/PerformanceComparisonChart').then((m) => m.PerformanceComparisonChart),
  { ssr: false },
);
const DifficultyAnalysis = dynamic(
  () => import('./analytics/DifficultyAnalysis').then((m) => m.DifficultyAnalysis),
  { ssr: false },
);

const ProgressCards = React.memo(({ overview }: { overview: any }) => {
  const cards = [
    {
      label: 'Average Score',
      value: `${overview?.averageScore ?? 0}/100`,
      icon: Target,
      bg: 'bg-[#eff2ff] text-[#6366f1] dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200/50',
    },
    {
      label: 'Completion Rate',
      value: `${overview?.completionRate ?? 0}%`,
      icon: Award,
      bg: 'bg-[#ecfdf5] text-[#10b981] dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/50',
    },
    {
      label: 'Top Percentile',
      value: `${overview?.topPercentileScore ?? 0}/100`,
      icon: TrendingUp,
      bg: 'bg-[#fff7ed] text-[#ea580c] dark:bg-amber-950/50 dark:text-amber-400 border-orange-200/50',
    },
    {
      label: 'Evaluated Tests',
      value: `${overview?.totalAssessments ?? 0}`,
      icon: Brain,
      bg: 'bg-[#f3e8ff] text-[#9333ea] dark:bg-purple-950/50 dark:text-purple-400 border-purple-200/50',
    },
  ];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5'>
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <Card
            key={idx}
            className='rounded-[24px] border border-border/60 bg-card p-6 shadow-2xs hover:shadow-md transition-all'
          >
            <CardContent className='p-0 flex items-center justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  {c.label}
                </p>
                <h3 className='text-3xl font-extrabold mt-1.5 text-foreground tracking-tight'>
                  {c.value}
                </h3>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${c.bg}`}
              >
                <Icon className='size-5' />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
ProgressCards.displayName = 'ProgressCards';

interface CandidateProgressSectionProps {
  compact?: boolean;
}

export function CandidateProgressSection({ compact = true }: CandidateProgressSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, error } = useProgress(user?.id);
  const hasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  if (isLoading) {
    return (
      <div className='space-y-4' aria-busy='true' aria-label='Loading analytics'>
        <div className='flex items-center justify-between pb-1'>
          <Skeleton className='h-7 w-56' />
          <Skeleton className='h-5 w-24' />
        </div>
        <div
          className={
            compact
              ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
              : 'grid grid-cols-1 lg:grid-cols-3 gap-6'
          }
        >
          <Skeleton className='h-[350px] w-full rounded-[28px] border border-border/40' />
          <Skeleton className='h-[350px] w-full rounded-[28px] border border-border/40' />
        </div>
      </div>
    );
  }

  if (!hasActivePlan || (data as any)?.isLocked) {
    return (
      <div className='space-y-4'>
        {compact && (
          <div className='flex items-center justify-between gap-3 pb-1 shrink-0'>
            <h3 className='text-xl sm:text-2xl font-bold text-foreground tracking-tight'>
              Progress & Skill Mastery
            </h3>
          </div>
        )}
        <div className='rounded-[28px] border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-indigo-950/20 dark:via-background dark:to-purple-950/20 p-8 sm:p-10 text-center space-y-4 shadow-sm'>
          <div className='inline-flex items-center justify-center p-3.5 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-1'>
            <Lock className='size-6' />
          </div>
          <div className='max-w-md mx-auto space-y-1.5'>
            <h3 className='text-lg sm:text-xl font-bold text-foreground'>
              Progress Analytics & Skill Mastery
            </h3>
            <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
              Subscribe to an active plan to track your score timeline trends, domain competencies, and performance diagnostics.
            </p>
          </div>
          <div className='pt-2 flex justify-center'>
            <button
              onClick={openPricingModal}
              className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20'
            >
              <Zap className='size-4' />
              Choose a Plan to Unlock Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className='space-y-4'>
      {!compact && (
        <SectionHeader
          title='Progress Analytics & Mastery'
          description='Comprehensive breakdown of your ability growth, scoring trajectory, and technical proficiency across evaluation categories.'
          breadcrumbs={[
            { label: 'Dashboard', href: '/candidate/dashboard' },
            { label: 'Progress Analytics' },
          ]}
        />
      )}

      {compact && (
        <div className='flex items-center justify-between gap-3 pb-1 shrink-0'>
          <h3 className='text-xl sm:text-2xl font-bold text-foreground tracking-tight'>
            Progress & Skill Mastery
          </h3>
          <button
            type='button'
            className='text-[#6366f1] dark:text-indigo-400 hover:underline font-semibold text-xs sm:text-sm flex items-center gap-1 transition-all'
            onClick={() => router.push('/candidate/progress')}
          >
            Full Analytics <ArrowRight className='size-3.5 ml-0.5' />
          </button>
        </div>
      )}

      {!compact && <ProgressCards overview={data.overview} />}

      <div
        className={
          compact
            ? 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch'
            : 'grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch'
        }
      >
        <Card
          className={`${compact ? '' : 'lg:col-span-2'} rounded-[28px] border border-border/60 bg-card p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full`}
        >
          <div>
            <div className='flex items-center justify-between gap-3 pb-4 mb-3 border-b border-border/40'>
              <div>
                <h4 className='text-lg font-bold text-foreground tracking-tight'>
                  Score Timeline Trend
                </h4>
                <p className='text-xs text-muted-foreground font-normal mt-0.5'>
                  Score progression across all evaluation sessions
                </p>
              </div>
              <div className='w-11 h-11 rounded-2xl bg-[#eff2ff] dark:bg-indigo-950/50 text-[#6366f1] dark:text-indigo-400 border border-indigo-200/60 flex items-center justify-center shrink-0 shadow-2xs'>
                <TrendingUp className='size-5' />
              </div>
            </div>
            <div className='pt-2'>
              <ScoreTrendChart data={data.trend} height='250px' />
            </div>
          </div>
        </Card>

        <Card className='rounded-[28px] border border-border/60 bg-card p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full'>
          <div>
            <div className='flex items-center justify-between gap-3 pb-4 mb-3 border-b border-border/40'>
              <div>
                <h4 className='text-lg font-bold text-foreground tracking-tight'>
                  Domain Competency
                </h4>
                <p className='text-xs text-muted-foreground font-normal mt-0.5'>
                  Proficiency level by technical subject area
                </p>
              </div>
              <div className='w-11 h-11 rounded-2xl bg-[#f3e8ff] dark:bg-purple-950/50 text-[#9333ea] dark:text-purple-400 border border-purple-200/60 flex items-center justify-center shrink-0 shadow-2xs'>
                <Brain className='size-5' />
              </div>
            </div>
            <div className='pt-2'>
              <TopicAnalysis topics={data.skills} />
            </div>
          </div>
        </Card>

        {!compact && (
          <>
            <Card className='lg:col-span-2 rounded-[28px] border border-border/60 bg-card p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all'>
              <div className='flex items-center justify-between gap-3 pb-4 mb-3 border-b border-border/40'>
                <div>
                  <h4 className='text-lg font-bold text-foreground tracking-tight'>
                    Difficulty Breakdown
                  </h4>
                  <p className='text-xs text-muted-foreground font-normal mt-0.5'>
                    Success consistency categorized by problem complexity tiers
                  </p>
                </div>
                <div className='w-11 h-11 rounded-2xl bg-[#fff7ed] dark:bg-amber-950/50 text-[#ea580c] dark:text-amber-400 border border-orange-200/60 flex items-center justify-center shrink-0 shadow-2xs'>
                  <BarChart2 className='size-5' />
                </div>
              </div>
              <div className='pt-2'>
                <DifficultyAnalysis stats={data.difficulty} />
              </div>
            </Card>

            <Card className='rounded-[28px] border border-border/60 bg-card p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full'>
              <div>
                <div className='flex items-center justify-between gap-3 pb-4 mb-3 border-b border-border/40'>
                  <div>
                    <h4 className='text-lg font-bold text-foreground tracking-tight'>
                      Cohort Comparison
                    </h4>
                    <p className='text-xs text-muted-foreground font-normal mt-0.5'>
                      Your standing relative to the broader applicant talent pool
                    </p>
                  </div>
                  <div className='w-11 h-11 rounded-2xl bg-[#ecfdf5] dark:bg-emerald-950/50 text-[#10b981] dark:text-emerald-400 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs'>
                    <Users className='size-5' />
                  </div>
                </div>
                <div className='pt-2 flex flex-col justify-center pb-6'>
                  <PerformanceComparisonChart
                    userScore={data.overview.averageScore}
                    averageScore={(data.overview as any).peerAverageScore ?? 65}
                    topPercentileScore={data.overview.topPercentileScore}
                  />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
