'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Play,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { EmptyStateCard } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
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

  const columns: ColumnDef<AssemblyAnalyticsData['drilldowns'][0]>[] = [
    {
      id: 'id',
      header: 'Assembly ID',
      cell: (row) => <span className="font-mono font-semibold text-muted-foreground">{row.id}</span>,
    },
    {
      id: 'assessment',
      header: 'Assessment Config',
      cell: (row) => <span className="font-medium text-foreground">{row.assessment}</span>,
    },
    {
      id: 'questions',
      header: 'Total Questions',
      cell: (row) => <span className="text-muted-foreground">{row.totalQuestions} items</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            row.status === 'PUBLISHED'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : row.status === 'DRAFT'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: 'version',
      header: 'Version',
      cell: (row) => <span className="text-muted-foreground">v{row.version}</span>,
    },
    {
      id: 'date',
      header: 'Assembled Date',
      cell: (row) => <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end">
          <Button asChild size='sm' variant='outline'>
            <Link href={`/admin/assembly/${row.id}`}>
              <Eye className='size-3.5 mr-1.5' />
              View
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      {/* Page Header */}
      <SectionHeader
        title='Assembly Pipeline Monitoring'
        description='Track completed test assemblies, draft vs. published configs, failed runs, and details per version.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Assembly Monitor' }]}
        actions={
          <div className='flex gap-3'>
            <Button asChild>
              <Link href='/admin/assembly'>
                <Play className='size-4 mr-2' />
                Assemble New Test
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-5'>
        <StatCard
          title='Created'
          value={data?.assembliesCreated ?? 0}
          icon={<Layers className='size-5' />}
          isLoading={loading}
        />
        <StatCard
          title='Published'
          value={data?.publishedTests ?? 0}
          icon={<CheckCircle className='size-5' />}
          isLoading={loading}
        />
        <StatCard
          title='Drafts'
          value={data?.draftTests ?? 0}
          icon={<Layers className='size-5' />}
          isLoading={loading}
        />
        <StatCard
          title='Failures'
          value={data?.failedAssemblies ?? 0}
          icon={<AlertTriangle className='size-5' />}
          isLoading={loading}
        />
        <StatCard
          title='Avg Speed'
          value={`${((data?.averageAssemblyTime ?? 3200) / 1000).toFixed(2)}s`}
          icon={<Clock className='size-5' />}
          isLoading={loading}
        />
      </div>

      {/* Drilldown Table */}
      <Card className='glass border border-border shadow-lg'>
        <CardHeader>
          <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
            <Layers className='size-5 text-indigo-500' />
            Assembled Exam History
          </CardTitle>
          <CardDescription>
            Detailed register of all generated test instances, versions, status, and config references.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0 border-t border-border/40'>
          <DataTable
            columns={columns}
            data={data?.drilldowns || []}
            isLoading={loading}
            emptyState={
              <EmptyStateCard
                title='No Assembly History'
                description='No assembled tests found in history.'
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
