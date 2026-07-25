'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { formatCandidateDate } from '../utils';
import type { CandidateListItem, CandidatePagination } from '../types/candidate.types';

interface CandidateTableProps {
  candidates: CandidateListItem[];
  pagination?: CandidatePagination;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function CandidateTable({
  candidates,
  pagination,
  onPageChange,
  isLoading = false,
  emptyState,
}: CandidateTableProps) {
  const router = useRouter();

  const columns: ColumnDef<CandidateListItem>[] = [
    {
      id: 'name',
      header: 'Candidate',
      cell: (row) => <span className="font-medium text-foreground">{row.name || 'Unnamed'}</span>,
    },
    {
      id: 'email',
      header: 'Email',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.email}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <CandidateStatusBadge status={row.status} />,
    },
    {
      id: 'createdAt',
      header: 'Created Date',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatCandidateDate(row.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: <div className="text-right">Actions</div>,
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/candidates/${row.id}`)}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
            title="View Candidate Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

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
          <span className="font-medium text-foreground">{total}</span> candidates
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
      data={candidates}
      isLoading={isLoading}
      disablePagination={true}
      pagination={renderPagination()}
      emptyState={emptyState}
      rowKey={(row) => row.id}
      containerClassName="border rounded-xl bg-card overflow-hidden shadow-xs"
    />
  );
}
