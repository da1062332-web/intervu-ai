'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Eye,
  Play,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { apiClient } from '@/services/api/client';

export interface AssemblyAnalyticsData {
  assembliesCreated: number;
  publishedTests: number;
  draftTests: number;
  failedAssemblies: number;
  averageAssemblyTime: number;
  drilldowns: Array<{
    id: string;
    assessment: string;
    totalQuestions: number;
    status: string;
    version: number;
    createdAt: string;
  }>;
}

export function AssemblyMonitoringPage() {
  const [data, setData] = useState<AssemblyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.request<AssemblyAnalyticsData>(
          '/admin/analytics/assembly',
        );
        setData(response);
      } catch (error) {
        console.error('Failed to load assembly analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <PageHeader
        title='Assembly Pipeline Monitoring'
        subtitle='Track completed test assemblies, draft vs. published configs, failed runs, and details per version.'
        action={
          <div className='flex gap-3'>
            <Button asChild variant='outline'>
              <Link href='/admin/dashboard'>
                <ArrowLeft className='size-4 mr-2' />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href='/admin/assembly'>
                <Play className='size-4 mr-2' />
                Assemble New Test
              </Link>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <>
          {/* KPI Stats Grid */}
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-5'>
            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-5 flex items-center gap-3'>
                <div className='p-2.5 bg-indigo-500/10 rounded-lg text-indigo-500'>
                  <Layers className='size-5' />
                </div>
                <div>
                  <p className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider'>
                    Created
                  </p>
                  <p className='text-lg font-bold font-heading text-foreground mt-0.5'>
                    {data?.assembliesCreated ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-5 flex items-center gap-3'>
                <div className='p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500'>
                  <CheckCircle className='size-5' />
                </div>
                <div>
                  <p className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider'>
                    Published
                  </p>
                  <p className='text-lg font-bold font-heading text-foreground mt-0.5'>
                    {data?.publishedTests ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-5 flex items-center gap-3'>
                <div className='p-2.5 bg-blue-500/10 rounded-lg text-blue-500'>
                  <Layers className='size-5' />
                </div>
                <div>
                  <p className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider'>
                    Drafts
                  </p>
                  <p className='text-lg font-bold font-heading text-foreground mt-0.5'>
                    {data?.draftTests ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-5 flex items-center gap-3'>
                <div className='p-2.5 bg-red-500/10 rounded-lg text-red-500'>
                  <AlertTriangle className='size-5' />
                </div>
                <div>
                  <p className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider'>
                    Failures
                  </p>
                  <p className='text-lg font-bold font-heading text-foreground mt-0.5'>
                    {data?.failedAssemblies ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-5 flex items-center gap-3'>
                <div className='p-2.5 bg-amber-500/10 rounded-lg text-amber-500'>
                  <Clock className='size-5' />
                </div>
                <div>
                  <p className='text-[10px] text-muted-foreground font-medium uppercase tracking-wider'>
                    Avg Speed
                  </p>
                  <p className='text-lg font-bold font-heading text-foreground mt-0.5'>
                    {((data?.averageAssemblyTime ?? 3200) / 1000).toFixed(2)}s
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Drilldown Table */}
          <Card className='glass border border-border shadow-lg'>
            <CardHeader>
              <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
                <Layers className='size-5 text-indigo-500' />
                Assembled Exam History
              </CardTitle>
              <CardDescription>
                Detailed register of all generated test instances, versions, status, and config
                references.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0 border-t border-border/40'>
              {data?.drilldowns.length === 0 ? (
                <div className='p-8'>
                  <EmptyState
                    title='No Assembly History'
                    description='No assembled tests found in history.'
                    icon={<Layers className='size-8 text-muted-foreground' />}
                  />
                </div>
              ) : (
                <div className='overflow-x-auto w-full'>
                  <table className='w-full text-sm text-left border-collapse'>
                    <thead>
                      <tr className='border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        <th className='p-3.5 text-left'>Assembly ID</th>
                        <th className='p-3.5 text-left'>Assessment Config</th>
                        <th className='p-3.5 text-left'>Total Questions</th>
                        <th className='p-3.5 text-left'>Status</th>
                        <th className='p-3.5 text-left'>Version</th>
                        <th className='p-3.5 text-left'>Assembled Date</th>
                        <th className='p-3.5 text-right'>Action</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/50 bg-card/25'>
                      {data?.drilldowns.map((t) => (
                        <tr key={t.id} className='hover:bg-muted/30 transition-colors'>
                          <td className='p-3.5 text-xs font-mono font-semibold text-muted-foreground'>
                            {t.id}
                          </td>
                          <td className='p-3.5 font-medium text-foreground'>{t.assessment}</td>
                          <td className='p-3.5 text-muted-foreground text-sm'>
                            {t.totalQuestions} items
                          </td>
                          <td className='p-3.5'>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                t.status === 'PUBLISHED'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : t.status === 'DRAFT'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className='p-3.5 text-muted-foreground text-sm'>v{t.version}</td>
                          <td className='p-3.5 text-muted-foreground text-sm'>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className='p-3.5 text-right'>
                            <Button asChild size='sm' variant='outline'>
                              <Link href={`/admin/assembly/${t.id}`}>
                                <Eye className='size-3.5 mr-1.5' />
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
