'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTestDetails } from '@/features/candidate/tests/hooks/useTestDetails';
import { TestDetailsCard } from '@/features/candidate/tests/components/TestDetailsCard';
import { TestMetadata } from '@/features/candidate/tests/components/TestMetadata';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import {
  TestDetailsSkeleton,
  MetadataSkeleton,
} from '@/features/candidate/tests/components/TestDiscoveryLoaders';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';

export default function TestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // @ts-expect-error - React.use is not in current types
  const { id: testId } = React.use(params);
  const { data: config, isLoading, error, refetch } = useTestDetails(testId);

  if (isLoading) {
    return (
      <div className='flex flex-col min-h-screen pb-20'>
        <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
          <div className='container max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='icon' disabled className='shrink-0'>
                <ChevronLeft className='size-5' />
              </Button>
              <div className='h-6 w-32 bg-muted rounded animate-pulse' />
            </div>
          </div>
        </div>

        <main className='flex-1 container max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
              <TestDetailsSkeleton />
            </div>
            <div className='lg:col-span-1'>
              <MetadataSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !config) {
    return (
      <TestDiscoveryError
        error={error || new Error('Failed to load test details')}
        reset={refetch}
      />
    );
  }

  return (
    <div className='flex flex-col min-h-screen pb-20'>
      <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
        <div className='container max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon' asChild className='shrink-0'>
              <Link href='/candidate/dashboard'>
                <ChevronLeft className='size-5' />
              </Link>
            </Button>
            <h1 className='text-xl font-semibold tracking-tight'>Test Overview</h1>
          </div>
        </div>
      </div>

      <main className='flex-1 container max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2'>
            <TestDetailsCard config={config} />
          </div>
          <div className='lg:col-span-1'>
            <TestMetadata sections={config.sections} />
          </div>
        </div>

        <div className='flex justify-end pt-6 border-t border-border/40'>
          <Button asChild size='lg' className='px-8'>
            <Link href={`/candidate/tests/${testId}/instructions`}>
              Continue to Instructions <ArrowRight className='ml-2 size-4' />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
