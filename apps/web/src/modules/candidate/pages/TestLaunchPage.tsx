'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useSubscriptionStore } from '@/store/subscription.store';
import { toast } from 'sonner';

interface TestLaunchPageProps {
  testId: string;
}

export function TestLaunchPage({ testId }: TestLaunchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isResume = searchParams.get('resume') === 'true';
  const { data: test, isLoading, error, refetch } = useTestDetails(testId);
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

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

  const handleStartAssessment = async () => {
    const hasActivePlan = useSubscriptionStore.getState().hasActivePlan;
    if (!hasActivePlan) {
      toast.error('An active subscription plan is required to start this assessment.');
      useSubscriptionStore.getState().openPricingModal();
      return;
    }

    const t0 = Date.now();
    console.log(`[CLIENT-LAUNCH 🚀] User clicked "Start Assessment" for testId: ${testId}`);
    try {
      setIsStarting(true);
      if (isResume) {
        console.log(`[CLIENT-LAUNCH ℹ️] Resuming existing session -> Navigating to /candidate/tests/${testId}/execution`);
        router.push(`/candidate/tests/${testId}/execution`);
        return;
      }
      console.log(`[CLIENT-LAUNCH ⏱️] Sending POST /tests/start API request...`);
      const { testInstanceId } = await testService.startTest(testId);
      const elapsed = Date.now() - t0;
      console.log(`[CLIENT-LAUNCH ⚡✅] Received testInstanceId (${testInstanceId}) in ${elapsed}ms! Navigating to execution UI...`);
      router.push(`/candidate/tests/${testInstanceId}/execution`);
    } catch (err) {
      console.error(`[CLIENT-LAUNCH ❌] Failed to start assessment:`, err);
      // The API client automatically shows a toast for this error.
      // We just need to reset the loading state.
      setIsStarting(false);
    }
  };

  return (
    <div className='flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20'>
      <div className='border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-10'>
        <div className='container max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button
                variant='ghost'
                size='icon'
                asChild
                className='shrink-0 hover:bg-muted/80 rounded-full transition-colors'
              >
                <Link
                  href={
                    isResume ? '/candidate/dashboard' : `/candidate/tests/${testId}/instructions`
                  }
                >
                  <ChevronLeft className='size-5' />
                </Link>
              </Button>
              <h1 className='text-xl sm:text-2xl font-heading font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
                {isResume ? 'Resume Assessment' : 'Launch Assessment'}
              </h1>
            </div>

            {/* Status indicator in header */}
            <div className='hidden sm:flex items-center gap-2'>
              <span className='text-sm font-medium text-muted-foreground'>System Status:</span>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold ${isSystemReady ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}
              >
                {isSystemReady ? 'Ready to Begin' : 'Checks Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className='flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 mt-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        {/* Warning / Ready Banner */}
        {!isSystemReady ? (
          <div className='p-4 sm:p-5 border border-amber-500/30 bg-amber-500/10 rounded-2xl flex items-start sm:items-center gap-4 shadow-sm relative overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent' />
            <div className='bg-amber-500/20 p-2 rounded-full shrink-0 relative'>
              <AlertCircle className='size-5 text-amber-600 dark:text-amber-400' />
            </div>
            <div className='relative'>
              <h3 className='text-sm font-bold text-amber-800 dark:text-amber-300 mb-0.5'>
                Action Required
              </h3>
              <p className='text-sm font-medium text-amber-700/90 dark:text-amber-400/90'>
                {isResume
                  ? 'Please verify system readiness before resuming your assessment session. Ensure camera face detection and active microphone are operational.'
                  : 'Please ensure all system checks pass (including camera face detection and active microphone) before starting.'}
              </p>
            </div>
          </div>
        ) : (
          <div className='p-4 sm:p-5 border border-green-500/30 bg-green-500/10 rounded-2xl flex items-start sm:items-center gap-4 shadow-sm relative overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent' />
            <div className='bg-green-500/20 p-2 rounded-full shrink-0 relative'>
              <Play className='size-5 text-green-600 dark:text-green-400' />
            </div>
            <div className='relative'>
              <h3 className='text-sm font-bold text-green-800 dark:text-green-300 mb-0.5'>
                All Systems Go
              </h3>
              <p className='text-sm font-medium text-green-700/90 dark:text-green-400/90'>
                {isResume
                  ? 'Your hardware is verified and ready. You may resume your assessment session whenever you are ready.'
                  : "Your hardware is verified. You may begin the assessment whenever you're ready."}
              </p>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative'>
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
        <div className='flex justify-center pt-8 mt-12'>
          <div className={`relative group ${!isSystemReady ? 'cursor-not-allowed' : ''}`}>
            {isSystemReady && !isStarting && (
              <div className='absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500'></div>
            )}
            <Button
              onClick={handleStartAssessment}
              disabled={!isSystemReady || isStarting}
              size='lg'
              className={`relative w-full sm:w-auto px-10 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all rounded-xl overflow-hidden ${
                isSystemReady
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0'
                  : 'bg-muted text-muted-foreground border-2 border-dashed border-border'
              }`}
            >
              {isStarting ? (
                <span className='flex items-center gap-3'>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  {isResume ? 'Resuming Secure Session...' : 'Starting Secure Session...'}
                </span>
              ) : (
                <span className='flex items-center gap-3'>
                  {!isSystemReady
                    ? 'Hardware Checks Pending'
                    : isResume
                      ? 'Resume Assessment'
                      : 'Start Assessment'}
                  {isSystemReady && <Play className='size-6 fill-current animate-pulse' />}
                </span>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
