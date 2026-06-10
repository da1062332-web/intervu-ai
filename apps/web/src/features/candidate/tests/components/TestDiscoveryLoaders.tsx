import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function TestDetailsSkeleton() {
  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <div className='flex justify-between items-start gap-4'>
          <div className='space-y-3 w-full'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-8 w-3/4' />
          </div>
          <Skeleton className='h-6 w-20' />
        </div>
        <Skeleton className='h-4 w-full mt-6' />
        <Skeleton className='h-4 w-5/6 mt-2' />
      </CardHeader>
      <CardContent className='flex gap-6 mt-4'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-5 w-24' />
      </CardContent>
    </Card>
  );
}

export function MetadataSkeleton() {
  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <Skeleton className='h-6 w-48' />
      </CardHeader>
      <CardContent className='flex-1 space-y-4'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-16 w-full rounded-lg' />
        ))}
      </CardContent>
    </Card>
  );
}

export function InstructionsSkeleton() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <Skeleton className='h-6 w-40' />
      </CardHeader>
      <CardContent className='space-y-8'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='space-y-3'>
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
            <Skeleton className='h-4 w-4/5' />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
