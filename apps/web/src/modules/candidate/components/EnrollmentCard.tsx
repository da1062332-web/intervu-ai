'use client';

import { useEnrollment } from '../hooks/useEnrollment';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface EnrollmentCardProps {
  testId: string;
  testName: string;
  company: string;
  status: string; // e.g., 'AVAILABLE', 'ENROLLED', 'IN_PROGRESS', 'COMPLETED'
}

export function EnrollmentCard({ testId, testName, company, status }: EnrollmentCardProps) {
  const { mutate: enroll, isPending } = useEnrollment();

  const handleEnroll = () => {
    enroll(testId);
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <div className='flex items-center text-muted-foreground text-sm'>
            <AlertCircle className='size-4 mr-2' />
            Enrollment Required
          </div>
        );
      case 'ENROLLED':
        return (
          <div className='flex items-center text-green-600 text-sm font-medium'>
            <CheckCircle2 className='size-4 mr-2' />
            Enrolled
          </div>
        );
      case 'IN_PROGRESS':
        return (
          <div className='flex items-center text-blue-600 text-sm font-medium'>
            <Clock className='size-4 mr-2' />
            In Progress
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className='border shadow-sm'>
      <CardHeader className='pb-3'>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle className='text-xl font-heading'>{testName}</CardTitle>
            <p className='text-muted-foreground text-sm mt-1'>{company}</p>
          </div>
          {getStatusDisplay()}
        </div>
      </CardHeader>
      <CardFooter className='pt-2'>
        {status === 'AVAILABLE' && (
          <Button className='w-full' onClick={handleEnroll} disabled={isPending}>
            {isPending ? 'Enrolling...' : 'Enroll Now'}
          </Button>
        )}
        {status === 'ENROLLED' && (
          <Button className='w-full' asChild>
            <Link href={`/candidate/tests/${testId}/instructions`}>
              Start Assessment
              <PlayCircle className='ml-2 size-4' />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
