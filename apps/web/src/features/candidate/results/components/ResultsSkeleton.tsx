import { Skeleton } from '@/components/ui/skeleton';

export function ResultsSkeleton() {
  return (
    <div className='min-h-screen bg-background flex flex-col pt-8'>
      <main className='flex-1 container max-w-7xl mx-auto px-4 md:px-8'>
        {/* Header Skeleton */}
        <div className='flex justify-between items-end border-b pb-6 mb-8'>
          <div className='space-y-3'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-40' />
          </div>
          <Skeleton className='h-6 w-32 hidden md:block' />
        </div>

        {/* Overall Score Skeleton */}
        <Skeleton className='h-32 w-full mb-8 rounded-xl' />

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8'>
          {/* Left Column */}
          <div className='lg:col-span-8 space-y-8'>
            <Skeleton className='h-48 w-full rounded-xl' />
            <Skeleton className='h-64 w-full rounded-xl' />
          </div>

          {/* Right Column */}
          <div className='lg:col-span-4 space-y-6'>
            <Skeleton className='h-40 w-full rounded-xl' />
            <Skeleton className='h-40 w-full rounded-xl' />
          </div>
        </div>
      </main>
    </div>
  );
}
