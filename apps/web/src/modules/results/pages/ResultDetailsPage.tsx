'use client';
import React from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
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
import { Target, PlayCircle, ChevronLeft } from 'lucide-react';
import { PerformanceInsightsDashboard } from '../components/PerformanceInsightsDashboard';
import { HiringEvaluationCard } from '@/features/candidate/results/components/HiringEvaluationCard';

export const ResultDetailsPage = () => {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const baseRoute = isAdminRoute ? '/admin/results' : '/candidate/results';
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
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (detailsLoading || !result) {
      const interval = setInterval(() => {
        setProgress((prev: number) => (prev >= 90 ? prev : prev + Math.random() * 10));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [detailsLoading, result]);

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

  if (detailsLoading || isError || !result) {
    return (
      <div className='w-full min-h-[calc(100vh-120px)] flex flex-col justify-between p-4 md:p-6 lg:p-8 animate-fade-in-up'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate(baseRoute)}
            className='text-muted-foreground hover:text-foreground gap-1.5 -ml-2 text-xs font-medium'
          >
            <ChevronLeft className='size-4' />
            {isAdminRoute ? 'Back to All Test Attempts' : 'Back to Results History'}
          </Button>
        </div>

        <div className='flex flex-col items-center justify-center flex-1 my-6'>
          <div className='bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 md:p-10 flex flex-col items-center max-w-lg w-full text-center transition-all duration-300'>
            {/* Animated spinner */}
            <div className='relative mb-6'>
              <div className='w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 animate-spin' />
              <div className='absolute inset-0 flex items-center justify-center'>
                <Target className='size-8 text-indigo-600 dark:text-indigo-400' />
              </div>
            </div>

            <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
              {isAdminRoute ? 'Loading Evaluation Report' : 'Generating Your Results'}
            </h2>
            <p className='text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-6'>
              {isAdminRoute 
                ? 'Retrieving candidate answers, algorithmic score metrics, and hiring evaluation breakdown from the database…' 
                : 'Your assessment has been submitted. We are evaluating your answers and computing your score. This may take up to a minute — please stay on this page.'}
            </p>

            {/* Animated progress bar */}
            <div className='w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden'>
              <div 
                className='h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden' 
                style={{ width: `${Math.min(progress, 95)}%` }}
              >
                <div className='absolute inset-0 bg-white/20 w-full animate-shimmer' style={{ transform: 'translateX(-100%)' }} />
              </div>
            </div>
            <p className='text-xs text-gray-500 dark:text-slate-400 mt-3 flex items-center justify-center gap-1'>
              <span>{Math.min(Math.round(progress), 95)}%</span>
              <span>&bull;</span>
              <span>{isAdminRoute ? 'Connecting to evaluation engine…' : 'Checking every 5 seconds…'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in-up'>
      <div className='flex items-center gap-2 -mb-2'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate(baseRoute)}
          className='text-muted-foreground hover:text-foreground gap-1.5 -ml-2 text-xs font-medium'
        >
          <ChevronLeft className='size-4' />
          {isAdminRoute ? 'Back to All Test Attempts' : 'Back to Results History'}
        </Button>
      </div>

      <div className='flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-slate-800 pb-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
            {result.assessmentName}
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            Attempt Session Reference: <span className='font-mono font-medium text-foreground/80'>{attemptId}</span> &bull; Submitted on {new Date(result.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <div className='mt-4 md:mt-0 flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={() => navigate(`${baseRoute}/${attemptId}/analytics`)}
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

      {result.qualification && (
        <div className="pt-2">
          <HiringEvaluationCard
            qualification={result.qualification}
            qualificationReason={result.qualificationReason}
            evaluationStrategy={result.evaluationStrategy}
            foundationScore={result.foundationScore}
            advancedScore={result.advancedScore}
            codingSolved={result.codingSolved}
            qualificationDetails={result.qualificationDetails}
          />
        </div>
      )}

      <div className="pt-4">
        <PerformanceInsightsDashboard attemptId={attemptId!} />
      </div>
    </div>
  );
};
