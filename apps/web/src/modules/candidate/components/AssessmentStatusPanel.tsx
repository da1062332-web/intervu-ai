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

  const inProgressTests = data?.activeTests || [];
  const enrolledTests = data?.availableTests?.filter((t: any) => t.status === 'ENROLLED') || [];

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
    <div className='space-y-8'>
      {/* Quick Actions */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-4'>
          <Button variant='outline' asChild>
            <Link href='/candidate/tests'>Browse Catalog</Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href='/candidate/history'>View History</Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href='/candidate/profile'>My Profile</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Active / Continue Assessments */}
      {(inProgressTests.length > 0 || enrolledTests.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Active Assessments</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
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
                <Link
                  href={`/candidate/tests/${test.id}`}
                  className='text-sm text-primary hover:underline font-medium'
                >
                  Start Test
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
