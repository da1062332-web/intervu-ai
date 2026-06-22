'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTestDetails } from '../hooks/useTestDetails';
import { CandidateInfo } from '../components/CandidateInfo';
import { TestSummary } from '../components/TestSummary';
import { SystemCheck } from '../components/SystemCheck';
import { Button } from '@/components/ui/button';
import { TestDetailsSkeleton, MetadataSkeleton } from '@/features/candidate/tests/components/TestDiscoveryLoaders';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';
import { ChevronLeft, Play, AlertCircle } from 'lucide-react';

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

  const handleStartAssessment = () => {
    router.push(`/candidate/test/${testId}/execution`);
  };

  return (
    <div className='flex flex-col min-h-screen pb-20'>
      <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
        <div className='container max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon' asChild className='shrink-0 hover:bg-muted/50 rounded-xl transition-colors'>
              <Link href={`/candidate/tests/${testId}/instructions`}>
                <ChevronLeft className='size-5' />
              </Link>
            </Button>
            <h1 className='text-xl font-heading font-semibold tracking-tight text-foreground'>Launch Assessment</h1>
          </div>
        </div>
      </div>

      <main className='flex-1 container max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main system check panel */}
          <div className='lg:col-span-2 space-y-6'>
            <SystemCheck onStatusChange={setIsSystemReady} />
          </div>

          {/* Sidebar parameters summary */}
          <div className='lg:col-span-1 space-y-6'>
            <CandidateInfo />
            <TestSummary test={test} />
          </div>
        </div>

        {/* Warning / Ready Banner */}
        {!isSystemReady && (
          <div className='p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl flex items-center gap-3.5'>
            <AlertCircle className='size-5 text-amber-500 shrink-0' />
            <p className='text-sm font-medium text-amber-800 dark:text-amber-300'>
              Please wait until all system readiness checks complete successfully before launching the assessment. Enable camera and microphone permission if prompted.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex justify-end pt-6 border-t border-border/40'>
          <Button
            onClick={handleStartAssessment}
            disabled={!isSystemReady}
            size='lg'
            className='px-10 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all'
          >
            Start Assessment <Play className='ml-2 size-4 fill-current' />
          </Button>
        </div>
      </main>
    </div>
  );
}
