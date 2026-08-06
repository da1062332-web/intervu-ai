'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, Clock, CheckCircle2, PlayCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCandidateDashboard } from '../hooks/useCandidateDashboard';
import type { DashboardTestItem, DashboardActiveTest, DashboardCompletedAttempt } from '../services/dashboard.service';
import { motion } from 'framer-motion';

export function AssessmentStatusPanel() {
  const { data, isLoading } = useCandidateDashboard();

  if (isLoading) {
    return (
      <Card className='bg-card/80 border border-border/60 shadow-xs h-full flex flex-col'>
        <CardHeader className='pb-3 border-b border-border/40'>
          <CardTitle className='text-base md:text-lg font-bold text-foreground'>My Assessment Queue</CardTitle>
          <CardDescription className='text-xs text-muted-foreground font-medium'>Active evaluations and pending test assignments</CardDescription>
        </CardHeader>
        <CardContent className='p-4 space-y-3 flex-1'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-18 w-full rounded-xl border border-border/60 bg-muted/50' />
          ))}
        </CardContent>
      </Card>
    );
  }

  const inProgressTests: DashboardActiveTest[] = data?.activeTests || [];
  const enrolledTests: DashboardTestItem[] = (data?.availableTests || []).filter(
    (t) => t.status === 'ENROLLED',
  );

  const reattemptableTests: DashboardTestItem[] = (data?.availableTests || []).filter(
    (t) => t.attemptCount > 0 && t.canReattempt && !t.hasActiveAttempt,
  );

  const hasContent =
    inProgressTests.length > 0 ||
    enrolledTests.length > 0 ||
    reattemptableTests.length > 0;

  if (!hasContent) {
    return (
      <Card className='bg-card/80 border border-border/60 shadow-xs h-full flex flex-col'>
        <CardHeader className='pb-3 border-b border-border/40'>
          <CardTitle className='text-base md:text-lg font-bold text-foreground'>My Assessment Queue</CardTitle>
          <CardDescription className='text-xs text-muted-foreground font-medium'>Active evaluations and pending test assignments</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 flex items-center justify-center p-6'>
          <EmptyState
            title='No Active Assessments'
            description="You don't have any assessments currently in progress or awaiting action."
            icon={<CheckCircle2 className='size-8 text-muted-foreground/70' />}
            variant='no-data'
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-card/80 border border-border/60 shadow-xs h-full flex flex-col'>
      <CardHeader className='pb-3 border-b border-border/40'>
        <CardTitle className='text-base md:text-lg font-bold text-foreground'>My Assessment Queue</CardTitle>
        <CardDescription className='text-xs text-muted-foreground font-medium'>Active evaluations and pending test assignments</CardDescription>
      </CardHeader>
      <CardContent className='p-4 space-y-3 flex-1 overflow-y-auto max-h-[440px] custom-scrollbar'>
        {/* IN PROGRESS */}
        {inProgressTests.map((test) => (
          <motion.div
            key={test.instanceId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex items-center justify-between p-4 rounded-xl bg-primary/10 border-2 border-primary/30 shadow-xs transition-all gap-3'
          >
            <div className='min-w-0 flex-1'>
              <div className='font-bold text-sm md:text-base text-foreground truncate'>{test.testName || test.title}</div>
              <div className='text-xs text-primary flex items-center gap-1.5 mt-1 font-semibold'>
                <Clock className='size-3.5 shrink-0' />
                <span className='relative flex size-2 shrink-0'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
                  <span className='relative inline-flex rounded-full size-2 bg-primary'></span>
                </span>
                In Progress
                {test.remainingMinutes > 0 && (
                  <span className='text-muted-foreground font-medium ml-1'>
                    · {test.remainingMinutes}m remaining
                  </span>
                )}
              </div>
            </div>
            <Button asChild size='sm' className='gap-1.5 font-semibold text-xs h-8 shrink-0'>
              <Link href={`/candidate/tests/${test.instanceId}/launch?resume=true`}>
                Resume <ArrowRight className='size-3.5' />
              </Link>
            </Button>
          </motion.div>
        ))}

        {/* ENROLLED */}
        {enrolledTests
          .filter((t) => !t.hasActiveAttempt && t.canReattempt)
          .map((test, idx) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className='flex items-center justify-between p-3.5 border border-border/60 rounded-xl bg-background/50 hover:bg-muted/30 transition-colors shadow-2xs gap-3'
            >
              <div className='min-w-0 flex-1'>
                <div className='font-semibold text-sm text-foreground truncate'>{test.title}</div>
                <div className='text-xs text-amber-500 font-semibold flex items-center gap-1.5 mt-1'>
                  <AlertCircle className='size-3.5' />
                  <span>Enrolled & Ready</span>
                </div>
              </div>
              <Button asChild size='sm' variant='outline' className='gap-1.5 font-semibold text-xs h-8 shrink-0 border-border/60 hover:border-primary'>
                <Link href={`/candidate/tests/${test.id}/instructions`}>
                  Start
                  <PlayCircle className='size-3.5' />
                </Link>
              </Button>
            </motion.div>
          ))}
      </CardContent>
    </Card>
  );
}
