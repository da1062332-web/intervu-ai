'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAttemptHistory } from '../hooks/useAttemptHistory';
import { useAuth } from '@/hooks/use-auth';
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
  Eye,
  FileText,
  ExternalLink,
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
  publishedVersionId?: string | null;
  versionNumber?: number | null;
  versionName?: string | null;
  isLegacy?: boolean;
}

interface CandidateHistorySectionProps {
  compact?: boolean;
}

const ActionsCell = ({ attempt }: { attempt: AttemptItem }) => {
  const resultId = attempt.instanceId || (attempt as any).attemptId || (attempt as any).id;
  const configId =
    attempt.examConfigId ||
    attempt.testConfigId ||
    attempt.configId ||
    attempt.testId ||
    attempt.assessmentId;
  const isCompleted =
    attempt.status === 'COMPLETED' ||
    attempt.status === 'SUBMITTED' ||
    attempt.status === 'EVALUATING';

  const canReAttempt =
    attempt.canReAttempt !== false &&
    (attempt as any).canReattempt !== false &&
    (attempt.remainingAttempts === undefined || attempt.remainingAttempts > 0);

  return (
    <div className='flex items-center justify-end gap-2.5 whitespace-nowrap shrink-0'>
      {isCompleted ? (
        <>
          {resultId && (
            <Button
              size='sm'
              variant='secondary'
              asChild
              className='h-8 px-3 text-xs font-bold rounded-lg'
            >
              <Link href={`/candidate/results/${resultId}`}>
                View Result
              </Link>
            </Button>
          )}
          {canReAttempt && configId ? (
            <Button
              size='sm'
              variant='outline'
              asChild
              className='h-8 px-3 text-xs font-semibold rounded-lg gap-1.5'
            >
              <Link href={`/candidate/tests/${configId}`}>
                <Play className='size-3 text-muted-foreground' />
                <span>Re-Exam</span>
              </Link>
            </Button>
          ) : null}
        </>
      ) : attempt.status === 'IN_PROGRESS' ? (
        <Button
          size='sm'
          variant='default'
          asChild
          className='h-8 px-4 text-xs font-bold rounded-lg gap-1.5'
        >
          <Link href={`/candidate/tests/${resultId || configId}/launch?resume=true`}>
            <Play className='size-3 fill-current' /> Resume
          </Link>
        </Button>
      ) : (
        <span className='text-xs font-medium text-muted-foreground px-2'>-</span>
      )}
    </div>
  );
};

export function CandidateHistorySection({ compact = true }: CandidateHistorySectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof AttemptItem>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const limit = compact ? 4 : 15;
  const { data, isLoading } = useAttemptHistory(user?.id, page, limit);

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
    let raw = data?.attempts || [];

    let result = [...raw] as AttemptItem[];

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
          <Card className='rounded-[28px] border border-border/60 bg-card p-6 sm:p-7 shadow-2xs flex-1 flex flex-col items-center justify-center min-h-[300px] text-center'>
            <History className='size-8 text-muted-foreground mb-3' />
            <h4 className='font-bold text-base text-foreground'>No attempts yet</h4>
            <p className='text-xs text-muted-foreground mt-1 max-w-xs'>
              You have not started or completed any assessments.
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div className='flex flex-col h-full space-y-4'>
        <div className='flex items-center justify-between gap-3 pb-1 shrink-0'>
          <div>
            <h3 className='text-xl sm:text-2xl font-bold text-foreground tracking-tight'>
              Attempt History
            </h3>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Detailed log of previously submitted evaluations
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='text-xs font-semibold text-muted-foreground hover:text-foreground h-8 px-3 rounded-xl border border-border/60 hover:bg-muted/50 gap-1.5'
            onClick={() => router.push('/candidate/results')}
          >
            <span>View All</span>
            <ExternalLink className='size-3.5' />
          </Button>
        </div>

        <div className='space-y-3'>
          {processedAttempts.map((row, index) => {
            const isCompleted = row.status === 'COMPLETED' || row.status === 'SUBMITTED';
            const resultId = row.instanceId || (row as any).attemptId || (row as any).id;
            const configId =
              row.examConfigId ||
              row.testConfigId ||
              row.configId ||
              row.testId ||
              row.assessmentId;

            let formattedDate = '';
            try {
              formattedDate = format(new Date(row.date), 'MMM d, yyyy');
            } catch {
              formattedDate = 'Recently';
            }

            return (
              <div
                key={row.instanceId}
                className='rounded-[20px] border border-border/60 bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-500/30 shadow-2xs'
              >
                <div className='flex items-center gap-3.5 min-w-0 flex-1'>
                  <div className='w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-2xs'>
                    <FileText className='size-5' />
                  </div>

                  <div className='min-w-0 space-y-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <h4 className='font-bold text-sm sm:text-base text-foreground truncate'>
                        {row.assessmentName}
                      </h4>
                      {index === 0 && (
                        <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/60'>
                          LATEST
                        </span>
                      )}
                    </div>

                    <p className='text-xs text-muted-foreground font-normal flex items-center gap-2 flex-wrap'>
                      <span>Completed {formattedDate}</span>
                      <span>•</span>
                      <span>
                        Attempt {row.attemptCount || 1}/{row.maxAttempts || 2}
                      </span>
                      {isCompleted && (
                        <>
                          <span>•</span>
                          <span>Completed</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30'>
                  {row.score !== null ? (
                    <div className='text-left sm:text-right'>
                      <span className='text-[10px] text-muted-foreground font-semibold uppercase block'>
                        Score
                      </span>
                      <span className='text-sm sm:text-base font-extrabold text-foreground'>
                        {row.score}%
                      </span>
                    </div>
                  ) : (
                    <div className='text-left sm:text-right'>
                      <span className='text-[10px] text-muted-foreground font-semibold uppercase block'>
                        Status
                      </span>
                      <span className='text-xs font-semibold text-muted-foreground'>
                        In Progress
                      </span>
                    </div>
                  )}

                  <div className='flex items-center gap-2'>
                    {isCompleted ? (
                      resultId && (
                        <Button
                          size='sm'
                          variant='outline'
                          asChild
                          className='h-9 px-3.5 text-xs font-bold rounded-xl gap-1.5 border-border/70 hover:bg-muted text-foreground transition-all'
                        >
                          <Link href={`/candidate/results/${resultId}`}>
                            <span>View Result</span>
                            <Eye className='size-3.5 text-muted-foreground' />
                          </Link>
                        </Button>
                      )
                    ) : (
                      <Button
                        size='sm'
                        className='h-9 px-3.5 text-xs font-bold rounded-xl gap-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-all'
                        asChild
                      >
                        <Link href={`/candidate/tests/${resultId || configId}/launch?resume=true`}>
                          <Play className='size-3.5 fill-current' />
                          <span>Resume</span>
                        </Link>
                      </Button>
                    )}
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
        <div className='flex items-center gap-2'>
          <span className='font-bold text-sm text-foreground'>{row.assessmentName}</span>
          {row.isLegacy || row.versionName === 'Legacy (Unversioned)' ? (
            <span className='px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted/70 text-muted-foreground border border-border/50'>
              Legacy
            </span>
          ) : row.versionNumber ? (
            <span className='px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-muted text-foreground border border-border/60'>
              V{row.versionNumber}
            </span>
          ) : null}
        </div>
      ),
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
