import { Button } from '@/components/ui/button';
import { Eye, Edit2, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
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
      <table className='w-full text-sm text-left'>
        <thead className='bg-muted/50 border-b'>
          <tr>
            <th scope='col' className='px-4 py-3 font-medium'>
              Config Name
            </th>
            <th scope='col' className='px-4 py-3 font-medium hidden sm:table-cell'>
              Code
            </th>
            <th scope='col' className='px-4 py-3 font-medium'>
              Role
            </th>
            <th scope='col' className='px-4 py-3 font-medium hidden sm:table-cell'>
              Duration
            </th>
            <th scope='col' className='px-4 py-3 font-medium hidden md:table-cell'>
              Questions
            </th>
            <th scope='col' className='px-4 py-3 font-medium'>
              Status
            </th>
            <th scope='col' className='px-4 py-3 font-medium hidden lg:table-cell'>
              Created At
            </th>
            <th scope='col' className='px-4 py-3 font-medium text-right'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config) => (
            <tr
              key={config.id}
              className='border-b last:border-0 hover:bg-muted/50 transition-colors'
            >
              <td className='px-4 py-3 font-medium'>{config.name}</td>
              <td className='px-4 py-3 hidden sm:table-cell text-muted-foreground'>
                {config.code || 'N/A'}
              </td>
              <td className='px-4 py-3'>{config.role}</td>
              <td className='px-4 py-3 hidden sm:table-cell'>{config.durationMinutes}m</td>
              <td className='px-4 py-3 hidden md:table-cell'>{config.totalQuestions}</td>
              <td className='px-4 py-3'>
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
              </td>
              <td className='px-4 py-3 hidden lg:table-cell'>
                {config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'N/A'}
              </td>
              <td className='px-4 py-3 text-right'>
                <div className='flex items-center justify-end gap-2'>
                  <Button variant='ghost' size='icon' aria-label='View' asChild>
                    <Link href={`/admin/configs/${config.id}`}>
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
                    <Link href={`/admin/configs/${config.id}/edit`}>
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
              </td>
            </tr>
          ))}
          {configs.length === 0 && (
            <tr>
              <td colSpan={8} className='px-4 py-12 text-center text-muted-foreground'>
                <div className='flex flex-col items-center justify-center space-y-3'>
                  <p className='text-lg font-medium'>No Configurations Found</p>
                  <p className='text-sm'>Create your first exam configuration.</p>
                  <Button asChild className='mt-4'>
                    <Link href='/admin/configs/new'>Create Configuration</Link>
                  </Button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
