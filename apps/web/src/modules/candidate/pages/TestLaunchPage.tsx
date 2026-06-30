'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTestDetails } from '../hooks/useTestDetails';
import { CandidateInfo } from '../components/CandidateInfo';
import { TestSummary } from '../components/TestSummary';
import { SystemCheck } from '../components/SystemCheck';
import { Button } from '@/components/ui/button';
import {
  TestDetailsSkeleton,
  MetadataSkeleton,
} from '@/features/candidate/tests/components/TestDiscoveryLoaders';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';
import { ChevronLeft, Play, AlertCircle } from 'lucide-react';
import { testService } from '@/services/candidate/test.service';

interface TestLaunchPageProps {
  testId: string;
}

export function TestLaunchPage({ testId }: TestLaunchPageProps) {
  const router = useRouter();
  const { data: test, isLoading, error, refetch } = useTestDetails(testId);
  const [isSystemReady, setIsSystemReady] = useState(false);

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
            <div className='lg:col-span-1'>
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

  const [isStarting, setIsStarting] = useState(false);

  const handleStartAssessment = async () => {
    try {
      setIsStarting(true);
      const { testInstanceId } = await testService.startTest(testId);
      router.push(`/candidate/tests/${testInstanceId}/execution`);
    } catch (err) {
      console.error('Failed to start assessment', err);
      // You could add a toast notification here
      setIsStarting(false);
    }
  };

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
              <Link href={`/candidate/tests/${testId}/instructions`}>
                <ChevronLeft className='size-5' />
              </Link>
            </Button>
            <h1 className='text-xl font-heading font-semibold tracking-tight text-foreground'>
              Launch Assessment
            </h1>
          </div>
        </div>
      </div>

      <main className='flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 mt-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        {/* Warning / Ready Banner */}
        {!isSystemReady && (
          <div className='p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl flex items-center gap-3.5 shadow-sm max-w-4xl mx-auto'>
            <AlertCircle className='size-5 text-amber-500 shrink-0' />
            <p className='text-sm font-medium text-amber-800 dark:text-amber-300'>
              Please wait until all system readiness checks complete successfully before launching
              the assessment. Enable camera and microphone permissions if prompted.
            </p>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12'>
          {/* Main system check panel */}
          <div className='lg:col-span-7 xl:col-span-8 flex flex-col'>
            <SystemCheck onStatusChange={setIsSystemReady} />
          </div>

          {/* Sidebar parameters summary */}
          <div className='lg:col-span-5 xl:col-span-4 flex flex-col space-y-6'>
            <CandidateInfo />
            <TestSummary test={test} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-center lg:justify-end pt-8 border-t border-border/40 mt-8'>
          <Button
            onClick={handleStartAssessment}
            disabled={!isSystemReady || isStarting}
            size='lg'
            className='w-full sm:w-auto px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl'
          >
            {isStarting ? 'Starting...' : 'Start Assessment'} {!isStarting && <Play className='ml-2 size-5 fill-current' />}
          </Button>
        </div>
      </main>
    </div>
  );
}
