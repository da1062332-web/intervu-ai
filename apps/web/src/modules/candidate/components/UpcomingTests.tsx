'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock, ArrowRight } from 'lucide-react';

import { useCandidateDashboard } from '../hooks/useCandidateDashboard';

export function UpcomingTests() {
  const router = useRouter();
  const { data, isLoading, error } = useCandidateDashboard();

  if (isLoading) {
    return (
      <Card className='bg-card/80 border border-border/60 shadow-xs h-full flex flex-col'>
        <CardHeader className='pb-3 border-b border-border/40'>
          <CardTitle className='text-base md:text-lg font-bold text-foreground'>Available Assessments</CardTitle>
          <CardDescription className='text-xs text-muted-foreground font-medium'>Recommended and assigned tests open for evaluation</CardDescription>
        </CardHeader>
        <CardContent className='p-4 space-y-3 flex-1'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-18 w-full rounded-xl border border-border/60 bg-muted/50' />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className='bg-card/80 border border-border/60 shadow-xs h-full flex flex-col'>
        <CardContent className='flex-1 flex items-center justify-center p-6 text-xs font-semibold text-destructive'>
          Failed to retrieve assessment schedule.
        </CardContent>
      </Card>
    );
  }

  const tests = data.availableTests?.filter((t) => t.status !== 'ENROLLED' && t.attemptCount === 0 && !t.hasActiveAttempt) || [];
  if (tests.length === 0) {
    return (
      <Card className='bg-card/80 border border-border/60 shadow-xs h-full flex flex-col'>
        <CardHeader className='pb-3 border-b border-border/40'>
          <CardTitle className='text-base md:text-lg font-bold text-foreground'>Available Assessments</CardTitle>
          <CardDescription className='text-xs text-muted-foreground font-medium'>Recommended and assigned tests open for evaluation</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 flex items-center justify-center p-6'>
          <EmptyState
            title='No Pending Assessments'
            description="You have completed or enrolled in all assessments currently available to your profile."
            icon={<Clock className='size-8 text-muted-foreground/70' />}
            variant='no-data'
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-card/80 border border-border/60 shadow-xs h-full flex flex-col'>
      <CardHeader className='pb-3 border-b border-border/40'>
        <CardTitle className='text-base md:text-lg font-bold text-foreground'>Available Assessments</CardTitle>
        <CardDescription className='text-xs text-muted-foreground font-medium'>Recommended and assigned tests open for evaluation</CardDescription>
      </CardHeader>
      <CardContent className='p-4 space-y-3 flex-1 overflow-y-auto max-h-[440px] custom-scrollbar'>
        {tests.map((test) => (
          <div
            key={test.id}
            className='flex items-center justify-between p-3.5 border border-border/60 rounded-xl bg-background/50 hover:bg-muted/30 transition-colors shadow-2xs gap-3 group'
          >
            <div className='min-w-0 flex-1'>
              <div className='font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors'>{test.title}</div>
              <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground mt-1'>
                <Badge
                  variant='outline'
                  className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-bold px-2 py-0'
                >
                  {test.status}
                </Badge>
                <span className='flex items-center gap-1'>
                  <Clock className='size-3.5 text-primary/80' />
                  {test.durationMinutes} Mins
                </span>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='gap-1 font-semibold text-xs h-8 shrink-0 border-border/60 hover:border-primary transition-all'
              onClick={() => router.push(`/candidate/tests/${test.id}`)}
            >
              Details
              <ArrowRight className='size-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform' />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
