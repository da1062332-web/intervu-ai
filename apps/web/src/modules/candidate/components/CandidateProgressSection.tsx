'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProgress } from '../hooks/useProgress';
import dynamic from 'next/dynamic';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Brain, Award, AlertCircle, ArrowRight } from 'lucide-react';

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
    { label: 'Average Score', value: `${overview?.averageScore ?? 0}/100`, icon: Target, bg: 'bg-primary/10 text-primary border-primary/20' },
    { label: 'Completion Rate', value: `${overview?.completionRate ?? 0}%`, icon: Award, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    { label: 'Top Percentile', value: `${overview?.topPercentileScore ?? 0}/100`, icon: TrendingUp, bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    { label: 'Evaluated Tests', value: `${overview?.totalAssessments ?? 0}`, icon: Brain, bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  ];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5'>
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <Card key={idx} className='rounded-2xl border border-border/70 bg-card p-5 shadow-2xs hover:border-primary/30 transition-all'>
            <CardContent className='p-0 flex items-center justify-between gap-4'>
              <div>
                <p className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>{c.label}</p>
                <h3 className='text-2xl font-extrabold mt-1 text-foreground'>{c.value}</h3>
              </div>
              <div className={`p-3 rounded-xl border shrink-0 ${c.bg}`}>
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
  const { data, isLoading, error } = useProgress();

  if (isLoading) {
    return (
      <div className='space-y-4' aria-busy='true' aria-label='Loading analytics'>
        <div className='flex items-center justify-between pb-1'>
          <Skeleton className='h-6 w-44' />
          <Skeleton className='h-4 w-28' />
        </div>
        <div className={compact ? 'space-y-5' : 'grid grid-cols-1 lg:grid-cols-3 gap-5'}>
          <Skeleton className='h-64 w-full rounded-2xl border border-border/60' />
          <Skeleton className='h-64 w-full rounded-2xl border border-border/60' />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className='space-y-5'>
      {!compact && (
        <SectionHeader
          title='Progress Analytics'
          description='Track your skill development, accuracy metrics, and assessment growth over time.'
          breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Progress Analytics' }]}
        />
      )}

      {compact && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-3'>
          <div>
            <h3 className='text-lg font-bold text-foreground tracking-tight'>Progress & Skill Mastery</h3>
            <p className='text-xs font-medium text-muted-foreground mt-0.5'>
              Historical trajectory and domain strength index
            </p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='text-primary hover:text-primary/90 font-bold gap-1 text-xs shrink-0 px-3 h-8 hover:bg-primary/10 rounded-xl'
            onClick={() => router.push('/candidate/progress')}
          >
            Full Analytics <ArrowRight className='size-3.5 ml-0.5' />
          </Button>
        </div>
      )}

      {!compact && <ProgressCards overview={data.overview} />}

      <div className={compact ? 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8' : 'grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'}>
        <Card className={`${compact ? '' : 'lg:col-span-2'} rounded-2xl border border-border/70 bg-card p-6 shadow-2xs`}>
          <CardHeader className='p-0 pb-4 mb-2 border-b border-border/30'>
            <CardTitle className='text-base font-bold text-foreground'>Score Timeline Trend</CardTitle>
            <CardDescription className='text-xs text-muted-foreground font-medium mt-0.5'>
              Score trajectory across evaluation sessions
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0 pt-2'>
            <ScoreTrendChart data={data.trend} height='240px' />
          </CardContent>
        </Card>

        <Card className='rounded-2xl border border-border/70 bg-card p-6 shadow-2xs'>
          <CardHeader className='p-0 pb-4 mb-2 border-b border-border/30'>
            <CardTitle className='text-base font-bold text-foreground'>Domain Competency</CardTitle>
            <CardDescription className='text-xs text-muted-foreground font-medium mt-0.5'>
              Performance index by technical subject area
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0 pt-2'>
            <TopicAnalysis topics={data.skills} />
          </CardContent>
        </Card>

        {!compact && (
          <>
            <Card className='lg:col-span-2 rounded-2xl border border-border/70 bg-card p-6 shadow-2xs'>
              <CardHeader className='p-0 pb-4 mb-2 border-b border-border/30'>
                <CardTitle className='text-base font-bold text-foreground'>Difficulty Breakdown</CardTitle>
                <CardDescription className='text-xs text-muted-foreground font-medium mt-0.5'>
                  Success percentage categorized by assessment difficulty tier
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0 pt-2'>
                <DifficultyAnalysis stats={data.difficulty} />
              </CardContent>
            </Card>

            <Card className='rounded-2xl border border-border/70 bg-card p-6 shadow-2xs'>
              <CardHeader className='p-0 pb-4 mb-2 border-b border-border/30'>
                <CardTitle className='text-base font-bold text-foreground'>Cohort Comparison</CardTitle>
                <CardDescription className='text-xs text-muted-foreground font-medium mt-0.5'>
                  Your average score compared to the overall candidate pool
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0 pt-2 flex flex-col justify-center h-full pb-8'>
                <PerformanceComparisonChart
                  userScore={data.overview.averageScore}
                  averageScore={(data.overview as any).peerAverageScore ?? 65}
                  topPercentileScore={data.overview.topPercentileScore}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
