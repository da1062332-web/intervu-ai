'use client';

import React, { useState, useMemo } from 'react';
import { useAttemptHistory } from '../hooks/useAttemptHistory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, Download, Play, Eye, ArrowUpDown } from 'lucide-react';
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

const TableRow = React.memo(({ attempt }: { attempt: AttemptItem }) => {
  return (
    <tr className='hover:bg-muted/50 transition-colors'>
      <td className='px-4 py-3 font-medium'>{attempt.assessmentName}</td>
      <td className='px-4 py-3'>{format(new Date(attempt.date), 'MMM d, yyyy')}</td>
      <td className='px-4 py-3'>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            attempt.status === 'COMPLETED'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : attempt.status === 'IN_PROGRESS'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {attempt.status.replace('_', ' ')}
        </span>
      </td>
      <td className='px-4 py-3 text-right font-medium'>
        {attempt.score !== null ? `${attempt.score}%` : '-'}
      </td>
      <td className='px-4 py-3 text-right'>
        <div className='flex items-center justify-end gap-2'>
          {attempt.status === 'COMPLETED' ? (
            <>
              <Button size='sm' variant='ghost' asChild className='h-8 px-2'>
                <Link href={`/candidate/results/${attempt.instanceId}`}>
                  <Eye className='size-4 mr-1' /> View
                </Link>
              </Button>
              <Button size='sm' variant='ghost' asChild className='h-8 px-2 text-primary'>
                <Link href={`/candidate/reports/${attempt.instanceId}`}>
                  <Download className='size-4 mr-1' /> Report
                </Link>
              </Button>
            </>
          ) : attempt.status === 'IN_PROGRESS' ? (
            <Button size='sm' variant='default' asChild className='h-8 px-2'>
              <Link href={`/candidate/tests/${attempt.testId || attempt.instanceId}/resume`}>
                <Play className='size-4 mr-1' /> Continue
              </Link>
            </Button>
          ) : (
            <Button size='sm' variant='ghost' disabled className='h-8 px-2'>
              <Download className='size-4 mr-1' /> Report
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
});
TableRow.displayName = 'TableRow';

export function AttemptHistoryTable({
  showFilters = false,
  defaultLimit = 5,
}: AttemptHistoryTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof AttemptItem>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // If we show filters, we might want to fetch more items or we just filter the current page as requested
  // "Implement client-side search, sorting, and filtering only on the currently loaded page."
  const limit = showFilters ? 20 : defaultLimit;
  const { data, isLoading } = useAttemptHistory(page, limit);

  const toggleSort = (field: keyof AttemptItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const processedAttempts = useMemo(() => {
    if (!data?.attempts) return [];
    let result = [...data.attempts] as AttemptItem[];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((a) => a.assessmentName.toLowerCase().includes(lower));
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.status === statusFilter);
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

  if (isLoading) {
    return <div className='h-64 animate-pulse bg-muted rounded-xl' />;
  }

  if (!data?.attempts || data.attempts.length === 0) {
    return (
      <Card>
        <CardContent className='py-8 text-center text-muted-foreground'>
          No attempt history found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4'>
        <CardTitle>Attempt History</CardTitle>
        {showFilters && (
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative'>
              <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
              <Input
                placeholder='Search assessments...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9 h-9 w-[180px] sm:w-[220px] text-sm'
              />
            </div>
            <select
              className='h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value='ALL'>All Status</option>
              <option value='COMPLETED'>Completed</option>
              <option value='IN_PROGRESS'>In Progress</option>
              <option value='EVALUATING'>Evaluating</option>
            </select>
          </div>
        )}
      </CardHeader>
      <CardContent className='flex-1 flex flex-col'>
        <div className='rounded-md border overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/50 text-muted-foreground border-b'>
              <tr>
                <th
                  className='px-4 py-3 font-medium cursor-pointer hover:text-foreground'
                  onClick={() => toggleSort('assessmentName')}
                  aria-sort={
                    sortField === 'assessmentName' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <div className='flex items-center gap-1'>
                    Assessment <ArrowUpDown className='size-3 opacity-50' />
                  </div>
                </th>
                <th
                  className='px-4 py-3 font-medium cursor-pointer hover:text-foreground'
                  onClick={() => toggleSort('date')}
                  aria-sort={sortField === 'date' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                >
                  <div className='flex items-center gap-1'>
                    Date <ArrowUpDown className='size-3 opacity-50' />
                  </div>
                </th>
                <th
                  className='px-4 py-3 font-medium cursor-pointer hover:text-foreground'
                  onClick={() => toggleSort('status')}
                  aria-sort={
                    sortField === 'status' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <div className='flex items-center gap-1'>
                    Status <ArrowUpDown className='size-3 opacity-50' />
                  </div>
                </th>
                <th
                  className='px-4 py-3 font-medium text-right cursor-pointer hover:text-foreground'
                  onClick={() => toggleSort('score')}
                  aria-sort={
                    sortField === 'score' ? (sortAsc ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <div className='flex items-center justify-end gap-1'>
                    Score <ArrowUpDown className='size-3 opacity-50' />
                  </div>
                </th>
                <th className='px-4 py-3 font-medium text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {processedAttempts.length > 0 ? (
                processedAttempts.map((attempt) => (
                  <TableRow key={attempt.instanceId} attempt={attempt} />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='px-4 py-8 text-center text-muted-foreground'>
                    No matching attempts found on this page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.pagination.totalPages > 1 && (
          <div className='flex items-center justify-between mt-auto pt-4'>
            <div className='text-sm text-muted-foreground'>
              Showing page {page} of {data.pagination.totalPages}
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className='size-4 mr-1' /> Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Next <ChevronRight className='size-4 ml-1' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
