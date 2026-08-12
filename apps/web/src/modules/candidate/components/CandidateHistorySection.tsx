'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAttemptHistory } from '../hooks/useAttemptHistory';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Play,
  ArrowUpDown,
  History,
  ArrowRight as ArrowRightIcon,
  CheckCircle2,
  Calendar,
  Pause,
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface AttemptItem {
  instanceId: string;
  testId?: string;
  configId?: string;
  assessmentId?: string;
  assessmentName: string;
  date: string;
  status: string;
  score: number | null;
  subtitle?: string;
  examConfigId?: string;
  testConfigId?: string;
  attemptCount?: number;
  maxAttempts?: number;
  remainingAttempts?: number;
  canReAttempt?: boolean;
}

interface CandidateHistorySectionProps {
  compact?: boolean;
}

const ActionsCell = ({ attempt }: { attempt: AttemptItem }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await import('@/services/api/client').then((m) =>
        m.apiClient.request<Blob>(`/reports/export/pdf/${attempt.instanceId}`, {
          responseType: 'blob',
        }),
      );
      const url = URL.createObjectURL(blob as any);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report-${attempt.instanceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className='flex items-center gap-2 flex-wrap'>
      {attempt.status === 'COMPLETED' || attempt.status === 'SUBMITTED' ? (
        <>
          <Link
            href={`/candidate/results/${attempt.instanceId}`}
            className='inline-flex items-center justify-center rounded-[14px] font-bold text-xs h-9 px-4 bg-[#f3e8ff] hover:bg-[#e7d4ff] text-[#7e22ce] dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/70 transition-all border border-purple-200/60 dark:border-purple-800/50 shadow-2xs'
          >
            View Result
          </Link>
          <button
            type='button'
            className='inline-flex items-center justify-center rounded-[14px] font-bold text-xs h-9 px-3.5 bg-background border border-border/80 hover:bg-muted/60 text-foreground transition-all gap-1.5 shadow-2xs group'
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className='size-3.5 text-muted-foreground group-hover:text-foreground transition-colors' />
            <span>{downloading ? 'Exporting...' : 'Report'}</span>
          </button>
          {attempt.canReAttempt !== false ? (
            <Link
              href={`/candidate/tests/${attempt.examConfigId || attempt.testConfigId || attempt.configId || attempt.testId || attempt.assessmentId}`}
              className='inline-flex items-center justify-center rounded-[14px] font-bold text-xs h-9 px-4 bg-background border border-border/80 hover:bg-muted/60 text-foreground transition-all gap-1.5 shadow-2xs group'
            >
              <Play className='size-3.5 text-muted-foreground group-hover:text-foreground transition-colors' />
              <span>Re-Exam</span>
            </Link>
          ) : (
            <button
              disabled
              className='inline-flex items-center justify-center rounded-[14px] font-bold text-xs h-9 px-4 bg-background border border-border/80 text-muted-foreground opacity-60 cursor-not-allowed transition-all gap-1.5 shadow-2xs'
            >
              Max Attempts Reached
            </button>
          )}
        </>
      ) : attempt.status === 'IN_PROGRESS' ? (
        <Link
          href={`/candidate/tests/${attempt.instanceId}/launch?resume=true`}
          className='inline-flex items-center justify-center rounded-[14px] font-bold text-xs h-9 px-6 bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-all shadow-md gap-1.5'
        >
          <Play className='size-3.5 fill-current' /> Resume
        </Link>
      ) : (
        <Button
          size='sm'
          variant='ghost'
          disabled
          className='h-9 px-4 text-xs font-semibold opacity-50 rounded-[14px]'
        >
          Pending
        </Button>
      )}
    </div>
  );
};

export function CandidateHistorySection({ compact = true }: CandidateHistorySectionProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof AttemptItem>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const limit = compact ? 4 : 15;
  const { data, isLoading } = useAttemptHistory(page, limit);

  const toggleSort = useCallback(
    (field: keyof AttemptItem) => {
      if (sortField === field) {
        setSortAsc(!sortAsc);
      } else {
        setSortField(field);
        setSortAsc(true);
      }
    },
    [sortField, sortAsc],
  );

  const processedAttempts = useMemo(() => {
    let result = [...(data?.attempts || [])] as AttemptItem[];

    if (!compact) {
      if (search) {
        const lower = search.toLowerCase();
        result = result.filter((a) => a.assessmentName.toLowerCase().includes(lower));
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'COMPLETED') {
          result = result.filter((a) => a.status === 'COMPLETED' || a.status === 'SUBMITTED');
        } else {
          result = result.filter((a) => a.status === statusFilter);
        }
      }
    }

    result.sort((a, b) => {
      let valA = a[sortField] as any;
      let valB = b[sortField] as any;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    if (compact) {
      return result.slice(0, 4);
    }
    return result;
  }, [data?.attempts, search, statusFilter, sortField, sortAsc, compact]);

  if (compact) {
    if (isLoading) {
      return (
        <div className='flex flex-col h-full space-y-4'>
          <div className='flex items-center justify-between pb-1 shrink-0'>
            <Skeleton className='h-7 w-44' />
          </div>
          <Skeleton className='h-[500px] w-full rounded-[28px] border border-border/40 flex-1' />
        </div>
      );
    }

    if (!processedAttempts || processedAttempts.length === 0) {
      return (
        <div className='flex flex-col h-full space-y-4'>
          <div className='flex items-center justify-between gap-3 pb-1 shrink-0'>
            <h3 className='text-xl sm:text-2xl font-bold text-foreground tracking-tight'>
              Attempt History
            </h3>
          </div>
          <div className='rounded-[28px] border border-border/60 bg-card p-8 text-center flex flex-col items-center justify-center flex-1 min-h-[300px] shadow-2xs'>
            <div className='p-3.5 bg-muted/50 rounded-2xl mb-3 text-muted-foreground'>
              <History className='size-6' />
            </div>
            <h4 className='text-base font-bold text-foreground'>No Evaluation History</h4>
            <p className='text-xs text-muted-foreground max-w-xs mt-1.5 font-normal leading-relaxed'>
              You have not initiated or submitted any assessments yet. Start an assessment from the catalog to build your history.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className='flex flex-col h-full space-y-4'>
        <div className='flex items-center justify-between gap-3 pb-1 shrink-0'>
          <h3 className='text-xl sm:text-2xl font-bold text-foreground tracking-tight'>
            Attempt History
          </h3>
          <button
            type='button'
            className='text-[#6366f1] dark:text-indigo-400 hover:underline font-semibold text-xs sm:text-sm flex items-center gap-1 transition-all'
            onClick={() => router.push('/candidate/results')}
          >
            See All <ArrowRightIcon className='size-3.5 ml-0.5' />
          </button>
        </div>

        <div className='rounded-[28px] border border-border/60 bg-card p-6 sm:p-7 shadow-2xs space-y-6 flex-1 flex flex-col justify-between'>
          {processedAttempts.map((row, index) => {
            const isCompleted = row.status === 'COMPLETED' || row.status === 'SUBMITTED';
            const iconBg =
              row.status === 'IN_PROGRESS'
                ? 'bg-[#f1f5f9] text-muted-foreground dark:bg-slate-800 border-border/40'
                : row.score && row.score >= 90
                  ? 'bg-[#ecfdf5] text-[#10b981] dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60'
                  : 'bg-[#fff7ed] text-[#ea580c] dark:bg-amber-950/50 dark:text-amber-400 border-orange-200/60';

            return (
              <div
                key={row.instanceId}
                className={`flex items-start gap-4 pb-5 ${index !== processedAttempts.length - 1 ? 'border-b border-border/40' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border mt-0.5 font-bold shadow-2xs ${iconBg}`}
                >
                  {row.status === 'IN_PROGRESS' ? (
                    <Pause className='size-4' />
                  ) : (
                    <Check className='size-5' />
                  )}
                </div>

                <div className='min-w-0 flex-1 space-y-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <h4 className='font-bold text-sm sm:text-base text-foreground truncate tracking-tight'>
                      {row.assessmentName}
                    </h4>
                    {row.score !== null ? (
                      <span className='font-black text-xs sm:text-sm bg-indigo-50 dark:bg-indigo-950/50 text-[#6366f1] dark:text-indigo-400 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shrink-0'>
                        {row.score}%
                      </span>
                    ) : (
                      <span className='text-muted-foreground font-semibold text-xs sm:text-sm shrink-0'>
                        --
                      </span>
                    )}
                  </div>

                  <p className='text-xs text-muted-foreground font-normal leading-normal line-clamp-1'>
                    {row.subtitle ||
                      (isCompleted
                        ? `Completed on ${format(new Date(row.date), 'MMM d, yyyy')}`
                        : 'Evaluation in progress')}
                  </p>
                  {row.maxAttempts !== undefined && row.attemptCount !== undefined && (
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                      Attempt {row.attemptCount} / {row.maxAttempts} • {row.remainingAttempts} remaining
                    </p>
                  )}

                  <div className='flex items-center justify-between flex-wrap gap-3 pt-1'>
                    <div className='flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80'>
                      <Calendar className='size-3.5 text-muted-foreground/70' />
                      <span>{format(new Date(row.date), 'MMM d, yyyy')}</span>
                    </div>

                    {/* Preserved interactive button triggers */}
                    <div className='mt-1 sm:mt-0'>
                      <ActionsCell attempt={row} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full interactive table mode for dedicated /candidate/results route
  const columns: ColumnDef<AttemptItem>[] = [
    {
      id: 'assessmentName',
      header: (
        <div
          className='flex items-center gap-1.5 cursor-pointer hover:text-foreground select-none font-bold text-xs uppercase tracking-wide'
          onClick={() => toggleSort('assessmentName')}
        >
          Assessment <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => (
        <span className='font-bold text-sm text-foreground'>{row.assessmentName}</span>
      ),
    },
    {
      id: 'attempts',
      header: (
        <div className='flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide'>
          Attempts
        </div>
      ),
      cell: (row) => (
        row.maxAttempts !== undefined && row.attemptCount !== undefined ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-foreground">
              {row.attemptCount} / {row.maxAttempts}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {row.remainingAttempts} left
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      )
    },
    {
      id: 'date',
      header: (
        <div
          className='flex items-center gap-1.5 cursor-pointer hover:text-foreground select-none font-bold text-xs uppercase tracking-wide'
          onClick={() => toggleSort('date')}
        >
          Completed Date <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => (
        <span className='text-xs font-semibold text-muted-foreground'>
          {format(new Date(row.date), 'MMM d, yyyy • HH:mm a')}
        </span>
      ),
    },
    {
      id: 'status',
      header: (
        <div
          className='flex items-center gap-1.5 cursor-pointer hover:text-foreground select-none font-bold text-xs uppercase tracking-wide'
          onClick={() => toggleSort('status')}
        >
          Status <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => {
        if (row.status === 'COMPLETED' || row.status === 'SUBMITTED') {
          return (
            <span className='inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ecfdf5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-bold border border-emerald-200/50'>
              <CheckCircle2 className='size-3.5 text-[#10b981]' /> Success
            </span>
          );
        }
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold'>
            {row.status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      id: 'score',
      className: 'text-right',
      header: (
        <div
          className='flex items-center justify-end gap-1.5 cursor-pointer hover:text-foreground select-none font-bold text-xs uppercase tracking-wide'
          onClick={() => toggleSort('score')}
        >
          Score <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => (
        <span className='font-black text-sm text-foreground bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/40'>
          {row.score !== null ? `${row.score}%` : '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      className: 'text-right',
      header: <span className='font-bold text-xs uppercase tracking-wide'>Actions</span>,
      cell: (row) => <ActionsCell attempt={row} />,
    },
  ];

  return (
    <Card className='rounded-[24px] border border-border/60 shadow-2xs bg-card overflow-hidden'>
      <CardHeader className='p-6 sm:p-8 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <CardTitle className='text-xl font-bold text-foreground'>
            Attempt Records & Reports
          </CardTitle>
          <CardDescription className='text-xs text-muted-foreground font-medium mt-1'>
            Detailed overview of all past evaluations, scoring breakdown, and downloadable
            certificates
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='p-6 sm:p-8'>
        <DataTable
          columns={columns}
          data={processedAttempts}
          isLoading={isLoading}
          rowKey={(row) => row.instanceId}
          search={
            <div className='flex flex-wrap items-center gap-3 mb-6'>
              <Input
                placeholder='Search assessment by name...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full sm:w-[320px] text-xs sm:text-sm h-11 bg-background/60 border-border/70 rounded-xl font-medium'
                startIcon={<Search className='size-4 text-muted-foreground' />}
              />
              <select
                className='h-11 rounded-xl border border-border/70 bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/30 transition-all focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20'
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value='ALL'>All Statuses</option>
                <option value='COMPLETED'>Completed Only</option>
                <option value='IN_PROGRESS'>In Progress</option>
                <option value='EVALUATING'>Under Evaluation</option>
              </select>
            </div>
          }
          emptyState={
            <EmptyState
              title='No Attempt Records'
              description='You have not initiated or completed any evaluations matching your current keyword filters.'
              icon={<History className='size-8 text-muted-foreground' />}
              variant='no-data'
            />
          }
          pagination={
            data &&
            data.pagination.totalPages > 1 && (
              <div className='flex items-center justify-between border-t border-border/40 pt-6 mt-8'>
                <div className='text-xs font-semibold text-muted-foreground'>
                  Showing page <span className='text-foreground font-bold'>{page}</span> of{' '}
                  <span className='text-foreground font-bold'>{data.pagination.totalPages}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className='h-10 text-xs font-bold rounded-xl border-border/70 px-4'
                  >
                    <ChevronLeft className='size-4 mr-1' /> Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                    className='h-10 text-xs font-bold rounded-xl border-border/70 px-4'
                  >
                    Next <ChevronRight className='size-4 ml-1' />
                  </Button>
                </div>
              </div>
            )
          }
        />
      </CardContent>
    </Card>
  );
}
