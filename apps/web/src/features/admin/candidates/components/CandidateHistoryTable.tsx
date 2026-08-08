'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCandidateDateTime, formatScore } from '../utils';
import type { CandidateTestHistoryItem, CandidatePagination } from '../types/candidate.types';

interface CandidateHistoryTableProps {
  history: CandidateTestHistoryItem[];
  pagination?: CandidatePagination;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function CandidateHistoryTable({ history, isLoading = false }: CandidateHistoryTableProps) {
  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || 'UNKNOWN';
    if (s === 'COMPLETED' || s === 'PASSED' || s === 'SUBMITTED') {
      return <Badge variant='success'>{s}</Badge>;
    }
    if (s === 'IN_PROGRESS' || s === 'STARTED') {
      return <Badge variant='warning'>{s}</Badge>;
    }
    return <Badge variant='secondary'>{s}</Badge>;
  };

  const columns: ColumnDef<CandidateTestHistoryItem>[] = [
    {
      id: 'assessmentName',
      header: 'Assessment',
      cell: (row) => <span className='font-medium text-foreground'>{row.assessmentName}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      id: 'score',
      header: 'Raw Score',
      className: 'text-center',
      cell: (row) => (
        <span className='font-semibold text-indigo-600 dark:text-indigo-400'>{row.score}</span>
      ),
    },
    {
      id: 'percentage',
      header: 'Percentage',
      className: 'text-center',
      cell: (row) => <span className='font-bold text-primary'>{formatScore(row.percentage)}</span>,
    },
    {
      id: 'startedAt',
      header: 'Started',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>
          {formatCandidateDateTime(row.startedAt)}
        </span>
      ),
    },
    {
      id: 'submittedAt',
      header: 'Submitted',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>
          {formatCandidateDateTime(row.submittedAt, 'In progress')}
        </span>
      ),
    },
  ];

  const emptyState = (
    <EmptyState
      variant='no-data'
      icon={<FileText className='w-10 h-10 text-muted-foreground/50' />}
      title='No test attempts found'
      description='This candidate has not attempted or completed any assessments yet.'
      className='my-8 py-8 border rounded-lg'
    />
  );

  return (
    <DataTable
      columns={columns}
      data={history}
      isLoading={isLoading}
      emptyState={emptyState}
      rowKey={(row) => row.attemptId || Math.random().toString()}
      containerClassName='border rounded-xl bg-card overflow-hidden shadow-xs'
    />
  );
}
