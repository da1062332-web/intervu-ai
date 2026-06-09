import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function CandidateDashboardSkeleton() {
  return (
    <div className='space-y-8'>
      {/* Header Skeleton */}
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-6 w-32' />
        </div>
        <Skeleton className='h-10 w-36 rounded-full' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Column */}
        <div className='lg:col-span-2 space-y-8'>
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Sidebar Column */}
        <div className='space-y-8'>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-1/2 mb-2' />
        <Skeleton className='h-4 w-3/4' />
      </CardHeader>
      <CardContent className='space-y-4'>
        <Skeleton className='h-16 w-full rounded-lg' />
        <Skeleton className='h-16 w-full rounded-lg' />
      </CardContent>
    </Card>
  );
}
