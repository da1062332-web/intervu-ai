'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, XCircle, Users, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { EmptyStateCard } from '@/components/ui/empty-state';
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

  const pendingColumns: ColumnDef<ReviewAnalyticsData['pendingItems'][0]>[] = [
    {
      id: 'question',
      header: 'Question Context',
      cell: (row) => (
        <div className="font-medium text-foreground max-w-[200px] truncate" title={row.questionText}>
          {row.questionText}
        </div>
      ),
    },
    {
      id: 'topic',
      header: 'Topic',
      cell: (row) => <span className="text-muted-foreground">{row.topic}</span>,
    },
    {
      id: 'difficulty',
      header: 'Difficulty',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            row.difficulty === 'EASY'
              ? 'bg-emerald-500/10 text-emerald-500'
              : row.difficulty === 'MEDIUM'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-red-500/10 text-red-500'
          }`}
        >
          {row.difficulty}
        </span>
      ),
    },
    {
      id: 'age',
      header: 'Age',
      cell: (row) => <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      id: 'action',
      header: '',
      className: 'text-right',
      cell: () => (
        <div className="flex justify-end">
          <Button asChild size='sm'>
            <Link href={`/admin/workflows`}>Review</Link>
          </Button>
        </div>
      ),
    },
  ];

  const decisionColumns: ColumnDef<ReviewAnalyticsData['recentDecisions'][0]>[] = [
    {
      id: 'question',
      header: 'Question Context',
      cell: (row) => (
        <div className="font-medium text-foreground max-w-[300px] truncate" title={row.questionText}>
          {row.questionText}
        </div>
      ),
    },
    {
      id: 'topic',
      header: 'Topic',
      cell: (row) => <span className="text-muted-foreground">{row.topic}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            row.status === 'APPROVED'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: 'reviewer',
      header: 'Reviewer',
      cell: (row) => <span className="text-muted-foreground">{row.reviewer}</span>,
    },
    {
      id: 'timestamp',
      header: 'Timestamp',
      cell: (row) => <span className="text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</span>,
    },
  ];

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <SectionHeader
        title='Review Operations Center'
        description='Observe pending backlogs, human/AI reviewer queues, workload divisions, and review decision outputs.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Review Operations' }]}
      />

      {/* KPI Stats Grid */}
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Pending Reviews'
          value={data?.pendingReviews ?? 0}
          icon={<Clock className='size-5' />}
          isLoading={loading}
        />
        <StatCard
          title='Approved Today'
          value={data?.approvedToday ?? 0}
          icon={<CheckCircle className='size-5' />}
          isLoading={loading}
        />
        <StatCard
          title='Rejected Today'
          value={data?.rejectedToday ?? 0}
          icon={<XCircle className='size-5' />}
          isLoading={loading}
        />
        <StatCard
          title='Avg Review Speed'
          value={`${data?.averageReviewTime ?? 120}s`}
          icon={<ShieldCheck className='size-5' />}
          isLoading={loading}
        />
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
                  <div className='text-sm text-muted-foreground text-center py-6'>
                    No reviews recorded.
                  </div>
                ) : (
                  workloadArray.map((w, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between border-b border-border/30 pb-3 last:border-b-0 last:pb-0'
                    >
                      <div className='flex items-center gap-2'>
                        <div className='size-2.5 rounded-full bg-primary' />
                        <span className='text-sm text-foreground font-medium'>{w.reviewer}</span>
                      </div>
                      <span className='text-sm text-muted-foreground font-bold'>
                        {w.count} Reviews
                      </span>
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
                <DataTable
                  columns={pendingColumns}
                  data={data?.pendingItems || []}
                  isLoading={loading}
                  emptyState={
                    <EmptyStateCard
                      title='Review Queue Empty'
                      description='🎉 Review Queue is empty! All items cleared.'
                    />
                  }
                />
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
              <DataTable
                columns={decisionColumns}
                data={data?.recentDecisions || []}
                isLoading={loading}
                emptyState={
                  <EmptyStateCard
                    title='No Decisions'
                    description='No decisions recorded.'
                  />
                }
              />
            </CardContent>
          </Card>
    </div>
  );
}
