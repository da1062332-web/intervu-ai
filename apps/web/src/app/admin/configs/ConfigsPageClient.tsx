'use client';

import { ConfigTable } from '@/components/admin/config/config-table';
import { useConfigs } from '@/services/exam-configs';
import { Skeleton } from '@/components/ui/skeleton';

export function ConfigsPageClient() {
  const { data: configs, isLoading, isError, refetch } = useConfigs();

  if (isLoading) {
    return (
      <div className="space-y-4 mt-8">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 text-center py-12 border rounded-md">
        <h3 className="text-lg font-medium text-red-600 mb-2">Error loading configurations</h3>
        <p className="text-muted-foreground mb-4">We could not load the exam configurations.</p>
        <button 
          onClick={() => refetch()}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ConfigTable configs={configs || []} />
    </div>
  );
}
