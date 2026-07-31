'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResultAnalytics } from '../hooks/results.hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { StrengthWeaknessPanel } from '../components/StrengthWeaknessPanel';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { ChevronLeft, Target, PlayCircle } from 'lucide-react';
import { RadarChart } from '../components/RadarChart';
import { SectionAccuracyChart } from '../components/SectionAccuracyChart';

export const PerformanceAnalyticsPage = () => {
  const params = useParams();
  const router = useRouter();
  const navigate = router.push;
  const attemptId = params.attemptId;

  const { data: analytics, isLoading, isError } = useResultAnalytics(attemptId as string);

  if (isLoading) return <Loading />;

  if (isError || !analytics) {
    return (
      <EmptyState
        title='No Analytics Available'
        description='Unable to load performance analytics for this result.'
        actionLabel='Go Back'
        onAction={() => navigate(`/candidate/results/${attemptId}`)}
      />
    );
  }

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8 space-y-8'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => navigate(`/candidate/results/${attemptId}`)}>
          <ChevronLeft className='w-5 h-5' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
            Performance Analytics
          </h1>
          <p className='text-sm text-gray-500'>Detailed breakdown of your assessment performance</p>
        </div>
      </div>

      {/* AI Generated Recommendation over the result */}
      <div>
        <h2 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
          🤖 AI Recommended Action Plan
        </h2>
        <RecommendationPanel attemptId={attemptId as string} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-indigo-100 p-3 rounded-full'>
              <PlayCircle className='text-indigo-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Attempt Rate</p>
              <h3 className='text-2xl font-bold'>{analytics.attemptRate ?? 0}%</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 flex items-center gap-4'>
            <div className='bg-green-100 p-3 rounded-full'>
              <Target className='text-green-600 w-6 h-6' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500'>Completion Rate</p>
              <h3 className='text-2xl font-bold'>{analytics.completionRate ?? 0}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <Card>
          <CardHeader>
            <CardTitle>Topic Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.topicAccuracy || {}).length > 0 ? (
              <RadarChart data={analytics.topicAccuracy as Record<string, number>} />
            ) : (
              <p className="text-gray-500 text-sm">Not enough topic data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Section Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.sectionAccuracy || {}).length > 0 ? (
              <SectionAccuracyChart data={analytics.sectionAccuracy as Record<string, number>} />
            ) : (
              <p className="text-gray-500 text-sm">Not enough accuracy data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className='text-xl font-bold text-gray-900 mb-4'>Strengths & Weaknesses</h2>
        <StrengthWeaknessPanel attemptId={attemptId as string} />
      </div>

      <div>
        <h2 className='text-xl font-bold text-gray-900 mb-4'>Improvement Recommendations</h2>
        <RecommendationPanel attemptId={attemptId as string} />
      </div>
    </div>
  );
};
