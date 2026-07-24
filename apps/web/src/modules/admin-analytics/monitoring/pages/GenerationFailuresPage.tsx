'use client';

import { useState, useEffect } from 'react';
import { AlertOctagon, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { EmptyStateCard } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';

export interface FailedJob {
  jobId: string;
  topic: string;
  count: number;
  reason: string;
  provider: string;
  timestamp: string;
}

export function GenerationFailuresPage() {
  const [failures, setFailures] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchFailures = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request<FailedJob[]>('/admin/generation/failures');
      setFailures(response || []);
    } catch (error) {
      console.error('Failed to load failures log', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailures();
  }, []);

  const handleRetry = async (jobId: string) => {
    try {
      setRetrying(jobId);
      await apiClient.request(`/admin/generation/retry/${jobId}`, {
        method: 'POST',
      });
      toast.success('AI generation job re-queued successfully.');
      // Refresh after short delay so backend updates state
      setTimeout(fetchFailures, 1000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to retry generation job.');
    } finally {
      setRetrying(null);
    }
  };

  const columns: ColumnDef<FailedJob>[] = [
    {
      id: 'jobId',
      header: 'Job ID',
      cell: (row) => <span className="font-mono font-semibold text-muted-foreground">{row.jobId}</span>,
    },
    {
      id: 'topic',
      header: 'Topic Target',
      cell: (row) => <span className="font-semibold text-foreground">{row.topic}</span>,
    },
    {
      id: 'volume',
      header: 'Volume',
      cell: (row) => <span className="text-muted-foreground">{row.count} questions</span>,
    },
    {
      id: 'provider',
      header: 'Provider',
      cell: (row) => (
        <span className="px-2 py-0.5 bg-foreground/5 rounded text-xs font-medium text-foreground/75">
          {row.provider}
        </span>
      ),
    },
    {
      id: 'reason',
      header: 'Error Reason',
      cell: (row) => (
        <div className="text-red-500 max-w-[280px] truncate" title={row.reason}>
          {row.reason}
        </div>
      ),
    },
    {
      id: 'timestamp',
      header: 'Timestamp',
      cell: (row) => <span className="text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</span>,
    },
    {
      id: 'action',
      header: '',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end">
          <Button
            onClick={() => handleRetry(row.jobId)}
            disabled={retrying !== null}
            size='sm'
            className='gap-1.5'
          >
            {retrying === row.jobId ? (
              <Loader2 className='size-3 animate-spin' />
            ) : (
              <RefreshCw className='size-3' />
            )}
            Retry
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <SectionHeader
        title='AI Generation Failures Center'
        description='Inspect details on failed question generation jobs, identify rate limits or prompt blocks, and restart jobs.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Generation Failures' }]}
        actions={
          <div className='flex gap-3'>
            <Button onClick={fetchFailures} disabled={loading} className='gap-2'>
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <Card className='glass border border-border shadow-lg'>
        <CardHeader className='pb-4 border-b border-border/40'>
          <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
            <AlertOctagon className='size-5 text-red-500' />
            Failed Jobs Registry
          </CardTitle>
          <CardDescription>
            Live list of failed asynchronous generation requests. Tap "Retry" to run them again.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0 border-t border-border/40'>
          <DataTable
            columns={columns}
            data={failures}
            isLoading={loading}
            emptyState={
              <EmptyStateCard
                title='No Failed Jobs'
                description='🎉 No failed generation jobs found! All jobs running successfully.'
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
