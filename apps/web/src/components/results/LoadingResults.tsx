import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoadingResults() {
  return (
    <div className='w-full' aria-busy='true' aria-label='Loading evaluation results'>
      {/* Header Skeleton */}
      <Card className='mb-6'>
        <CardContent className='p-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='space-y-3 w-full max-w-sm'>
              <Skeleton className='h-8 w-3/4' />
              <Skeleton className='h-5 w-1/2' />
            </div>
            <Skeleton className='h-8 w-48 sm:w-56' />
          </div>
        </CardContent>
      </Card>

      {/* Score Cards Skeleton */}
      <section className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
        {[1, 2].map((i) => (
          <Card key={`score-skel-${i}`}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-32' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-10 w-24' />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Skill Cards Skeleton */}
      <section>
        <Skeleton className='h-7 w-48 mb-4' /> {/* "Skills Evaluation" heading placeholder */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={`skill-skel-${i}`} className='h-full flex flex-col'>
              <CardHeader className='pb-3 flex-row items-center justify-between space-y-0'>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-6 w-12' />
              </CardHeader>
              <CardContent className='space-y-2 flex-1'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
                <Skeleton className='h-4 w-4/6' />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
