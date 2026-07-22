'use client';

import { useConfig } from '@/services/exam-configs';
import { ConfigForm } from '@/components/admin/config/config-form';
import { ConfigHeader } from '@/components/admin/config/config-header';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';

interface EditConfigClientProps {
  configId: string;
}

export function EditConfigClient({ configId }: EditConfigClientProps) {
  const { data: config, isLoading, isError } = useConfig(configId);

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl h-[50vh]'>
        <AnimatedLoader variant='page' />
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl h-[50vh]'>
        <EmptyState
          variant='error'
          title='Error loading configuration'
          description='We could not load the configuration details for editing.'
          className='border rounded-md'
        />
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl'>
      <ConfigHeader title='Edit Configuration' description={`Update details for ${config.name}.`} />
      <Card className='mt-8 p-6'>
        <ConfigForm initialData={config} />
      </Card>
    </div>
  );
}
