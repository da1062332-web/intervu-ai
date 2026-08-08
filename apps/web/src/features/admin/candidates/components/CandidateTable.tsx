'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
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

export function CandidateTable({ candidates, isLoading = false, emptyState }: CandidateTableProps) {
  const router = useRouter();

  const columns: ColumnDef<CandidateListItem>[] = [
    {
      id: 'name',
      header: 'Candidate',
      cell: (row) => <span className='font-medium text-foreground'>{row.name || 'Unnamed'}</span>,
    },
    {
      id: 'email',
      header: 'Email',
      cell: (row) => <span className='text-sm text-muted-foreground'>{row.email}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <CandidateStatusBadge status={row.status} />,
    },
    {
      id: 'createdAt',
      header: 'Created Date',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatCandidateDate(row.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: <div className='text-right'>Actions</div>,
      className: 'text-right',
      cell: (row) => (
        <div className='flex justify-end'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push(`/admin/candidates/${row.id}`)}
            className='h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors'
            title='View Candidate Details'
          >
            <Eye className='w-4 h-4' />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={candidates}
      isLoading={isLoading}
      emptyState={emptyState}
      rowKey={(row) => row.id}
      containerClassName='border-0 rounded-none shadow-none'
    />
  );
}
