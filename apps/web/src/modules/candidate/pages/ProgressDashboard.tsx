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
const PerformanceComparisonChart = dynamic(
  () =>
    import('../components/analytics/PerformanceComparisonChart').then(
      (m) => m.PerformanceComparisonChart,
    ),
  { ssr: false },
);
const DifficultyAnalysis = dynamic(
  () => import('../components/analytics/DifficultyAnalysis').then((m) => m.DifficultyAnalysis),
  { ssr: false },
);

// Memoized analytics stat cards
const ProgressCards = React.memo(({ overview }: { overview: any }) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
      <Card className='bg-card/80 border border-border/60 hover:bg-card transition-colors shadow-xs'>
        <CardContent className='p-5 flex items-center gap-4'>
          <div className='bg-primary/10 p-3 rounded-xl text-primary border border-primary/20 shrink-0'>
            <Target className='size-6' />
          </div>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Average Score</p>
            <h3 className='text-2xl font-extrabold mt-0.5 text-foreground'>{overview.averageScore}%</h3>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-card/80 border border-border/60 hover:bg-card transition-colors shadow-xs'>
        <CardContent className='p-5 flex items-center gap-4'>
          <div className='bg-emerald-500/10 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0'>
            <Award className='size-6' />
          </div>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Completion Rate</p>
            <h3 className='text-2xl font-extrabold mt-0.5 text-foreground'>{overview.completionRate}%</h3>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-card/80 border border-border/60 hover:bg-card transition-colors shadow-xs'>
        <CardContent className='p-5 flex items-center gap-4'>
          <div className='bg-amber-500/10 p-3 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0'>
            <TrendingUp className='size-6' />
          </div>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Top Percentile</p>
            <h3 className='text-2xl font-extrabold mt-0.5 text-foreground'>{overview.topPercentileScore}%</h3>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-card/80 border border-border/60 hover:bg-card transition-colors shadow-xs'>
        <CardContent className='p-5 flex items-center gap-4'>
          <div className='bg-blue-500/10 p-3 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0'>
            <Brain className='size-6' />
          </div>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Total Assessments</p>
            <h3 className='text-2xl font-extrabold mt-0.5 text-foreground'>{overview.totalAssessments}</h3>
          </div>
        </CardContent>
      </Card>
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
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2'>
          <Skeleton className='lg:col-span-2 h-80 bg-muted/60 rounded-xl border border-border/60' />
          <Skeleton className='h-80 bg-muted/60 rounded-xl border border-border/60' />
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

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2'>
        <Card className='lg:col-span-2 bg-card/80 border border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg font-bold text-foreground'>Score Trend</CardTitle>
            <CardDescription className='text-xs text-muted-foreground font-medium'>Performance historical timeline across your recent assessment evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart data={data.trend} height='260px' />
          </CardContent>
        </Card>

        <Card className='bg-card/80 border border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg font-bold text-foreground'>Topic Mastery</CardTitle>
            <CardDescription className='text-xs text-muted-foreground font-medium'>Competency evaluation of your strongest and weakest domains</CardDescription>
          </CardHeader>
          <CardContent>
            <TopicAnalysis topics={data.skills} />
          </CardContent>
        </Card>

        <Card className='lg:col-span-2 bg-card/80 border border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg font-bold text-foreground'>Difficulty Analysis</CardTitle>
            <CardDescription className='text-xs text-muted-foreground font-medium'>Success percentage and response accuracy categorized by difficulty tier</CardDescription>
          </CardHeader>
          <CardContent>
            <DifficultyAnalysis stats={data.difficulty} />
          </CardContent>
        </Card>

        <Card className='bg-card/80 border border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg font-bold text-foreground'>Peer Comparison</CardTitle>
            <CardDescription className='text-xs text-muted-foreground font-medium'>Comparative evaluation against standard cohort benchmarks</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col justify-center h-full pb-8'>
            <PerformanceComparisonChart
              userScore={data.overview.averageScore}
              averageScore={data.overview.peerAverageScore ?? 65}
              topPercentileScore={data.overview.topPercentileScore}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
