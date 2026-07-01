'use client';

import { useEnrollments } from '../hooks/useEnrollments';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface EnrollmentItem {
  id: string;
  testId: string;
  testName: string;
  status: string;
}

export function AssessmentStatusPanel() {
  const { data: enrollmentsData, isLoading } = useEnrollments();

  if (isLoading) {
    return <div className='h-40 animate-pulse bg-muted rounded-xl' />;
  }

  const enrollments = enrollmentsData?.enrollments || [];

  if (enrollments.length === 0) {
    return null; // Don't show panel if no active enrollments
  }

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
    <Card>
      <CardHeader>
        <CardTitle>My Assessments</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {enrollments.map((enrollment: EnrollmentItem) => (
          <div
            key={enrollment.id}
            className='flex items-center justify-between p-3 border rounded-lg bg-card/50'
          >
            <div>
              <div className='font-medium'>{enrollment.testName}</div>
              <div className='text-sm text-muted-foreground flex items-center gap-1 mt-1'>
                {getStatusIcon(enrollment.status)}
                {enrollment.status}
              </div>
            </div>
            {enrollment.status === 'ENROLLED' && (
              <Link
                href={`/candidate/tests/${enrollment.testId}`}
                className='text-sm text-primary hover:underline font-medium'
              >
                Start Test
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
