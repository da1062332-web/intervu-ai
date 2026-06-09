'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ExecutionSkeleton() {
  return (
    <div className='min-h-screen bg-background flex flex-col'>
      {/* Header Skeleton */}
      <header className='border-b h-16 w-full flex items-center justify-between px-4 md:px-8'>
        <div className='flex flex-col gap-2'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-3 w-24' />
        </div>
        <Skeleton className='h-10 w-24 rounded-lg' />
      </header>

      {/* Main Content Skeleton */}
      <main className='flex-1 container max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 h-full'>
          {/* Left Column - Question */}
          <div className='lg:col-span-8 flex flex-col min-h-[500px]'>
            <div className='w-full border rounded-xl p-6 flex-1 flex flex-col'>
              <div className='flex justify-between items-center mb-6'>
                <Skeleton className='h-7 w-32' />
                <Skeleton className='h-6 w-16' />
              </div>

              <Skeleton className='h-6 w-3/4 mb-4' />
              <Skeleton className='h-6 w-1/2 mb-12' />

              <div className='space-y-4 mt-auto'>
                <Skeleton className='h-14 w-full rounded-lg' />
                <Skeleton className='h-14 w-full rounded-lg' />
                <Skeleton className='h-14 w-full rounded-lg' />
                <Skeleton className='h-14 w-full rounded-lg' />
              </div>
            </div>

            {/* Navigation Skeleton */}
            <div className='flex justify-between mt-6'>
              <Skeleton className='h-12 w-32' />
              <Skeleton className='h-12 w-32' />
            </div>
          </div>

          {/* Right Column - Palette & Progress */}
          <div className='lg:col-span-4 flex flex-col gap-6'>
            <div className='border rounded-xl p-6'>
              <Skeleton className='h-6 w-32 mb-6' />
              <div className='grid grid-cols-5 gap-2'>
                {Array.from({ length: 20 }).map((_, i) => (
                  <Skeleton key={i} className='h-10 w-10 rounded-md' />
                ))}
              </div>
            </div>
            <div className='border rounded-xl p-6'>
              <Skeleton className='h-6 w-24 mb-4' />
              <Skeleton className='h-2 w-full rounded-full' />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
