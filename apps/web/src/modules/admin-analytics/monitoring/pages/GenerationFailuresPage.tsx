'use client';

import { useState, useEffect } from 'react';
import { AlertOctagon, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <PageHeader
        title='AI Generation Failures Center'
        subtitle='Inspect details on failed question generation jobs, identify rate limits or prompt blocks, and restart jobs.'
        action={
          <div className='flex gap-3'>
            <Button asChild variant='outline'>
              <Link href='/admin/dashboard'>
                <ArrowLeft className='size-4 mr-2' />
                Back to Dashboard
              </Link>
            </Button>
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
        <CardContent className='p-0'>
          {loading && failures.length === 0 ? (
            <div className='flex justify-center items-center py-20'>
              <Loader2 className='size-8 animate-spin text-muted-foreground' />
            </div>
          ) : failures.length === 0 ? (
            <div className='text-center py-20 text-muted-foreground text-sm'>
              🎉 No failed generation jobs found! All jobs running successfully.
            </div>
          ) : (
            <div className='overflow-x-auto w-full'>
              <table className='w-full text-sm text-left border-collapse'>
                <thead>
                  <tr className='border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    <th className='p-3.5 text-left'>Job ID</th>
                    <th className='p-3.5 text-left'>Topic Target</th>
                    <th className='p-3.5 text-left'>Volume</th>
                    <th className='p-3.5 text-left'>Provider</th>
                    <th className='p-3.5 text-left'>Error Reason</th>
                    <th className='p-3.5 text-left'>Timestamp</th>
                    <th className='p-3.5 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/50 bg-card/25'>
                  {failures.map((f) => (
                    <tr key={f.jobId} className='hover:bg-muted/30 transition-colors'>
                      <td className='p-3.5 text-xs font-mono font-semibold text-muted-foreground'>{f.jobId}</td>
                      <td className='p-3.5 font-semibold text-foreground'>{f.topic}</td>
                      <td className='p-3.5 text-muted-foreground text-sm'>{f.count} questions</td>
                      <td className='p-3.5'>
                        <span className='px-2 py-0.5 bg-foreground/5 rounded text-xs font-medium text-foreground/75'>
                          {f.provider}
                        </span>
                      </td>
                      <td className='p-3.5 text-sm text-red-500 max-w-[280px] truncate' title={f.reason}>
                        {f.reason}
                      </td>
                      <td className='p-3.5 text-muted-foreground text-xs'>
                        {new Date(f.timestamp).toLocaleString()}
                      </td>
                      <td className='p-3.5 text-right'>
                        <Button
                          onClick={() => handleRetry(f.jobId)}
                          disabled={retrying !== null}
                          size='sm'
                          className='gap-1.5'
                        >
                          {retrying === f.jobId ? (
                            <Loader2 className='size-3 animate-spin' />
                          ) : (
                            <RefreshCw className='size-3' />
                          )}
                          Retry
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
  );
}
