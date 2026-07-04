'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, XCircle, Users, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { apiClient } from '@/services/api/client';

export interface ReviewAnalyticsData {
  pendingReviews: number;
  approvedToday: number;
  rejectedToday: number;
  averageReviewTime: number;
  reviewerWorkload: Record<string, number>;
  reviewerQueue: Array<{
    id: string;
    questionText: string;
    topic: string;
    difficulty: string;
    createdAt: string;
  }>;
  pendingItems: Array<{
    id: string;
    questionText: string;
    topic: string;
    difficulty: string;
    createdAt: string;
  }>;
  recentDecisions: Array<{
    id: string;
    questionText: string;
    topic: string;
    status: string;
    reviewer: string;
    timestamp: string;
  }>;
}

export function ReviewOperationsDashboard() {
  const [data, setData] = useState<ReviewAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.request<ReviewAnalyticsData>('/admin/analytics/review');
        setData(response);
      } catch (error) {
        console.error('Failed to load review analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const workloadArray = data
    ? Object.entries(data.reviewerWorkload).map(([reviewer, count]) => ({ reviewer, count }))
    : [];

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <PageHeader
        title='Review Operations Center'
        subtitle='Observe pending backlogs, human/AI reviewer queues, workload divisions, and review decision outputs.'
        action={
          <Button asChild variant='outline'>
            <Link href='/admin/dashboard'>
              <ArrowLeft className='size-4 mr-2' />
              Back to Dashboard
            </Link>
          </Button>
        }
      />

      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <>
          {/* KPI Stats Grid */}
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-6 flex items-center gap-4'>
                <div className='p-3 bg-amber-500/10 rounded-xl text-amber-500'>
                  <Clock className='size-6' />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Pending Reviews</p>
                  <p className='text-2xl font-bold font-heading text-foreground mt-0.5'>{data?.pendingReviews ?? 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-6 flex items-center gap-4'>
                <div className='p-3 bg-emerald-500/10 rounded-xl text-emerald-500'>
                  <CheckCircle className='size-6' />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Approved Today</p>
                  <p className='text-2xl font-bold font-heading text-foreground mt-0.5'>{data?.approvedToday ?? 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-6 flex items-center gap-4'>
                <div className='p-3 bg-red-500/10 rounded-xl text-red-500'>
                  <XCircle className='size-6' />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Rejected Today</p>
                  <p className='text-2xl font-bold font-heading text-foreground mt-0.5'>{data?.rejectedToday ?? 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className='glass border border-border shadow-sm'>
              <CardContent className='p-6 flex items-center gap-4'>
                <div className='p-3 bg-blue-500/10 rounded-xl text-blue-500'>
                  <ShieldCheck className='size-6' />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>Avg Review Speed</p>
                  <p className='text-2xl font-bold font-heading text-foreground mt-0.5'>{data?.averageReviewTime ?? 120}s</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workload and Queue Tables Section */}
          <div className='grid gap-6 md:grid-cols-3'>
            {/* Workload */}
            <Card className='glass border border-border shadow-lg'>
              <CardHeader>
                <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
                  <Users className='size-5 text-indigo-500' />
                  Reviewer Workload
                </CardTitle>
                <CardDescription>
                  Distribution of evaluated audit decisions across system agents.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-6 border-t border-border/40'>
                {workloadArray.length === 0 ? (
                  <div className='text-sm text-muted-foreground text-center py-6'>No reviews recorded.</div>
                ) : (
                  workloadArray.map((w, idx) => (
                    <div key={idx} className='flex items-center justify-between border-b border-border/30 pb-3 last:border-b-0 last:pb-0'>
                      <div className='flex items-center gap-2'>
                        <div className='size-2.5 rounded-full bg-primary' />
                        <span className='text-sm text-foreground font-medium'>{w.reviewer}</span>
                      </div>
                      <span className='text-sm text-muted-foreground font-bold'>{w.count} Reviews</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Pending queue */}
            <Card className='md:col-span-2 glass border border-border shadow-lg'>
              <CardHeader>
                <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
                  <Clock className='size-5 text-amber-500' />
                  Pending Review Items
                </CardTitle>
                <CardDescription>
                  Questions awaiting administrator evaluation to become Active.
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0 border-t border-border/40'>
                {data?.pendingItems.length === 0 ? (
                  <div className='text-sm text-muted-foreground text-center py-12'>🎉 Review Queue is empty! All items cleared.</div>
                ) : (
                  <div className='overflow-x-auto w-full'>
                    <table className='w-full text-sm text-left border-collapse'>
                      <thead>
                        <tr className='border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                          <th className='p-3.5 text-left'>Question Context</th>
                          <th className='p-3.5 text-left'>Topic</th>
                          <th className='p-3.5 text-left'>Difficulty</th>
                          <th className='p-3.5 text-left'>Age</th>
                          <th className='p-3.5 text-right'>Action</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-border/50 bg-card/25'>
                        {data?.pendingItems.map((item) => (
                          <tr key={item.id} className='hover:bg-muted/30 transition-colors'>
                            <td className='p-3.5 font-medium text-foreground max-w-[200px] truncate' title={item.questionText}>
                              {item.questionText}
                            </td>
                            <td className='p-3.5 text-muted-foreground text-sm'>{item.topic}</td>
                            <td className='p-3.5'>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  item.difficulty === 'EASY'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : item.difficulty === 'MEDIUM'
                                      ? 'bg-blue-500/10 text-blue-500'
                                      : 'bg-red-500/10 text-red-500'
                                }`}
                              >
                                {item.difficulty}
                              </span>
                            </td>
                            <td className='p-3.5 text-muted-foreground text-sm'>{new Date(item.createdAt).toLocaleDateString()}</td>
                            <td className='p-3.5 text-right'>
                              <Button asChild size='sm'>
                                <Link href={`/admin/workflows`}>Review</Link>
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
          </div>

          {/* Recent Decisions Table */}
          <Card className='glass border border-border shadow-lg'>
            <CardHeader>
              <CardTitle className='text-lg font-heading font-semibold text-foreground'>
                Recent Decisions Audit Log
              </CardTitle>
              <CardDescription>
                Auditable log of the latest question validation approvals or rejections.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0 border-t border-border/40'>
              {data?.recentDecisions.length === 0 ? (
                <div className='text-sm text-muted-foreground text-center py-12'>No decisions recorded.</div>
              ) : (
                <div className='overflow-x-auto w-full'>
                  <table className='w-full text-sm text-left border-collapse'>
                    <thead>
                      <tr className='border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        <th className='p-3.5 text-left'>Question Context</th>
                        <th className='p-3.5 text-left'>Topic</th>
                        <th className='p-3.5 text-left'>Status</th>
                        <th className='p-3.5 text-left'>Reviewer</th>
                        <th className='p-3.5 text-left'>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/50 bg-card/25'>
                      {data?.recentDecisions.map((d) => (
                        <tr key={d.id} className='hover:bg-muted/30 transition-colors'>
                          <td className='p-3.5 font-medium text-foreground max-w-[300px] truncate' title={d.questionText}>
                            {d.questionText}
                          </td>
                          <td className='p-3.5 text-muted-foreground text-sm'>{d.topic}</td>
                          <td className='p-3.5'>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                d.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className='p-3.5 text-muted-foreground text-sm'>{d.reviewer}</td>
                          <td className='p-3.5 text-muted-foreground text-xs'>
                            {new Date(d.timestamp).toLocaleString()}
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
