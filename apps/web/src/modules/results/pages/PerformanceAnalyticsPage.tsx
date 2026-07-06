'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useCandidateProgress } from '../../reports/hooks/progress.hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronLeft, Target, PlayCircle, TrendingUp, Award } from 'lucide-react';
import { RadarChart } from '../components/RadarChart';
import { SectionAccuracyChart } from '../components/SectionAccuracyChart';

export const PerformanceAnalyticsPage = () => {
  const router = useRouter();
  const navigate = router.push;

  const { data: progress, isLoading: progressLoading, isError } = useCandidateProgress();

  if (progressLoading) return <Loading />;

  if (isError || !progress || progress.overview?.totalAssessments === 0) {
    return (
      <EmptyState
        title='No Analytics Available'
        description='Complete an assessment to see your performance trend dashboard.'
        actionLabel='View Assessments'
        onAction={() => navigate(`/candidate/tests`)}
      />
    );
  }

  // Transform data for charts
  const topicData: Record<string, number> =
    progress.skills?.reduce((acc: Record<string, number>, s: any) => {
      acc[s.topic] = s.score;
      return acc;
    }, {}) || {};

  const difficultyData: Record<string, number> = progress.difficulty
    ? {
        Easy: progress.difficulty.easy.attempted
          ? Math.round(
              (progress.difficulty.easy.correct / progress.difficulty.easy.attempted) * 100,
            )
          : 0,
        Medium: progress.difficulty.medium.attempted
          ? Math.round(
              (progress.difficulty.medium.correct / progress.difficulty.medium.attempted) * 100,
            )
          : 0,
        Hard: progress.difficulty.hard.attempted
          ? Math.round(
              (progress.difficulty.hard.correct / progress.difficulty.hard.attempted) * 100,
            )
          : 0,
      }
    : {};

  const accuracyData: Record<string, number> =
    progress.trend?.reduce((acc: Record<string, number>, t: any) => {
      acc[`Attempt ${new Date(t.date).toLocaleDateString()}`] = t.score;
      return acc;
    }, {}) || {};

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8 space-y-8'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => navigate(`/candidate/dashboard`)}>
          <ChevronLeft className='w-5 h-5' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
            Performance Trend Dashboard
          </h1>
          <p className='text-sm text-gray-500'>Your historical progress and analytics</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-indigo-100 p-3 rounded-full'>
              <PlayCircle className='text-indigo-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Total Attempts</p>
              <h3 className='text-2xl font-bold'>{progress.overview?.totalAssessments || 0}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-green-100 p-3 rounded-full'>
              <Target className='text-green-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Average Score</p>
              <h3 className='text-2xl font-bold'>{progress.overview?.averageScore || 0}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-blue-100 p-3 rounded-full'>
              <TrendingUp className='text-blue-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Completion Rate</p>
              <h3 className='text-2xl font-bold'>{progress.overview?.completionRate ?? 0}%</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-purple-100 p-3 rounded-full'>
              <Award className='text-purple-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Best Attempt</p>
              <h3 className='text-2xl font-bold'>
                {progress.bestScore ??
                  Math.max(...(progress.trend?.map((p: any) => p.score) || [0]))}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>Topic Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(topicData).length > 0 ? (
              <RadarChart data={topicData} />
            ) : (
              <p className='text-gray-500 text-sm'>Not enough topic data.</p>
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>Difficulty Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(difficultyData).length > 0 ? (
              <SectionAccuracyChart data={difficultyData} />
            ) : (
              <p className='text-gray-500 text-sm'>Not enough difficulty data.</p>
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>Accuracy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(accuracyData).length > 0 ? (
              <SectionAccuracyChart data={accuracyData} />
            ) : (
              <p className='text-gray-500 text-sm'>Not enough accuracy data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
