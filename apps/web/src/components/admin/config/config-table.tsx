import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit2, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useArchiveConfig } from '@/services/exam-configs/hooks';
import { EmptyStateCard } from '@/components/ui/empty-state';

export interface ExamConfig {
  id: string;
  name: string;
  code?: string;
  role: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  status?: string;
  createdAt?: string;
}

interface ConfigTableProps {
  configs: ExamConfig[];
}

export function ConfigTable({ configs }: ConfigTableProps) {
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

  return (
    <div className='w-full overflow-x-auto rounded-md border mt-6'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Config Name</TableHead>
            <TableHead className='hidden sm:table-cell'>Code</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className='hidden sm:table-cell'>Duration</TableHead>
            <TableHead className='hidden md:table-cell'>Questions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='hidden lg:table-cell'>Created At</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <TableRow key={config.id}>
              <TableCell className='font-medium'>{config.name}</TableCell>
              <TableCell className='hidden sm:table-cell text-muted-foreground'>
                {config.code || 'N/A'}
              </TableCell>
              <TableCell>{config.role}</TableCell>
              <TableCell className='hidden sm:table-cell'>{config.durationMinutes}m</TableCell>
              <TableCell className='hidden md:table-cell'>{config.totalQuestions}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    config.status === 'ARCHIVED'
                      ? 'destructive'
                      : config.status === 'VALIDATED'
                        ? 'outline'
                        : config.status === 'PUBLISHED'
                          ? 'default'
                          : !config.isActive
                            ? 'secondary'
                            : 'default'
                  }
                >
                  {config.status === 'ARCHIVED'
                    ? 'Archived'
                    : config.status === 'VALIDATED'
                      ? 'Validated'
                      : config.status === 'PUBLISHED'
                        ? 'Published'
                        : config.isActive
                          ? 'Active'
                          : 'Draft'}
                </Badge>
              </TableCell>
              <TableCell className='hidden lg:table-cell'>
                {config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex items-center justify-end gap-2'>
                  <Button variant='ghost' size='icon' aria-label='View' asChild>
                    <Link href={`/admin/configurations/${config.id}`}>
                      <Eye className='w-4 h-4' />
                    </Link>
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label='Edit'
                    disabled={config.status === 'ARCHIVED'}
                    asChild
                  >
                    <Link href={`/admin/configurations/${config.id}/edit`}>
                      <Edit2 className='w-4 h-4' />
                    </Link>
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label='Archive'
                    className='text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50'
                    disabled={config.status === 'ARCHIVED'}
                    onClick={() => setConfigToArchive(config)}
                  >
                    <Archive className='w-4 h-4' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {configs.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className='py-12'>
                <EmptyStateCard
                  title='No Configurations Found'
                  description='Create your first exam configuration.'
                  actionLabel='Create Configuration'
                  actionHref='/admin/configurations/new'
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={!!configToArchive} onClose={() => setConfigToArchive(null)}>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Archive Configuration?</h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Are you sure you want to archive <strong>{configToArchive?.name}</strong>? Archived
            configurations can no longer be edited.
          </p>
          <div className='flex justify-end gap-3 pt-4'>
            <Button
              variant='outline'
              onClick={() => setConfigToArchive(null)}
              disabled={archiveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
