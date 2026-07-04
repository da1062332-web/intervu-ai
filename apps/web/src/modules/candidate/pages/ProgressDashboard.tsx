'use client';

import { useProgress } from '../hooks/useProgress';
import { ScoreTrendChart } from '../components/analytics/ScoreTrendChart';
import { TopicAnalysis } from '../components/analytics/TopicAnalysis';
import { PerformanceComparisonChart } from '../components/analytics/PerformanceComparisonChart';
import { DifficultyAnalysis } from '../components/analytics/DifficultyAnalysis';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TrendingUp, Target, Brain, Award, AlertCircle } from 'lucide-react';
import React from 'react';

// Memoize progress cards for performance
const ProgressCards = React.memo(({ overview }: { overview: any }) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      <Card className='glass-card'>
        <CardContent className='p-6 flex items-center gap-4'>
          <div className='bg-primary/10 p-3 rounded-xl text-primary'>
            <Target className='size-6' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground font-medium'>Average Score</p>
            <h3 className='text-2xl font-bold'>{overview.averageScore}%</h3>
          </div>
        </CardContent>
      </Card>

      <Card className='glass-card'>
        <CardContent className='p-6 flex items-center gap-4'>
          <div className='bg-green-500/10 p-3 rounded-xl text-green-500'>
            <Award className='size-6' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground font-medium'>Completion Rate</p>
            <h3 className='text-2xl font-bold'>{overview.completionRate}%</h3>
          </div>
        </CardContent>
      </Card>

      <Card className='glass-card'>
        <CardContent className='p-6 flex items-center gap-4'>
          <div className='bg-yellow-500/10 p-3 rounded-xl text-yellow-500'>
            <TrendingUp className='size-6' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground font-medium'>Top Percentile</p>
            <h3 className='text-2xl font-bold'>{overview.topPercentileScore}%</h3>
          </div>
        </CardContent>
      </Card>

      <Card className='glass-card'>
        <CardContent className='p-6 flex items-center gap-4'>
          <div className='bg-blue-500/10 p-3 rounded-xl text-blue-500'>
            <Brain className='size-6' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground font-medium'>Total Assessments</p>
            <h3 className='text-2xl font-bold'>{overview.totalAssessments}</h3>
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
      <div className='space-y-6 animate-pulse'>
        <div className='h-12 w-48 bg-muted rounded' />
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className='h-24 bg-muted rounded-xl' />
          ))}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 h-64 bg-muted rounded-xl' />
          <div className='h-64 bg-muted rounded-xl' />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh] text-center space-y-4'>
        <AlertCircle className='size-12 text-destructive' />
        <div>
          <h2 className='text-xl font-bold'>Unable to load progress</h2>
          <p className='text-muted-foreground'>
            We couldn't fetch your progress data at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      <div className='flex items-center gap-3 border-b pb-6'>
        <div className='bg-primary/10 p-2.5 rounded-lg'>
          <TrendingUp className='size-6 text-primary' />
        </div>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Progress Dashboard</h1>
          <p className='text-muted-foreground'>Track your skills and improvement over time.</p>
        </div>
      </div>

      <ProgressCards overview={data.overview} />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <Card className='lg:col-span-2 glass-card'>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Your performance over recent assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart data={data.trend} height='240px' />
          </CardContent>
        </Card>

        <Card className='glass-card'>
          <CardHeader>
            <CardTitle>Topic Mastery</CardTitle>
            <CardDescription>Your strongest and weakest skills</CardDescription>
          </CardHeader>
          <CardContent>
            <TopicAnalysis topics={data.skills} />
          </CardContent>
        </Card>

        <Card className='lg:col-span-2 glass-card'>
          <CardHeader>
            <CardTitle>Difficulty Analysis</CardTitle>
            <CardDescription>Accuracy based on question difficulty</CardDescription>
          </CardHeader>
          <CardContent>
            <DifficultyAnalysis stats={data.difficulty} />
          </CardContent>
        </Card>

        <Card className='glass-card'>
          <CardHeader>
            <CardTitle>Peer Comparison</CardTitle>
            <CardDescription>How you stack up against other candidates</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col justify-center h-full pb-8'>
            <PerformanceComparisonChart
              userScore={data.overview.averageScore}
              averageScore={65} // Example static for average
              topPercentileScore={data.overview.topPercentileScore}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
