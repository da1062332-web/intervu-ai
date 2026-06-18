'use client';

import { useState } from 'react';
import { ConfigTable } from '@/components/admin/config/config-table';
import { useConfigs } from '@/services/exam-configs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export function ConfigsPageClient() {
  const { data: configs, isLoading, isError, refetch } = useConfigs();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className='space-y-4 mt-8'>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className='h-16 w-full rounded-md' />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className='mt-8 text-center py-12 border rounded-md'>
        <h3 className='text-lg font-medium text-red-600 mb-2'>Error loading configurations</h3>
        <p className='text-muted-foreground mb-4'>We could not load the exam configurations.</p>
        <Button
          onClick={() => refetch()}
          variant='outline'
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try again
        </Button>
      </div>
    );
  }

  const filteredConfigs = configs?.filter((config) => {
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
