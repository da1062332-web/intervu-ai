'use client';

import { useState } from 'react';
import { useTemplates } from '@/services/templates/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Search, RefreshCw, Settings } from 'lucide-react';

export function TemplateListPageClient() {
  const { data: templatesData, isLoading, isError, refetch, isFetching } = useTemplates();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templatesData?.items?.filter(
    (tpl) =>
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (isError) {
    return (
      <div className='mt-8 text-center py-12 border rounded-md'>
        <h3 className='text-lg font-medium text-red-600 mb-2'>Error loading templates</h3>
        <p className='text-muted-foreground mb-4'>
          We could not load the templates from the server.
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
              placeholder='Search templates...'
              className='pl-9'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant='outline' size='icon' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className='space-y-4 mt-4'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-16 w-full rounded-md' />
          ))}
        </div>
      ) : !templatesData?.items || templatesData.items.length === 0 ? (
        <div className='mt-8 text-center py-12 border border-dashed rounded-md bg-white dark:bg-gray-900'>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-1'>
            No templates found
          </h3>
          <p className='text-muted-foreground mb-6'>There are no templates available yet.</p>
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
                      Description
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
                  {filteredTemplates?.map((tpl) => (
                    <tr key={tpl.id}>
                      <td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-6'>
                        {tpl.name}
                      </td>
                      <td className='px-3 py-4 text-sm text-gray-500'>{tpl.description || '-'}</td>
                      <td className='whitespace-nowrap px-3 py-4 text-sm'>
                        {tpl.active ? (
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
                        <Link href={`/admin/templates/${tpl.id}`}>
                          <Button variant='outline' size='sm'>
                            <Settings className='h-4 w-4 mr-1' />
                            Manage Schema
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredTemplates?.length === 0 && (
                    <tr>
                      <td colSpan={4} className='py-8 text-center text-sm text-gray-500'>
                        No templates found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
