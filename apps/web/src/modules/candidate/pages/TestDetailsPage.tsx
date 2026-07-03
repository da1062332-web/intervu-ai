'use client';

import Link from 'next/link';
import { useTestDetails } from '../hooks/useTestDetails';
import { TestOverview } from '../components/TestOverview';
import { SyllabusBreakdown } from '../components/SyllabusBreakdown';
import { SectionBreakdown } from '../components/SectionBreakdown';
import { EligibilityInfo } from '../components/EligibilityInfo';
import { EnrollmentCard } from '../components/EnrollmentCard';
import { useEnrollments } from '../hooks/useEnrollments';
import { Button } from '@/components/ui/button';
import {
  TestDetailsSkeleton,
  MetadataSkeleton,
} from '@/features/candidate/tests/components/TestDiscoveryLoaders';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';
import { ChevronLeft, ArrowRight } from 'lucide-react';

interface TestDetailsPageProps {
  testId: string;
}

export function TestDetailsPage({ testId }: TestDetailsPageProps) {
  const { data: test, isLoading, error, refetch } = useTestDetails(testId);
  const { data: enrollmentsData } = useEnrollments();

  const enrollment = enrollmentsData?.enrollments?.find((e: any) => e.testId === testId);
  const enrollmentStatus = enrollment ? enrollment.status : 'AVAILABLE';

  if (isLoading) {
    return (
      <div className='flex flex-col min-h-screen pb-20'>
        <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
          <div className='container max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='icon' disabled className='shrink-0'>
                <ChevronLeft className='size-5' />
              </Button>
              <div className='h-6 w-32 bg-muted rounded animate-pulse' />
            </div>
          </div>
        </div>

        <main className='flex-1 container max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
              <TestDetailsSkeleton />
            </div>
            <div className='lg:col-span-1 space-y-6'>
              <MetadataSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !test) {
    return (
      <TestDiscoveryError
        error={new Error(error || 'Failed to load test details')}
        reset={refetch}
      />
    );
  }

  return (
    <div className='flex flex-col min-h-screen pb-20'>
      <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
        <div className='container max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              asChild
              className='shrink-0 hover:bg-muted/50 rounded-xl transition-colors'
            >
              <Link href='/candidate/tests'>
                <ChevronLeft className='size-5' />
              </Link>
            </Button>
            <h1 className='text-xl font-heading font-semibold tracking-tight text-foreground'>
              Test Overview
            </h1>
          </div>
        </div>
      </div>

      <main className='flex-1 container max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <div className='max-w-3xl mx-auto w-full flex flex-col space-y-6'>
          <TestOverview test={test} />
          <SectionBreakdown sections={test.sections} />
          <SyllabusBreakdown syllabus={(test as any).syllabus} />
          <EligibilityInfo eligibility={(test as any).eligibility} />
        </div>

        <div className='max-w-3xl mx-auto w-full flex justify-end pt-6 border-t border-border/40'>
          <div className='w-full sm:w-1/2'>
            <EnrollmentCard
              testId={testId}
              testName={test.title}
              company={test.company || 'InterVu'}
              status={(test as any).status || enrollmentStatus}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
