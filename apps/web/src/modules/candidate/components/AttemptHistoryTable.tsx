'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAttemptHistory } from '../hooks/useAttemptHistory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, Play, Eye, ArrowUpDown, History } from 'lucide-react';
import Link from 'next/link';

interface AttemptItem {
  instanceId: string;
  testId?: string;
  assessmentName: string;
  date: string;
  status: string;
  score: number | null;
}

interface AttemptHistoryTableProps {
  showFilters?: boolean;
  defaultLimit?: number;
}

const ActionsCell = ({ attempt }: { attempt: AttemptItem }) => {
  return (
    <div className='flex items-center justify-end gap-2'>
      {attempt.status === 'COMPLETED' || attempt.status === 'SUBMITTED' ? (
        <Button
          size='sm'
          variant='ghost'
          asChild
          className='h-8 px-2.5 text-xs font-semibold hover:bg-muted/80'
        >
          <Link href={`/candidate/results/${attempt.instanceId}`}>
            <Eye className='size-3.5 mr-1.5' /> View
          </Link>
        </Button>
      ) : attempt.status === 'IN_PROGRESS' ? (
        <Button size='sm' variant='default' asChild className='h-8 px-3 text-xs font-semibold'>
          <Link href={`/candidate/tests/${attempt.instanceId}/launch?resume=true`}>
            <Play className='size-3.5 mr-1.5' /> Resume
          </Link>
        </Button>
      ) : (
        <span className='text-xs font-medium text-muted-foreground'>-</span>
      )}
    </div>
  );
};

export function AttemptHistoryTable({
  showFilters = false,
  defaultLimit = 5,
}: AttemptHistoryTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof AttemptItem>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const limit = showFilters ? 20 : defaultLimit;
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
    if (!data?.attempts) return [];
    let result = [...data.attempts] as AttemptItem[];

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

    result.sort((a, b) => {
      let valA = a[sortField] as any;
      let valB = b[sortField] as any;

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [data?.attempts, search, statusFilter, sortField, sortAsc]);

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
        <span className='font-semibold text-sm text-foreground'>{row.assessmentName}</span>
      ),
    },
    {
      id: 'date',
      header: (
        <div
          className='flex items-center gap-1.5 cursor-pointer hover:text-foreground select-none font-bold text-xs uppercase tracking-wide'
          onClick={() => toggleSort('date')}
        >
          Date <ArrowUpDown className='size-3 opacity-50' />
        </div>
      ),
      cell: (row) => (
        <span className='text-xs font-medium text-muted-foreground'>
          {format(new Date(row.date), 'MMM d, yyyy')}
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
        let variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline' = 'default';
        if (row.status === 'COMPLETED' || row.status === 'SUBMITTED') variant = 'success';
        else if (row.status === 'IN_PROGRESS') variant = 'default';
        else variant = 'outline';

        return (
          <Badge
            variant={variant}
            className='rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider'
          >
            {row.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'result',
      header: <div className='font-bold text-xs uppercase tracking-wide'>Result</div>,
      cell: (row) => {
        if (row.status === 'IN_PROGRESS' || row.status === 'CREATED') {
          return <span className='text-xs font-medium text-muted-foreground'>-</span>;
        }

        if (row.status === 'EVALUATING') {
          return (
            <Badge
              variant='outline'
              className='rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 border-amber-500/30'
            >
              Evaluating
            </Badge>
          );
        }

        const scoreValue = row.score ?? 0;

        if (scoreValue >= 80) {
          return (
            <Badge
              variant='success'
              className='rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            >
              Qualified
            </Badge>
          );
        }

        if (scoreValue >= 60) {
          return (
            <Badge
              variant='success'
              className='rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30'
            >
              Pass
            </Badge>
          );
        }

        return (
          <Badge
            variant='destructive'
            className='rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive border border-destructive/30'
          >
            Fail
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      className: 'text-right',
      header: <span className='font-bold text-xs uppercase tracking-wide'>Actions</span>,
      cell: (row) => <ActionsCell attempt={row} />,
    },
  ];

  return (
    <Card className='bg-card/80 border border-border/60 shadow-xs flex flex-col h-full'>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/40 gap-4'>
        <CardTitle className='text-base md:text-lg font-bold text-foreground'>
          Attempt History
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6 flex-1 flex flex-col'>
        <DataTable
          columns={columns}
          data={processedAttempts}
          isLoading={isLoading}
          rowKey={(row) => row.instanceId}
          search={
            showFilters && (
              <div className='flex flex-wrap items-center gap-2.5 mb-5'>
                <Input
                  placeholder='Search by assessment title...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='w-[200px] sm:w-[260px] text-xs sm:text-sm h-9 bg-background/60 border-border/60'
                  startIcon={<Search className='size-4 text-muted-foreground/70' />}
                />
                <select
                  className='h-9 rounded-md border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-primary/20'
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value='ALL'>All Statuses</option>
                  <option value='COMPLETED'>Completed Only</option>
                  <option value='IN_PROGRESS'>In Progress</option>
                  <option value='EVALUATING'>Under Evaluation</option>
                </select>
              </div>
            )
          }
          emptyState={
            <EmptyState
              title={
                !data?.attempts || data.attempts.length === 0
                  ? 'No Attempt History'
                  : 'No Matching Results'
              }
              description={
                !data?.attempts || data.attempts.length === 0
                  ? 'You have not initiated or completed any assessment attempts yet.'
                  : 'We could not find any previous assessment attempts matching your filter parameters.'
              }
              icon={
                !data?.attempts || data.attempts.length === 0 ? (
                  <History className='size-8 text-muted-foreground' />
                ) : (
                  <Search className='size-8 text-muted-foreground' />
                )
              }
              variant='no-data'
            />
          }
          pagination={
            data &&
            data.pagination.totalPages > 1 && (
              <div className='flex items-center justify-between border-t border-border/40 pt-4 mt-4'>
                <div className='text-xs font-semibold text-muted-foreground'>
                  Showing page <span className='text-foreground'>{page}</span> of{' '}
                  <span className='text-foreground'>{data.pagination.totalPages}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className='h-8 text-xs font-semibold'
                    leftIcon={<ChevronLeft className='size-3.5' />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                    className='h-8 text-xs font-semibold'
                    rightIcon={<ChevronRight className='size-3.5' />}
                  >
                    Next
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
