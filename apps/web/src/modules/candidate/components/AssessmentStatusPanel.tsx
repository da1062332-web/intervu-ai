'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle2, PlayCircle, RefreshCw, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { useCandidateDashboard } from '../hooks/useCandidateDashboard';
import type { DashboardTestItem, DashboardActiveTest, DashboardCompletedAttempt } from '../services/dashboard.service';

import { motion } from 'framer-motion';

export function AssessmentStatusPanel() {
  const { data, isLoading } = useCandidateDashboard();

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='h-20 animate-pulse bg-muted rounded-xl' />
        ))}
      </div>
    );
  }

  const inProgressTests: DashboardActiveTest[] = data?.activeTests || [];
  const enrolledTests: DashboardTestItem[] = (data?.availableTests || []).filter(
    (t) => t.status === 'ENROLLED',
  );
  const completedTests: DashboardCompletedAttempt[] = data?.completedAttempts || [];

  // Tests that were completed AND can be re-attempted
  const reattemptableTests: DashboardTestItem[] = (data?.availableTests || []).filter(
    (t) => t.attemptCount > 0 && t.canReattempt && !t.hasActiveAttempt,
  );

  const hasContent =
    inProgressTests.length > 0 ||
    enrolledTests.length > 0 ||
    completedTests.length > 0;

  if (!hasContent) {
    return (
      <Card className='h-full flex flex-col glass-card'>
        <CardHeader>
          <CardTitle>My Assessments</CardTitle>
        </CardHeader>
        <CardContent className='flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center'>
          <div className='bg-muted/50 p-4 rounded-full mb-3'>
            <CheckCircle2 className='size-8 opacity-50' />
          </div>
          <p className='font-medium'>No active assessments</p>
          <p className='text-sm mt-1'>You don&apos;t have any assessments in progress.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <CardTitle>My Assessments</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 flex-1 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar'>

        {/* ── IN PROGRESS (Quick Resume Banner) ── */}
        {inProgressTests.map((test) => (
          <motion.div
            key={test.instanceId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, scale: 1.01 }}
            className='flex items-center justify-between p-4 border-2 rounded-xl bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all'
          >
            <div className='min-w-0 flex-1 mr-3'>
              <div className='font-semibold text-foreground truncate'>{test.testName || test.title}</div>
              <div className='text-sm text-blue-500 flex items-center gap-1.5 mt-1 font-medium'>
                <Clock className='size-3.5' />
                <span className='relative flex h-2 w-2 mr-1'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-blue-500'></span>
                </span>
                In Progress
                {test.remainingMinutes > 0 && (
                  <span className='text-muted-foreground font-normal ml-1'>
                    · {test.remainingMinutes}m remaining
                  </span>
                )}
              </div>
            </div>
            <Button asChild size='sm' className='gap-2 shadow-sm shrink-0 bg-blue-600 hover:bg-blue-700 text-white'>
              <Link href={`/candidate/tests/${test.instanceId}/execution`}>
                Resume <ArrowRight className='size-3.5' />
              </Link>
            </Button>
          </motion.div>
        ))}

        {/* ── ENROLLED / NOT STARTED OR RE-ATTEMPTABLE ── */}
        {enrolledTests
          .filter((t) => !t.hasActiveAttempt && t.canReattempt)
          .map((test, idx) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className='flex items-center justify-between p-4 border rounded-xl bg-card/50 hover:bg-muted/30 transition-colors shadow-sm'
            >
              <div className='min-w-0 flex-1 mr-3'>
                <div className='font-medium truncate'>{test.title}</div>
                <div className='text-sm text-muted-foreground flex items-center gap-1.5 mt-1'>
                  <AlertCircle className='size-3.5 text-orange-500' />
                  Enrolled
                </div>
              </div>
              <Button asChild size='sm' className='gap-2 shadow-sm shrink-0 group'>
                <Link href={`/candidate/tests/${test.id}/instructions`}>
                  Start
                  <PlayCircle className='size-3.5 group-hover:scale-110 transition-transform' />
                </Link>
              </Button>
            </motion.div>
          ))}

        {/* ── COMPLETED (recent, with re-attempt option) ── */}
        {completedTests.map((attempt, idx) => {
          const matchingAvailable = reattemptableTests.find((t) => t.id === attempt.testId);
          return (
            <motion.div
              key={attempt.instanceId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className='flex items-center justify-between p-4 border rounded-xl bg-green-500/5 border-green-500/20 hover:bg-green-500/10 transition-colors shadow-sm'
            >
              <div className='min-w-0 flex-1 mr-3'>
                <div className='font-medium truncate text-foreground'>{attempt.assessmentName}</div>
                <div className='text-sm flex items-center gap-1.5 mt-1'>
                  <CheckCircle2 className='size-3.5 text-green-500' />
                  <span className='text-green-600 dark:text-green-400 font-medium'>Completed</span>
                  {attempt.score != null && (
                    <span className='text-muted-foreground'>· Score: {attempt.score}%</span>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2 shrink-0'>
                <Button asChild size='sm' variant='outline' className='h-8 px-3 text-xs'>
                  <Link href={`/candidate/results/${attempt.instanceId}`}>View Result</Link>
                </Button>
              </div>
            </motion.div>
          );
        })}

      </CardContent>
    </Card>
  );
}
