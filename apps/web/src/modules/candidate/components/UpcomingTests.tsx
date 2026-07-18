'use client';

import { useRouter } from 'next/navigation';
import { AvailableTest } from '../types/Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, PlayCircle } from 'lucide-react';

import { useCandidateDashboard } from '../hooks/useCandidateDashboard';

export function UpcomingTests() {
  const router = useRouter();
  const { data, isLoading, error } = useCandidateDashboard();

  if (isLoading) {
    return (
      <Card className='h-full flex flex-col glass-card'>
        <CardHeader>
          <CardTitle className='text-xl font-semibold'>Available Assessments</CardTitle>
          <CardDescription>Assessments ready to be taken</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2].map((i) => (
              <div key={i} className='h-24 bg-muted animate-pulse rounded-lg'></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className='h-full flex flex-col glass-card'>
        <CardContent className='flex-1 flex items-center justify-center text-destructive'>
          Failed to load upcoming tests.
        </CardContent>
      </Card>
    );
  }
  const tests = data.availableTests?.filter((t) => t.status !== 'ENROLLED' && t.attemptCount === 0 && !t.hasActiveAttempt) || [];
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

  return (
    <Card className='h-full flex flex-col glass-card'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <div className='space-y-1'>
          <CardTitle className='text-xl font-semibold'>Available Assessments</CardTitle>
          <CardDescription>Assessments ready to be taken</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex-1 space-y-4 pt-4 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar'>
        {tests.map((test) => (
          <div
            key={test.id}
            className='flex items-center justify-between p-4 border rounded-xl bg-card/50 hover:bg-muted/30 transition-colors shadow-sm gap-4'
          >
            <div className='min-w-0 flex-1 mr-3'>
              <div className='font-medium truncate'>{test.title}</div>
              <div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
                <Badge
                  variant='outline'
                  className='bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-[10px] h-4 leading-none py-0'
                >
                  {test.status}
                </Badge>
                <span className='flex items-center gap-1'>
                  <Clock className='size-3.5' />
                  {test.durationMinutes} Min
                </span>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='gap-2 shadow-sm shrink-0 group'
              onClick={() => router.push(`/candidate/tests/${test.id}`)}
            >
              View Details
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
