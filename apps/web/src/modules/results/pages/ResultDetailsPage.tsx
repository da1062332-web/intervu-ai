'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResultDetails } from '../hooks/results.hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { ResultStatusTracker } from '../components/ResultStatusTracker';
import { Progress } from '@/components/ui/progress';

export const ResultDetailsPage = () => {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();
  const navigate = router.push;
  const { data: result, isLoading, isError, refetch } = useResultDetails(attemptId || '');

  if (isLoading) return <Loading />;
  
  if (isError || !result) {
    return (
      <EmptyState 
        title="Result Not Found"
        description="We couldn't load the details for this assessment attempt."
        actionLabel="Go Back"
        onAction={() => navigate('/candidate/results')}
      />
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{result.assessmentName}</h1>
          <p className="text-sm text-gray-500">Submitted on {new Date(result.submittedAt).toLocaleDateString()}</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/results/${attemptId}/analytics`)}>
            View Analytics
          </Button>
          <Button onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </div>

      <ResultStatusTracker attemptId={attemptId!} onComplete={refetch} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{result.score}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{result.percentage}%</div>
            <Progress value={result.percentage} className="mt-2 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{result.completion}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{result.rank > 0 ? `#${result.rank}` : 'N/A'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

