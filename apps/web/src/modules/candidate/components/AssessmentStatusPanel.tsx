'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { useCandidateDashboard } from '../hooks/useCandidateDashboard';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

interface ActiveTestItem {
  instanceId?: string;
  testId?: string;
  testName?: string;
  name?: string;
  status: string;
}

export function AssessmentStatusPanel() {
  const { data, isLoading } = useCandidateDashboard();

  if (isLoading) {
    return <div className='h-40 animate-pulse bg-muted rounded-xl' />;
  }

  const completedTestIds = new Set(data?.completedAttempts?.map((c) => c.testId) || []);

  const inProgressTests = data?.activeTests?.filter(t => t.testId && !completedTestIds.has(t.testId)) || [];
  const enrolledTests = data?.availableTests?.filter((t: any) => t.status === 'ENROLLED' && !completedTestIds.has(t.id)) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return <AlertCircle className='size-4 text-orange-500' />;
      case 'IN_PROGRESS':
        return <Clock className='size-4 text-blue-500' />;
      case 'COMPLETED':
        return <CheckCircle2 className='size-4 text-green-500' />;
      default:
        return null;
    }
  };

  return (
    <div className='h-full'>
      {inProgressTests.length > 0 || enrolledTests.length > 0 ? (
        <Card className='h-full flex flex-col'>
          <CardHeader>
            <CardTitle>Active Assessments</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 flex-1'>
            {inProgressTests.map((test: ActiveTestItem) => (
              <div
                key={test.instanceId || test.testId}
                className='flex items-center justify-between p-4 border rounded-lg bg-blue-500/5 border-blue-500/20'
              >
                <div>
                  <div className='font-semibold text-foreground'>{test.testName || test.name}</div>
                  <div className='text-sm text-blue-500 flex items-center gap-1 mt-1 font-medium'>
                    <Clock className='size-4' />
                    In Progress
                  </div>
                </div>
                <Button asChild size='sm' className='gap-2 shadow-sm'>
                  <Link href={`/candidate/tests/${test.testId || test.instanceId}/resume`}>
                    Continue Assessment <PlayCircle className='size-4' />
                  </Link>
                </Button>
              </div>
            ))}

            {enrolledTests.map((test: any) => (
              <div
                key={test.id}
                className='flex items-center justify-between p-4 border rounded-lg bg-card/50'
              >
                <div>
                  <div className='font-medium'>{test.title}</div>
                  <div className='text-sm text-muted-foreground flex items-center gap-1 mt-1'>
                    <AlertCircle className='size-4 text-orange-500' />
                    Enrolled
                  </div>
                </div>
                <Button
                  asChild
                  className='w-full sm:w-auto shrink-0 group shadow-sm hover:shadow-md transition-shadow'
                >
                  <Link href={`/candidate/tests/${test.id}/instructions`}>
                    Start Assessment
                    <PlayCircle className='ml-2 size-4 group-hover:scale-110 transition-transform' />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className='h-full flex flex-col glass-card'>
          <CardHeader>
            <CardTitle>Active Assessments</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center'>
            <div className='bg-muted/50 p-4 rounded-full mb-3'>
              <CheckCircle2 className='size-8 opacity-50' />
            </div>
            <p className='font-medium'>No active assessments</p>
            <p className='text-sm mt-1'>You don't have any assessments in progress.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
