'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useResultDetails, useResultAnalytics } from '../hooks/results.hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { ResultStatusTracker } from '../components/ResultStatusTracker';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { resultApi } from '../api/results.api';
import { RadarChart } from '../components/RadarChart';
import { SectionAccuracyChart } from '../components/SectionAccuracyChart';
import { StrengthWeaknessPanel } from '../components/StrengthWeaknessPanel';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { Target, PlayCircle } from 'lucide-react';

export const ResultDetailsPage = () => {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();
  const navigate = router.push;
  const { data: result, isLoading: detailsLoading, isError, refetch } = useResultDetails(attemptId || '');
  const { data: analytics, isLoading: analyticsLoading } = useResultAnalytics(attemptId || '');
  
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [isExportingJson, setIsExportingJson] = React.useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const blob = await resultApi.exportToPdf(attemptId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `result-${attemptId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    } catch (e) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setIsExportingJson(true);
      const data = await resultApi.exportToJson(attemptId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `result-${attemptId}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('JSON exported successfully');
    } catch (e) {
      toast.error('Failed to export JSON');
    } finally {
      setIsExportingJson(false);
    }
  };

  if (detailsLoading) return <Loading />;

  if (isError || !result) {
    return (
      <EmptyState
        title='Result Not Found'
        description="We couldn't load the details for this assessment attempt."
        actionLabel='Go Back'
        onAction={() => navigate('/candidate/results')}
      />
    );
  }

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8 space-y-6'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
            {result.assessmentName}
          </h1>
          <p className='text-sm text-gray-500'>
            Submitted on {new Date(result.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <div className='mt-4 md:mt-0 flex flex-wrap gap-2'>
          <Button 
            variant='outline' 
            onClick={handleExportJson} 
            disabled={isExportingJson}
          >
            {isExportingJson ? 'Exporting...' : 'Export JSON'}
          </Button>
          <Button 
            onClick={handleExportPdf} 
            disabled={isExportingPdf}
          >
            {isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <ResultStatusTracker attemptId={attemptId!} onComplete={refetch} />

      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-500'>Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{result.score}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-500'>Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{result.percentage}%</div>
            <Progress value={result.percentage} className='mt-2 h-2' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-500'>Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{result.accuracy ?? 0}%</div>
            <Progress value={result.accuracy ?? 0} className='mt-2 h-2 bg-slate-200' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-500'>Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{result.completion}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-500'>Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{result.rank > 0 ? `#${result.rank}` : 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      {analyticsLoading ? (
        <div className='pt-8 flex justify-center'><Loading /></div>
      ) : analytics ? (
        <div className='pt-8 space-y-8'>
          <h2 className='text-2xl font-bold tracking-tight text-gray-900'>Performance Analytics</h2>
          
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

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <Card className='lg:col-span-1'>
              <CardHeader>
                <CardTitle>Topic Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <RadarChart data={analytics.topicAccuracy as Record<string, number>} />
              </CardContent>
            </Card>

            <Card className='lg:col-span-1'>
              <CardHeader>
                <CardTitle>Difficulty Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <SectionAccuracyChart data={analytics.difficultyAccuracy as Record<string, number>} />
              </CardContent>
            </Card>

            <Card className='lg:col-span-1'>
              <CardHeader>
                <CardTitle>Section Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <SectionAccuracyChart data={analytics.sectionAccuracy as Record<string, number>} />
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>Strengths & Weaknesses</h2>
            <StrengthWeaknessPanel attemptId={attemptId!} />
          </div>

          <div>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>Improvement Recommendations</h2>
            <RecommendationPanel attemptId={attemptId!} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
