'use client';

import { useState } from 'react';
import { ConfigTable } from '@/components/admin/config/config-table';
import { useConfigs } from '@/services/exam-configs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';

export function ConfigsPageClient() {
  const { data: configs, isLoading, isError, refetch } = useConfigs();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return <AnimatedLoader variant='table' className='mt-8' />;
  }

  if (isError) {
    return (
      <EmptyState
        variant='error'
        title='Error loading configurations'
        description='We could not load the exam configurations.'
        actionLabel='Try again'
        onAction={() => refetch()}
        className='mt-8 border rounded-md'
      />
    );
  }

  const filteredConfigs =
    configs?.filter((config) => {
      const query = searchQuery.toLowerCase();
      return (
        config.name.toLowerCase().includes(query) ||
        (config.code || '').toLowerCase().includes(query) ||
        config.role.toLowerCase().includes(query)
      );
    }) || [];

  return (
    <div className='mt-8 space-y-6'>
      <div className='flex items-center gap-4 max-w-md'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search configurations...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>
      <ConfigTable configs={filteredConfigs} />
    </div>
  );
}
