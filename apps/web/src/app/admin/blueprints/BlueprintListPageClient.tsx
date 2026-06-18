'use client';

import { useBlueprints } from '@/services/blueprints';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export function BlueprintListPageClient() {
  const { data: blueprints, isLoading, isError, refetch } = useBlueprints();

  if (isLoading) {
    return (
      <div className='space-y-4 mt-8'>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-16 w-full rounded-md' />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className='mt-8 text-center py-12 border rounded-md'>
        <h3 className='text-lg font-medium text-red-600 mb-2'>Error loading blueprints</h3>
        <p className='text-muted-foreground mb-4'>We could not load the blueprints from the server.</p>
        <button
          onClick={() => refetch()}
          className='text-sm font-medium text-indigo-600 hover:text-indigo-500'
        >
          Try again
        </button>
      </div>
    );
  }

  if (!blueprints || blueprints.length === 0) {
    return (
      <div className='mt-8 text-center py-12 border border-dashed rounded-md'>
        <h3 className='text-lg font-medium text-gray-900 mb-1'>No blueprints found</h3>
        <p className='text-muted-foreground mb-6'>Get started by designing a new blueprint for an exam configuration.</p>
        <Link
          href='/admin/blueprints/builder'
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
        >
          Open Builder
        </Link>
      </div>
    );
  }

  return (
    <div className='mt-8 flex flex-col'>
      <div className='-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8'>
        <div className='inline-block min-w-full py-2 align-middle md:px-6 lg:px-8'>
          <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
            <table className='min-w-full divide-y divide-gray-300'>
              <thead className='bg-gray-50'>
                <tr>
                  <th scope='col' className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6'>
                    Exam Configuration
                  </th>
                  <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                    Style Profile
                  </th>
                  <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                    Type
                  </th>
                  <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                    Sections Count
                  </th>
                  <th scope='col' className='relative py-3.5 pl-3 pr-4 sm:pr-6'>
                    <span className='sr-only'>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {blueprints.map((bp: any) => (
                  <tr key={bp.id}>
                    <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6'>
                      {bp.examConfig?.name || bp.configId}
                      <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                        {bp.examConfig?.code}
                      </span>
                    </td>
                    <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      {bp.styleProfile?.name || bp.styleProfileId}
                    </td>
                    <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize'>
                      {bp.styleProfile?.profileType || 'N/A'}
                    </td>
                    <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      {bp.sections?.length || 0} sections
                    </td>
                    <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6'>
                      <Link
                        href={`/admin/blueprints/builder?id=${bp.id}`}
                        className='text-indigo-600 hover:text-indigo-900 mr-4'
                      >
                        Edit / Validate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
