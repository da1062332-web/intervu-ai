'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCandidateDateTime, formatScore } from '../utils';
import type { CandidateTestHistoryItem, CandidatePagination } from '../types/candidate.types';

interface CandidateHistoryTableProps {
  history: CandidateTestHistoryItem[];
  pagination?: CandidatePagination;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function CandidateHistoryTable({
  history,
  pagination,
  onPageChange,
  isLoading = false,
}: CandidateHistoryTableProps) {
  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || 'UNKNOWN';
    if (s === 'COMPLETED' || s === 'PASSED' || s === 'SUBMITTED') {
      return <Badge variant="success">{s}</Badge>;
    }
    if (s === 'IN_PROGRESS' || s === 'STARTED') {
      return <Badge variant="warning">{s}</Badge>;
    }
    return <Badge variant="secondary">{s}</Badge>;
  };

  const columns: ColumnDef<CandidateTestHistoryItem>[] = [
    {
      id: 'assessmentName',
      header: 'Assessment',
      cell: (row) => <span className="font-medium text-foreground">{row.assessmentName}</span>,
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
      cell: (row) => <span className="font-semibold text-indigo-600 dark:text-indigo-400">{row.score}</span>,
    },
    {
      id: 'percentage',
      header: 'Percentage',
      className: 'text-center',
      cell: (row) => <span className="font-bold text-primary">{formatScore(row.percentage)}</span>,
    },
    {
      id: 'startedAt',
      header: 'Started',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatCandidateDateTime(row.startedAt)}</span>,
    },
    {
      id: 'submittedAt',
      header: 'Submitted',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatCandidateDateTime(row.submittedAt, 'In progress')}</span>,
    },
  ];

  const emptyState = (
    <EmptyState
      variant="no-data"
      icon={<FileText className="w-10 h-10 text-muted-foreground/50" />}
      title="No test attempts found"
      description="This candidate has not attempted or completed any assessments yet."
      className="my-8 py-8 border rounded-lg"
    />
  );

  const renderPagination = () => {
    if (!pagination || pagination.total === 0) return null;
    const { page, limit, total, totalPages } = pagination;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between w-full px-4 py-4 border-t border-border/40 text-sm text-muted-foreground gap-3">
        <div>
          Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
          <span className="font-medium text-foreground">{endItem}</span> of{' '}
          <span className="font-medium text-foreground">{total}</span> attempts
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || isLoading}
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || isLoading}
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 font-medium text-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isLoading}
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || isLoading}
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      columns={columns}
      data={history}
      isLoading={isLoading}
      disablePagination={true}
      pagination={renderPagination()}
      emptyState={emptyState}
      rowKey={(row) => row.attemptId || Math.random().toString()}
      containerClassName="border rounded-xl bg-card overflow-hidden shadow-xs"
    />
  );
}
