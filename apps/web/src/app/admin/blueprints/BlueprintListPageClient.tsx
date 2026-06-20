'use client';

import { useBlueprints } from '@/services/blueprints/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export function BlueprintListPageClient() {
  const { data: blueprints, isLoading, isError, refetch } = useBlueprints();

  function setIsCreateModalOpen(arg0: boolean): void {
    throw new Error('Function not implemented.');
  }

  function handleDelete(id: any, name: any): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className='container mx-auto py-6 space-y-6 max-w-7xl'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Exam Blueprints</h1>
          <p className='text-muted-foreground'>Manage your generated exam blueprints.</p>
        </div>
        <div className='flex items-center gap-4'>
          <Link href='/admin/templates'>
            <Button variant='outline'>Template Library</Button>
          </Link>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Create Blueprint
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className='space-y-4 mt-4'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-16 w-full rounded-md' />
          ))}
        </div>
      ) : !blueprints || blueprints.length === 0 ? (
        <div className='mt-8 text-center py-12 border border-dashed rounded-md bg-white dark:bg-gray-900'>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-1'>
            No blueprints found
          </h3>
          <p className='text-muted-foreground mb-6'>
            Get started by designing a new blueprint for an exam configuration.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Create Blueprint
          </Button>
        </div>
      ) : (
        <div className='-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8'>
          <div className='inline-block min-w-full py-2 align-middle md:px-6 lg:px-8'>
            <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
              <table className='min-w-full divide-y divide-gray-300 dark:divide-gray-700'>
                <thead className='bg-gray-50 dark:bg-gray-800'>
                  <tr>
                    <th
                      scope='col'
                      className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6'
                    >
                      Name
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200'
                    >
                      Code
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200'
                    >
                      Questions
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200'
                    >
                      Duration
                    </th>
                    <th
                      scope='col'
                      className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200'
                    >
                      Status
                    </th>
                    <th
                      scope='col'
                      className='relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900 dark:text-gray-200'
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900'>
                  {filteredBlueprints?.map((bp) => (
                    <tr key={bp.id}>
                      <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-6'>
                        {bp.name}
                      </td>
                      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'>
                          {bp.code}
                        </span>
                      </td>
                      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                        {bp.totalQuestions}
                      </td>
                      <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                        {bp.totalDurationMinutes} min
                      </td>
                      <td className='whitespace-nowrap px-3 py-4 text-sm'>
                        {bp.isActive ? (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800'>
                            Active
                          </span>
                        ) : (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800'>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex justify-end gap-2'>
                        <Link href={`/admin/blueprints/builder?id=${bp.id}`}>
                          <Button variant='outline' size='sm'>
                            <Edit className='h-4 w-4 mr-1' />
                            Manage
                          </Button>
                        </Link>
                        <Button
                          variant='destructive'
                          size='icon'
                          onClick={() => handleDelete(bp.id, bp.name)}
                          disabled={isDeleting}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
