import { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit2, Archive, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useArchiveConfig } from '@/services/exam-configs/hooks';

export interface ExamConfig {
  id: string;
  name: string;
  code?: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  status?: string;
  currentVersionNumber?: number | null;
  activeVersionId?: string | null;
  createdAt?: string;
}

interface ConfigTableProps {
  configs: ExamConfig[];
  isLoading?: boolean;
}

export function ConfigTable({ configs, isLoading }: ConfigTableProps) {
  const [configToArchive, setConfigToArchive] = useState<ExamConfig | null>(null);
  const archiveMutation = useArchiveConfig(configToArchive?.id || '');

  const handleArchive = async () => {
    if (!configToArchive) return;
    try {
      await archiveMutation.mutateAsync();
      setConfigToArchive(null);
    } catch {
      // Error handled by useArchiveConfig
    }
  };

  const columns: ColumnDef<ExamConfig>[] = [
    {
      id: 'name',
      header: 'Config Name',
      cell: (row) => (
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{row.name}</span>
          {row.currentVersionNumber && (
            <Badge variant='secondary' className='text-[10px] font-mono px-1.5 py-0'>
              V{row.currentVersionNumber}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'code',
      header: 'Code',
      className: 'hidden sm:table-cell',
      cell: (row) => <span className='text-muted-foreground'>{row.code || 'N/A'}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => row.role,
    },
    {
      id: 'duration',
      header: 'Duration',
      className: 'hidden sm:table-cell',
      cell: (row) => `${row.durationMinutes}m`,
    },
    {
      id: 'questions',
      header: 'Questions',
      className: 'hidden md:table-cell',
      cell: (row) => row.totalQuestions,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <div className='flex items-center gap-1.5'>
          <Badge
            variant={
              row.status === 'ARCHIVED'
                ? 'destructive'
                : row.status === 'VALIDATED'
                  ? 'outline'
                  : row.status === 'PUBLISHED'
                    ? 'default'
                    : !row.isActive
                      ? 'secondary'
                      : 'default'
            }
          >
            {row.status === 'ARCHIVED'
              ? 'Archived'
              : row.status === 'VALIDATED'
                ? 'Validated'
                : row.status === 'PUBLISHED'
                  ? 'Published'
                  : row.isActive
                    ? 'Active'
                    : 'Draft'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created At',
      className: 'hidden lg:table-cell',
      cell: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'),
    },
    {
      id: 'actions',
      header: <div className='text-right'>Actions</div>,
      className: 'text-right',
      cell: (row) => (
        <div className='flex items-center justify-end gap-2'>
          <Button variant='ghost' size='icon' aria-label='Version History' title='Version History' asChild>
            <Link href={`/admin/configurations/${row.id}/versions`}>
              <History className='w-4 h-4 text-muted-foreground' />
            </Link>
          </Button>
          <Button variant='ghost' size='icon' aria-label='View' asChild>
            <Link href={`/admin/configurations/${row.id}`}>
              <Eye className='w-4 h-4' />
            </Link>
          </Button>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Edit'
            disabled={row.status === 'ARCHIVED'}
            asChild
          >
            <Link href={`/admin/configurations/${row.id}`}>
              <Edit2 className='w-4 h-4' />
            </Link>
          </Button>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Archive'
            className='text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50'
            disabled={row.status === 'ARCHIVED'}
            onClick={() => setConfigToArchive(row)}
          >
            <Archive className='w-4 h-4' />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='mt-6'>
      <DataTable columns={columns} data={configs} isLoading={isLoading} rowKey={(row) => row.id} />

      <ConfirmationDialog
        isOpen={!!configToArchive}
        onOpenChange={(open) => !open && setConfigToArchive(null)}
        title='Archive Configuration?'
        description={`Are you sure you want to archive ${configToArchive?.name}? Archived configurations can no longer be edited.`}
        confirmLabel='Archive'
        destructive
        onConfirm={handleArchive}
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
