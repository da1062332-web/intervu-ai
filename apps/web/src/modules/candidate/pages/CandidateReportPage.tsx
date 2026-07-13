'use client';

import React, { useState } from 'react';
import { useCandidateReport, ReportData } from '../hooks/useCandidateReport';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle, XCircle, Lightbulb, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';
import { format } from 'date-fns';

interface CandidateReportPageProps {
  attemptId: string;
}

const ReportHeader = React.memo(({ data }: { data: ReportData }) => (
  <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b'>
    <div>
      <h1 className='text-3xl font-bold tracking-tight'>{data.testName}</h1>
      <p className='text-muted-foreground mt-1'>
        Completed on {data.completedAt ? format(new Date(data.completedAt), 'MMMM d, yyyy') : 'N/A'}
      </p>
    </div>
  </div>
));
ReportHeader.displayName = 'ReportHeader';

const ScoreOverview = React.memo(({ data }: { data: ReportData }) => (
  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
    <Card className='glass-card flex flex-col items-center justify-center p-6 text-center h-full'>
      <div className='text-muted-foreground font-medium mb-2'>Overall Score</div>
      <div className='text-5xl font-bold text-primary mb-2'>{data.score}%</div>
      <Progress value={data.score} className='h-2 w-full max-w-[200px]' />
    </Card>

    <Card className='glass-card p-6 md:col-span-2'>
      <h3 className='font-semibold mb-4 flex items-center gap-2'>
        <Clock className='size-5 text-muted-foreground' />
        Time Overview
      </h3>
      <div className='flex flex-col sm:flex-row gap-8'>
        <div>
          <div className='text-2xl font-bold'>{Math.floor(data.timeSpent / 60)} min</div>
          <div className='text-sm text-muted-foreground'>Time Spent</div>
        </div>
        <div>
          <div className='text-2xl font-bold'>{Math.floor(data.totalTime / 60)} min</div>
          <div className='text-sm text-muted-foreground'>Total Allowed Time</div>
        </div>
      </div>
      <div className='mt-4'>
        <div className='flex justify-between text-xs mb-1'>
          <span>{Math.floor((data.timeSpent / data.totalTime) * 100)}% Used</span>
        </div>
        <Progress value={(data.timeSpent / data.totalTime) * 100} className='h-2' />
      </div>
    </Card>
  </div>
));
ScoreOverview.displayName = 'ScoreOverview';

const StrengthSection = React.memo(({ strengths }: { strengths: any[] }) => (
  <Card className='glass-card h-full'>
    <CardHeader>
      <CardTitle className='flex items-center gap-2 text-green-600 dark:text-green-400'>
        <CheckCircle className='size-5' />
        Key Strengths
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className='space-y-3'>
        {strengths.map((str, idx) => {
          const content =
            typeof str === 'object' && str !== null
              ? str.description || str.title || str.name || JSON.stringify(str)
              : str;
          return (
            <li key={idx} className='flex items-start gap-2'>
              <span className='size-1.5 rounded-full bg-green-500 mt-2 shrink-0' />
              <span className='text-sm'>{content}</span>
            </li>
          );
        })}
      </ul>
      {strengths.length === 0 && (
        <p className='text-sm text-muted-foreground italic'>No key strengths identified.</p>
      )}
    </CardContent>
  </Card>
));
StrengthSection.displayName = 'StrengthSection';

const WeaknessSection = React.memo(({ weaknesses }: { weaknesses: any[] }) => (
  <Card className='glass-card h-full'>
    <CardHeader>
      <CardTitle className='flex items-center gap-2 text-red-500'>
        <XCircle className='size-5' />
        Areas for Improvement
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className='space-y-3'>
        {weaknesses.map((weak, idx) => {
          const content =
            typeof weak === 'object' && weak !== null
              ? weak.description || weak.title || weak.name || JSON.stringify(weak)
              : weak;
          return (
            <li key={idx} className='flex items-start gap-2'>
              <span className='size-1.5 rounded-full bg-red-500 mt-2 shrink-0' />
              <span className='text-sm'>{content}</span>
            </li>
          );
        })}
      </ul>
      {weaknesses.length === 0 && (
        <p className='text-sm text-muted-foreground italic'>
          No significant areas for improvement identified.
        </p>
      )}
    </CardContent>
  </Card>
));
WeaknessSection.displayName = 'WeaknessSection';

const RecommendationSection = React.memo(({ recommendations }: { recommendations: any[] }) => (
  <Card className='glass-card'>
    <CardHeader>
      <CardTitle className='flex items-center gap-2 text-yellow-500'>
        <Lightbulb className='size-5' />
        Recommendations
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className='space-y-3'>
        {recommendations.map((rec, idx) => {
          const content =
            typeof rec === 'object' && rec !== null
              ? rec.description || rec.title || JSON.stringify(rec)
              : rec;

          return (
            <li key={idx} className='flex items-start gap-2'>
              <span className='size-1.5 rounded-full bg-yellow-500 mt-2 shrink-0' />
              <span className='text-sm'>{content}</span>
            </li>
          );
        })}
      </ul>
      {recommendations.length === 0 && (
        <p className='text-sm text-muted-foreground italic'>
          No specific recommendations available.
        </p>
      )}
    </CardContent>
  </Card>
));
RecommendationSection.displayName = 'RecommendationSection';

export function CandidateReportPage({ attemptId }: CandidateReportPageProps) {
  const { data, isLoading, error } = useCandidateReport(attemptId);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'json') => {
    try {
      setIsExporting(true);
      const blob = await apiClient.request<Blob>(
        `/reports/export/${format}/${attemptId}`,
        {
          responseType: 'blob',
          skipErrorToast: true,
        },
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${attemptId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${format.toUpperCase()} Exported successfully`, { ariaLive: 'polite' } as any);
    } catch (err) {
      toast.error(`Failed to export ${format.toUpperCase()}`, { ariaLive: 'polite' } as any);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6 animate-pulse p-4' aria-busy='true' aria-label='Loading report'>
        <div className='h-12 w-1/3 bg-muted rounded' />
        <div className='h-48 bg-muted rounded-xl' />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='h-64 bg-muted rounded-xl' />
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
          <h2 className='text-xl font-bold'>Report not found</h2>
          <p className='text-muted-foreground'>We couldn't load the report for this assessment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6'>
        <ReportHeader data={data} />

        {/* Export Panel */}
        <div className='flex gap-3 mt-4 md:mt-0'>
          <Button variant='outline' onClick={() => handleExport('json')} disabled={isExporting}>
            <Download className='size-4 mr-2' />
            JSON
          </Button>
          <Button variant='default' onClick={() => handleExport('pdf')} disabled={isExporting}>
            <Download className='size-4 mr-2' />
            {isExporting ? 'Exporting...' : 'PDF'}
          </Button>
        </div>
      </div>

      <ScoreOverview data={data} />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <StrengthSection strengths={data.strengths || []} />
        <WeaknessSection weaknesses={data.weaknesses || []} />
      </div>

      <RecommendationSection recommendations={data.recommendations || []} />
    </div>
  );
}
