'use client';

import { useState } from 'react';
import { useBlueprints, useDeleteBlueprint } from '@/services/blueprints';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateBlueprintModal } from './components/CreateBlueprintModal';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export function BlueprintListPageClient() {
  const { data: blueprints, isLoading, isError, refetch, isFetching } = useBlueprints();
  const { mutateAsync: deleteBlueprint, isPending: isDeleting } = useDeleteBlueprint();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredBlueprints = blueprints?.filter(
    (bp) =>
      bp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete blueprint "${name}"?`)) {
      try {
        await deleteBlueprint(id);
        toast.success('Blueprint deleted successfully');
      } catch {
        toast.error('Failed to delete blueprint');
      }
    }
  };

  if (isError) {
    return (
      <div className='mt-8 text-center py-12 border rounded-md'>
        <h3 className='text-lg font-medium text-red-600 mb-2'>Error loading blueprints</h3>
        <p className='text-muted-foreground mb-4'>
          We could not load the blueprints from the server.
        </p>
        <Button onClick={() => refetch()} variant='outline'>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className='mt-8 flex flex-col space-y-4'>
      <div className='flex justify-between items-center'>
        <div className='flex gap-2'>
          <div className='relative w-64'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
            <Input
              type='text'
              placeholder='Search blueprints...'
              className='pl-9'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant='outline' size='icon' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className='flex items-center gap-4'>
          <Link href="/admin/templates">
            <Button variant="outline">
              Template Library
            </Button>
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
                      </td>
                    </tr>
                  ))}
                  {filteredBlueprints?.length === 0 && (
                    <tr>
                      <td colSpan={6} className='py-8 text-center text-sm text-gray-500'>
                        No blueprints found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <CreateBlueprintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
