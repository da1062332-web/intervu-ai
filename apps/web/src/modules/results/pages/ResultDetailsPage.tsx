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
import { ShareableResultCard } from '../components/ShareableResultCard';
import { Target, PlayCircle } from 'lucide-react';
import { PerformanceInsightsDashboard } from '../components/PerformanceInsightsDashboard';

export const ResultDetailsPage = () => {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();
  const navigate = router.push;
  const {
    data: result,
    isLoading: detailsLoading,
    isError,
    refetch,
  } = useResultDetails(attemptId || '');
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
            onClick={() => navigate(`/candidate/results/${attemptId}/analytics`)}
          >
            View Analytics
          </Button>
          <Button variant='outline' onClick={handleExportJson} disabled={isExportingJson}>
            {isExportingJson ? 'Exporting...' : 'Export JSON'}
          </Button>
          <Button onClick={handleExportPdf} disabled={isExportingPdf}>
            {isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <ResultStatusTracker attemptId={attemptId!} onComplete={refetch} />

      <div className="pt-4">
        <PerformanceInsightsDashboard attemptId={attemptId!} />
      </div>

      {/* Preserve the Shareable Result Card at the bottom */}
      <div className="pt-8 border-t mt-8">
        <ShareableResultCard attemptId={attemptId!} />
      </div>
    </div>
  );
};
