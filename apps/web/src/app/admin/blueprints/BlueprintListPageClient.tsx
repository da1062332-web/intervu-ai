'use client';

import { useBlueprints } from '@/services/blueprints/hooks';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Eye, Edit2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export function BlueprintListPageClient() {
  const { data: blueprints, isLoading, isError, refetch } = useBlueprints();
  const bpList: any[] = Array.isArray(blueprints) ? blueprints : [];

  const columns: ColumnDef<any>[] = [
    {
      header: 'Blueprint Name',
      cell: (row) => <span className='font-medium'>{row.name ?? row.examConfig?.name ?? row.configId ?? '-'}</span>,
    },
    {
      header: 'Exam Config',
      cell: (row) => (
        <Badge variant='outline' className='bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'>
          {row.examConfig?.code ?? row.code ?? row.configId ?? '-'}
        </Badge>
      ),
    },
    {
      header: 'Style Profile',
      cell: (row) => <span className='text-muted-foreground'>{row.styleProfile?.name ?? row.styleProfileId ?? '-'}</span>,
    },
    {
      header: 'Status',
      cell: (row) => {
        const active = row.isActive || row.status === 'ACTIVE';
        return (
          <Badge variant={active ? 'default' : 'secondary'} className={active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}>
            {active ? 'Active' : 'Draft'}
          </Badge>
        );
      },
    },
    {
      header: 'Created At',
      cell: (row) => <span className='text-muted-foreground'>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className='flex justify-end gap-2'>
          <Link href={`/admin/blueprints/${row.id}`}>
            <Button variant='ghost' size='sm' title='View'>
              <Eye className='w-4 h-4' />
            </Button>
          </Link>
          <Link href={`/admin/blueprints/${row.id}/edit`}>
            <Button variant='ghost' size='sm' className='text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400' title='Edit'>
              <Edit2 className='w-4 h-4' />
            </Button>
          </Link>
          <Link href={`/admin/blueprints/${row.id}`}>
            <Button variant='ghost' size='sm' className='text-amber-600 hover:text-amber-900 dark:hover:text-amber-400' title='Validate'>
              <ShieldAlert className='w-4 h-4' />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className='mt-6 border rounded-lg bg-card shadow-sm'>
      {isError && !isLoading && (
        <EmptyState
          variant='error'
          title='Unable to load blueprints'
          description='There was a problem fetching the blueprints. Please try again.'
          actionLabel='Retry'
          onAction={() => refetch()}
          className='py-12'
        />
      )}

      {!isError && (
        <DataTable
          columns={columns}
          data={bpList}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          emptyState={
            <EmptyState
              title='No Blueprints Found'
              description='Create your first blueprint to get started.'
              actionLabel='Create Blueprint'
              onAction={() => window.location.href = '/admin/blueprints/new'}
              className='py-12 border-0'
            />
          }
        />
      )}
    </div>
  );
}
