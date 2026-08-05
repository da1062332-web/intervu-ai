'use client';

import React from 'react';
import { useProgress } from '../hooks/useProgress';
import dynamic from 'next/dynamic';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TrendingUp, Target, Brain, Award, AlertCircle } from 'lucide-react';

const ScoreTrendChart = dynamic(
  () => import('../components/analytics/ScoreTrendChart').then((m) => m.ScoreTrendChart),
  { ssr: false },
);
const TopicAnalysis = dynamic(
  () => import('../components/analytics/TopicAnalysis').then((m) => m.TopicAnalysis),
  { ssr: false },
);
const DifficultyAnalysis = dynamic(
  () => import('../components/analytics/DifficultyAnalysis').then((m) => m.DifficultyAnalysis),
  { ssr: false },
);

// Memoized analytics stat cards
const ProgressCards = React.memo(({ overview }: { overview: any }) => {
  const cards = [
    {
      label: 'Average Score',
      value: `${overview?.averageScore ?? 0}/100`,
      icon: Target,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      label: 'Completion Rate',
      value: `${overview?.completionRate ?? 0}%`,
      icon: Award,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      label: 'Top Percentile',
      value: `${overview?.topPercentileScore ?? 0}/100`,
      icon: TrendingUp,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      label: 'Total Assessments',
      value: `${overview?.totalAssessments ?? 0}`,
      icon: Brain,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
  ];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card
            key={i}
            className='bg-card/80 backdrop-blur-sm border border-border/60 hover:border-border/80 hover:bg-card transition-all duration-200 shadow-2xs hover:shadow-xs rounded-xl overflow-hidden'
          >
            <CardContent className='p-4 flex items-center gap-3.5'>
              <div className={`p-2.5 rounded-xl border shrink-0 ${c.iconBg}`}>
                <Icon className='size-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 truncate whitespace-nowrap'>
                  {c.label}
                </p>
                <h3 className='text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mt-1 leading-none'>
                  {c.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
ProgressCards.displayName = 'ProgressCards';

export function ProgressDashboard() {
  const { data, isLoading, error } = useProgress();

  if (isLoading) {
    return (
      <div
        className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'
        aria-busy='true'
        aria-label='Loading progress dashboard'
      >
        <SectionHeader
          title='Progress Analytics'
          description='Track your skill development, accuracy metrics, and assessment growth over time.'
          breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Progress Analytics' }]}
        />
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='h-24 bg-muted/60 rounded-xl border border-border/60' />
          ))}
        </div>
        <div className='space-y-6 pt-2'>
          <Skeleton className='w-full h-80 bg-muted/60 rounded-xl border border-border/60' />
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Skeleton className='h-72 bg-muted/60 rounded-xl border border-border/60' />
            <Skeleton className='h-72 bg-muted/60 rounded-xl border border-border/60' />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'>
        <SectionHeader
          title='Progress Analytics'
          description='Track your skill development, accuracy metrics, and assessment growth over time.'
          breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Progress Analytics' }]}
        />
        <div className='flex flex-col items-center justify-center h-[40vh] text-center space-y-4 border border-border/60 rounded-xl bg-card/40 p-8'>
          <AlertCircle className='size-12 text-destructive/80' />
          <div className='space-y-1 max-w-md'>
            <h2 className='text-lg font-bold text-foreground'>Unable to Load Analytics</h2>
            <p className='text-sm text-muted-foreground'>
              We encountered an issue fetching your progress analytics at this moment. Please refresh the page or try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'>
      <SectionHeader
        title='Progress Analytics'
        description='Track your skill development, accuracy metrics, and assessment growth over time.'
        breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Progress Analytics' }]}
      />

      <ProgressCards overview={data.overview} />

      <div className='space-y-6 pt-2'>
        {/* Featured Full-Width Score Trend Hero Card */}
        <Card className='w-full bg-card/80 border border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg font-bold text-foreground'>Score Trend</CardTitle>
            <CardDescription className='text-xs text-muted-foreground font-medium'>
              Performance historical timeline across your recent assessment evaluations
            </CardDescription>
          </CardHeader>
          <CardContent className='pb-3.5'>
            <ScoreTrendChart data={data.trend} height='260px' />
          </CardContent>
        </Card>

        {/* 2-Column Balanced Domain & Tier Analytics */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card className='bg-card/80 border border-border/60 shadow-xs'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-bold text-foreground'>Top 5 Topic Mastery</CardTitle>
              <CardDescription className='text-xs text-muted-foreground font-medium'>
                Competency evaluation of your top performing domains
              </CardDescription>
            </CardHeader>
            <CardContent className='pb-5'>
              <TopicAnalysis topics={data.skills} />
            </CardContent>
          </Card>

          <Card className='bg-card/80 border border-border/60 shadow-xs'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-bold text-foreground'>Difficulty Analysis</CardTitle>
              <CardDescription className='text-xs text-muted-foreground font-medium'>
                Success percentage and response accuracy categorized by difficulty tier
              </CardDescription>
            </CardHeader>
            <CardContent className='pb-5'>
              <DifficultyAnalysis stats={data.difficulty} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

