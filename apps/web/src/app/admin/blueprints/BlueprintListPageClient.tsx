'use client';

import { useBlueprints } from '@/services/blueprints/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export function BlueprintListPageClient() {
  const { data: blueprints, isLoading, isError, refetch } = useBlueprints();

  return (
    <div className='container mx-auto py-6 space-y-6 max-w-7xl'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Exam Blueprints</h1>
          <p className='text-muted-foreground'>Manage your generated exam blueprints.</p>
        </div>
        <Link href='/admin/blueprints/new'>
          <Button>
            <Plus className='w-4 h-4 mr-2' />
            Create Blueprint
          </Button>
        </Link>
      </div>

      <div className='border rounded-lg bg-white dark:bg-gray-900 shadow-sm overflow-hidden'>
        {isLoading && (
          <div className='p-6 space-y-4'>
            <Skeleton className='h-10 w-full rounded-md' />
            <Skeleton className='h-12 w-full rounded-md' />
            <Skeleton className='h-12 w-full rounded-md' />
          </div>
        )}

        {isError && (
          <div className='p-12 text-center'>
            <h3 className='text-lg font-medium text-red-600 mb-2'>Unable to load blueprints.</h3>
            <Button onClick={() => refetch()} variant='outline'>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && (!blueprints || blueprints.length === 0) && (
          <div className='p-12 text-center border-dashed border-2 m-6 rounded-lg border-gray-200 dark:border-gray-800'>
            <h3 className='text-lg font-medium mb-2'>No Blueprints Found</h3>
            <p className='text-muted-foreground mb-6'>Create your first blueprint to get started.</p>
            <Link href='/admin/blueprints/new'>
              <Button>Create Blueprint</Button>
            </Link>
          </div>
        )}

        {!isLoading && !isError && blueprints && blueprints.length > 0 && (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800'>
                <tr>
                  <th className='px-6 py-4 font-medium'>Blueprint Name</th>
                  <th className='px-6 py-4 font-medium'>Exam Config</th>
                  <th className='px-6 py-4 font-medium'>Style Profile</th>
                  <th className='px-6 py-4 font-medium'>Status</th>
                  <th className='px-6 py-4 font-medium'>Created At</th>
                  <th className='px-6 py-4 font-medium text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-800'>
                {blueprints.map((bp) => (
                  <tr key={bp.id} className='hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
                    <td className='px-6 py-4 font-medium text-gray-900 dark:text-gray-100'>
                      {bp.name}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'>
                        {bp.code}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-gray-500 dark:text-gray-400'>
                      {bp.styleProfileId}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'>
                        Draft
                      </span>
                    </td>
                    <td className='px-6 py-4 text-gray-500 dark:text-gray-400'>
                      {bp.createdAt ? new Date(bp.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className='px-6 py-4 text-right space-x-2'>
                      <Link href={`/admin/blueprints/${bp.id}`}>
                        <Button variant='ghost' size='sm' className='text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'>
                          <Eye className='w-4 h-4 mr-1' /> View
                        </Button>
                      </Link>
                      <Link href={`/admin/blueprints/${bp.id}/edit`}>
                        <Button variant='ghost' size='sm' className='text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400'>
                          <Edit2 className='w-4 h-4 mr-1' /> Edit
                        </Button>
                      </Link>
                      <Link href={`/admin/blueprints/${bp.id}`}>
                        <Button variant='ghost' size='sm' className='text-amber-600 hover:text-amber-900 dark:hover:text-amber-400'>
                          <ShieldAlert className='w-4 h-4 mr-1' /> Validate
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
