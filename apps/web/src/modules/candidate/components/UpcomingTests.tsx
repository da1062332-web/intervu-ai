'use client';

import { useRouter } from 'next/navigation';
import { AvailableTest } from '../types/Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, PlayCircle } from 'lucide-react';

interface UpcomingTestsProps {
  tests: AvailableTest[];
}

export function UpcomingTests({ tests }: UpcomingTestsProps) {
  const router = useRouter();

  if (tests.length === 0) {
    return (
      <Card className='h-full flex flex-col glass-card'>
        <CardHeader>
          <CardTitle className='text-xl font-semibold'>Available Assessments</CardTitle>
          <CardDescription>Assessments assigned to you</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center'>
          <div className='bg-muted/50 p-4 rounded-full mb-3'>
            <Clock className='size-8 opacity-50' />
          </div>
          <p className='font-medium'>No available assessments</p>
          <p className='text-sm mt-1'>You're all caught up for now.</p>
        </CardContent>
      </Card>
    );
  }

  const displayTests = tests.slice(0, 3);
  const hasMore = tests.length > 3;

  return (
    <Card className='h-full flex flex-col glass-card'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <div className='space-y-1'>
          <CardTitle className='text-xl font-semibold'>Available Assessments</CardTitle>
          <CardDescription>Assessments ready to be taken</CardDescription>
        </div>
        {hasMore && (
          <Button
            variant='ghost'
            className='text-sm text-primary hover:underline px-0'
            onClick={() => router.push('/candidate/tests')}
          >
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent className='flex-1 space-y-4 pt-4'>
        {displayTests.map((test) => (
          <div
            key={test.id}
            className='flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors gap-4'
          >
            <div className='space-y-2 flex-1'>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold text-foreground'>{test.title}</h3>
                <Badge
                  variant='outline'
                  className='bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                >
                  {test.status}
                </Badge>
              </div>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <Clock className='size-4' />
                  {test.durationMinutes} Minutes
                </span>
                <span className='flex gap-1 flex-wrap'>
                  {test.sections.slice(0, 2).map((sec: string) => (
                    <Badge key={sec} variant='secondary' className='text-xs font-normal'>
                      {sec}
                    </Badge>
                  ))}
                  {test.sections.length > 2 && (
                    <Badge variant='secondary' className='text-xs font-normal'>
                      +{test.sections.length - 2} more
                    </Badge>
                  )}
                </span>
              </div>
            </div>
            <Button
              className='w-full sm:w-auto shrink-0 group shadow-sm hover:shadow-md transition-shadow'
              onClick={() => router.push(`/candidate/tests/${test.id}`)}
            >
              Start Assessment
              <PlayCircle className='ml-2 size-4 group-hover:scale-110 transition-transform' />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
