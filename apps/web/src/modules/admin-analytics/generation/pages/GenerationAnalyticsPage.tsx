'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, XCircle, Clock, BarChart3, TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { apiClient } from '@/services/api/client';

export interface GenerationAnalyticsData {
  requests: number;
  successes: number;
  failures: number;
  avgDurationMs: number;
  questionsGeneratedPerTopic: Record<string, number>;
  questionsGeneratedPerDifficulty: Record<string, number>;
  trendData: Array<{ date: string; success: number; failure: number }>;
}

export function GenerationAnalyticsPage() {
  const [data, setData] = useState<GenerationAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.request<GenerationAnalyticsData>('/admin/analytics/generation');
        setData(response);
      } catch (error) {
        console.error('Failed to load generation analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const topicsArray = data
    ? Object.entries(data.questionsGeneratedPerTopic).map(([topic, count]) => ({ topic, count }))
    : [];
  const maxTopicCount = topicsArray.length > 0 ? Math.max(...topicsArray.map((t) => t.count)) : 1;

  const difficultyArray = data
    ? Object.entries(data.questionsGeneratedPerDifficulty).map(([diff, count]) => ({ diff, count }))
    : [];
  const maxDiffCount = difficultyArray.length > 0 ? Math.max(...difficultyArray.map((d) => d.count)) : 1;

  const maxTrendVal = data?.trendData && data.trendData.length > 0
    ? Math.max(...data.trendData.map((t) => t.success + t.failure))
    : 1;

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <PageHeader
        title='Generation Analytics'
        subtitle='Observe the health, speed, volume, and success rates of our automated AI question generation pipelines.'
        action={
          <div className='flex gap-3'>
            <Button asChild variant='outline'>
              <Link href='/admin/dashboard'>
                <ArrowLeft className='size-4 mr-2' />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant='destructive'>
              <Link href='/admin/generation/failures'>
                <AlertTriangle className='size-4 mr-2' />
                Failures Log
              </Link>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <Clock className='size-8 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <>
          {/* Small Stats Grid */}
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-6 flex items-center gap-4'>
                <div className='p-3 bg-indigo-500/10 rounded-xl text-indigo-500'>
                  <PlayCircle className='size-6' />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Total Requests</p>
                  <p className='text-2xl font-bold font-heading text-foreground mt-0.5'>{data?.requests ?? 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-6 flex items-center gap-4'>
                <div className='p-3 bg-emerald-500/10 rounded-xl text-emerald-500'>
                  <CheckCircle className='size-6' />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Successes</p>
                  <p className='text-2xl font-bold font-heading text-foreground mt-0.5'>{data?.successes ?? 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-6 flex items-center gap-4'>
                <div className='p-3 bg-red-500/10 rounded-xl text-red-500'>
                  <XCircle className='size-6' />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Failures</p>
                  <p className='text-2xl font-bold font-heading text-foreground mt-0.5'>{data?.failures ?? 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-6 flex items-center gap-4'>
                <div className='p-3 bg-amber-500/10 rounded-xl text-amber-500'>
                  <Clock className='size-6' />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Avg Duration</p>
                  <p className='text-2xl font-bold font-heading text-foreground mt-0.5'>
                    {((data?.avgDurationMs ?? 0) / 1000).toFixed(2)}s
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className='grid gap-6 md:grid-cols-3'>
            {/* Trend Chart Card */}
            <Card className='md:col-span-2 glass border border-border shadow-lg'>
              <CardHeader>
                <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
                  <TrendingUp className='size-5 text-indigo-500' />
                  Generation Request Trend
                </CardTitle>
                <CardDescription>
                  Daily count of successful and failed generation runs.
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[300px] flex items-end gap-4 pt-6 border-t border-border/40'>
                {data?.trendData.map((t, idx) => {
                  const successPct = ((t.success) / maxTrendVal) * 100;
                  const failurePct = ((t.failure) / maxTrendVal) * 100;
                  return (
                    <div key={idx} className='flex-1 flex flex-col items-center gap-2 h-full justify-end'>
                      <div className='w-full relative flex-1 flex flex-col justify-end gap-1 min-h-[120px]'>
                        {t.failure > 0 && (
                          <div
                            className='w-full bg-red-500/70 hover:bg-red-500 rounded-t-sm transition-all duration-300'
                            style={{ height: `${failurePct}%` }}
                            title={`Failed: ${t.failure}`}
                          />
                        )}
                        {t.success > 0 && (
                          <div
                            className='w-full bg-primary/70 hover:bg-primary rounded-t-sm transition-all duration-300'
                            style={{ height: `${successPct}%` }}
                            title={`Successful: ${t.success}`}
                          />
                        )}
                      </div>
                      <span className='text-[10px] text-muted-foreground whitespace-nowrap'>{t.date}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Difficulty Distribution Chart */}
            <Card className='glass border border-border shadow-lg'>
              <CardHeader>
                <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
                  <BarChart3 className='size-5 text-emerald-500' />
                  Difficulty Distribution
                </CardTitle>
                <CardDescription>
                  Spread of questions generated across difficulty tiers.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6 pt-6 border-t border-border/40'>
                {difficultyArray.map((d, idx) => (
                  <div key={idx} className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='font-medium text-foreground'>{d.diff}</span>
                      <span className='text-muted-foreground font-semibold'>{d.count} Questions</span>
                    </div>
                    <div className='h-2 bg-muted rounded-full overflow-hidden w-full'>
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          d.diff === 'EASY'
                            ? 'bg-emerald-500'
                            : d.diff === 'MEDIUM'
                              ? 'bg-blue-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${(d.count / maxDiffCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Topics Generation volume */}
          <Card className='glass border border-border shadow-lg'>
            <CardHeader>
              <CardTitle className='text-lg font-heading font-semibold text-foreground'>
                Questions Generated Per Topic
              </CardTitle>
              <CardDescription>
                Overview of total question generation output categorized by syllabus topic registry.
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='divide-y divide-border/50'>
                {topicsArray.map((t, idx) => (
                  <div key={idx} className='py-4 flex items-center justify-between gap-6'>
                    <span className='text-sm text-foreground font-semibold w-1/4 truncate'>{t.topic}</span>
                    <div className='flex-1 max-w-xl h-2.5 bg-muted rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-primary transition-all duration-500 rounded-full'
                        style={{ width: `${(t.count / maxTopicCount) * 100}%` }}
                      />
                    </div>
                    <span className='text-sm text-muted-foreground w-[80px] text-right font-bold'>{t.count} items</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
