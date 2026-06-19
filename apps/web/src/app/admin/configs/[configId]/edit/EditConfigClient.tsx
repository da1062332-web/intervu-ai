'use client';

import { useConfig } from '@/services/exam-configs';
import { ConfigForm } from '@/components/admin/config/config-form';
import { ConfigHeader } from '@/components/admin/config/config-header';
import { Skeleton } from '@/components/ui/skeleton';

interface EditConfigClientProps {
  configId: string;
}

export function EditConfigClient({ configId }: EditConfigClientProps) {
  const { data: config, isLoading, isError } = useConfig(configId);

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl'>
        <div className='space-y-4'>
          <Skeleton className='h-10 w-1/3' />
          <Skeleton className='h-4 w-1/2' />
        </div>
        <div className='mt-8 bg-card p-6 rounded-lg border shadow-sm space-y-6'>
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl text-center'>
        <h3 className='text-lg font-medium text-red-600 mb-2'>Error loading configuration</h3>
        <p className='text-muted-foreground'>
          We could not load the configuration details for editing.
        </p>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl'>
      <ConfigHeader title='Edit Configuration' description={`Update details for ${config.name}.`} />
      <div className='mt-8 bg-card p-6 rounded-lg border shadow-sm'>
        <ConfigForm initialData={config} />
      </div>
    </div>
  );
}
