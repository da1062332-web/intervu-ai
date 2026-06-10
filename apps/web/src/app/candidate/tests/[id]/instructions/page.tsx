'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useInstructions } from '@/features/candidate/tests/hooks/useInstructions';
import { InstructionPanel } from '@/features/candidate/tests/components/InstructionPanel';
import { EligibilityBanner } from '@/features/candidate/tests/components/EligibilityBanner';
import { StartAssessmentButton } from '@/features/candidate/tests/components/StartAssessmentButton';
import { ValidationResponse } from '@/features/candidate/tests/types/test.types';
import { ChevronLeft } from 'lucide-react';
import { InstructionsSkeleton } from '@/features/candidate/tests/components/TestDiscoveryLoaders';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';

export default function InstructionsPage({ params }: { params: Promise<{ id: string }> }) {
  // @ts-expect-error - React.use is not in current types
  const { id: testId } = React.use(params);

  const { data: config, isLoading, error, refetch } = useInstructions(testId);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);

  if (isLoading) {
    return (
      <div className='flex flex-col min-h-screen pb-20'>
        <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
          <div className='container max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='icon' disabled className='shrink-0'>
                <ChevronLeft className='size-5' />
              </Button>
              <h1 className='text-xl font-semibold tracking-tight'>Test Instructions</h1>
            </div>
          </div>
        </div>
        <main className='flex-1 container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 mt-6'>
          <InstructionsSkeleton />
        </main>
      </div>
    );
  }

  if (error || !config) {
    return (
      <TestDiscoveryError
        error={error || new Error('Failed to load instructions')}
        reset={refetch}
      />
    );
  }

  return (
    <div className='flex flex-col min-h-screen pb-20'>
      <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
        <div className='container max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon' asChild className='shrink-0'>
              <Link href={`/candidate/tests/${testId}`}>
                <ChevronLeft className='size-5' />
              </Link>
            </Button>
            <h1 className='text-xl font-semibold tracking-tight'>Test Instructions</h1>
          </div>
        </div>
      </div>

      <main className='flex-1 container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <InstructionPanel config={config} />

        {validation && (
          <div className='mt-6'>
            <EligibilityBanner validation={validation} />
          </div>
        )}

        <div className='flex justify-end pt-6 border-t border-border/40'>
          <StartAssessmentButton testId={testId} onValidationComplete={setValidation} />
        </div>
      </main>
    </div>
  );
}
