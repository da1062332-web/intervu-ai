'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { formatCandidateDate } from '../utils';
import { adminCandidateService } from '../services/candidate.service';
import { candidateQueryKeys } from '../hooks/useCandidates';
import type { CandidateListItem, CandidatePagination } from '../types/candidate.types';
import { cn } from '@/lib/utils';

interface CandidateTableProps {
  candidates: CandidateListItem[];
  pagination?: CandidatePagination;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function CandidateTable({ candidates, isLoading = false, emptyState }: CandidateTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = React.useState<{
    candidate: CandidateListItem;
    nextStatus: 'ACTIVE' | 'INACTIVE';
  } | null>(null);

  const handleConfirmStatusChange = async () => {
    if (!pendingTarget) return;
    const { candidate, nextStatus } = pendingTarget;

    try {
      setUpdatingId(candidate.id);
      await adminCandidateService.updateCandidateStatus(candidate.id, nextStatus);
      await queryClient.invalidateQueries({ queryKey: candidateQueryKeys.all });
    } catch (err) {
      console.error('Failed to update candidate status', err);
    } finally {
      setUpdatingId(null);
      setPendingTarget(null);
    }
  };

  const isDeactivating = pendingTarget?.nextStatus === 'INACTIVE';

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
      cell: (row) => {
        const isUpdating = updatingId === row.id;
        const isActive = row.status === 'ACTIVE';

        return (
          <div className='flex justify-end items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() =>
                setPendingTarget({
                  candidate: row,
                  nextStatus: isActive ? 'INACTIVE' : 'ACTIVE',
                })
              }
              disabled={isUpdating}
              className={cn(
                'h-8 w-8 transition-colors',
                isActive
                  ? 'text-destructive hover:bg-destructive/10 hover:text-destructive'
                  : 'text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600',
              )}
              title={isActive ? 'Deactivate Candidate Account' : 'Activate Candidate Account'}
            >
              {isUpdating ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : isActive ? (
                <UserX className='w-4 h-4' />
              ) : (
                <UserCheck className='w-4 h-4' />
              )}
            </Button>
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
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={candidates}
        isLoading={isLoading}
        emptyState={emptyState}
        rowKey={(row) => row.id}
        containerClassName='border-0 rounded-none shadow-none'
      />

      <ConfirmationDialog
        isOpen={Boolean(pendingTarget)}
        onOpenChange={(open) => {
          if (!open && !updatingId) setPendingTarget(null);
        }}
        title={isDeactivating ? 'Deactivate Candidate Account' : 'Activate Candidate Account'}
        description={
          isDeactivating
            ? `Are you sure you want to deactivate candidate "${pendingTarget?.candidate.name || pendingTarget?.candidate.email}"? Inactive candidates will be unable to log in to the platform.`
            : `Are you sure you want to reactivate candidate "${pendingTarget?.candidate.name || pendingTarget?.candidate.email}"? They will regain access to log in and take assessments.`
        }
        confirmLabel={isDeactivating ? 'Deactivate' : 'Activate'}
        cancelLabel='Cancel'
        destructive={isDeactivating}
        isLoading={Boolean(updatingId)}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setPendingTarget(null)}
      />
    </>
  );
}
