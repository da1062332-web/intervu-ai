'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResultAnalytics, useResultDetails } from '../hooks/results.hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { StrengthWeaknessPanel } from '../components/StrengthWeaknessPanel';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { ChevronLeft } from 'lucide-react';

export const PerformanceAnalyticsPage = () => {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();
  const navigate = router.push;
  
  const { data: details, isLoading: detailsLoading } = useResultDetails(attemptId || '');
  const { data: analytics, isLoading: analyticsLoading, isError } = useResultAnalytics(attemptId || '');

  if (detailsLoading || analyticsLoading) return <Loading />;
  
  if (isError || !analytics) {
    return (
      <EmptyState 
        title="Analytics Not Found"
        description="Detailed performance analytics are not available for this attempt."
        actionLabel="Go Back"
        onAction={() => navigate(`/results/${attemptId}`)}
      />
    );
  }

  const renderAccuracyBars = (dataObj: Record<string, number>, label: string) => {
    if (!dataObj || Object.keys(dataObj).length === 0) return <p className="text-sm text-gray-500">No {label} data available.</p>;
    
    return (
      <div className="space-y-4 mt-4">
        {Object.entries(dataObj).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 capitalize">{key}</span>
              <span className="text-gray-500">{value}%</span>
            </div>
            <Progress value={value} className="h-2" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/results/${attemptId}`)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Performance Analytics</h1>
          <p className="text-sm text-gray-500">{details?.assessmentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Topic Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            {renderAccuracyBars(analytics.topicAccuracy as any, 'topic')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Difficulty Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            {renderAccuracyBars(analytics.difficultyAccuracy as any, 'difficulty')}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Strengths & Weaknesses</h2>
        <StrengthWeaknessPanel attemptId={attemptId!} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Improvement Recommendations</h2>
        <RecommendationPanel attemptId={attemptId!} />
      </div>
    </div>
  );
};

