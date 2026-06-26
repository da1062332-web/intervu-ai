'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInstructions } from '../hooks/useInstructions';
import { useDashboardStore } from '../stores/dashboard.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ArrowRight, BookOpen, Navigation, Laptop, CheckSquare } from 'lucide-react';
import { InstructionsSkeleton } from '@/features/candidate/tests/components/TestDiscoveryLoaders';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';

interface TestInstructionsPageProps {
  testId: string;
}

export function TestInstructionsPage({ testId }: TestInstructionsPageProps) {
  const router = useRouter();
  const { data: config, isLoading, error, refetch } = useInstructions(testId);
  const { acceptedInstructions, acceptInstructions } = useDashboardStore();

  const [hasHydrated, setHasHydrated] = useState(false);

  // Sync hydration for store
  useEffect(() => {
    useDashboardStore.persist.rehydrate();
    setHasHydrated(true);
  }, []);

  const isAccepted = hasHydrated ? !!acceptedInstructions[testId] : false;

  const handleCheckboxChange = (checked: boolean) => {
    acceptInstructions(testId, checked);
  };

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
        error={new Error(error || 'Failed to load test instructions')}
        reset={refetch}
      />
    );
  }

  return (
    <div className='flex flex-col min-h-screen pb-20'>
      <div className='border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
        <div className='container max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              asChild
              className='shrink-0 hover:bg-muted/50 rounded-xl transition-colors'
            >
              <Link href={`/candidate/tests/${testId}`}>
                <ChevronLeft className='size-5' />
              </Link>
            </Button>
            <h1 className='text-xl font-heading font-semibold tracking-tight text-foreground'>
              Test Instructions
            </h1>
          </div>
        </div>
      </div>

      <main className='flex-1 container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <div className='mb-6' data-testid='test-instructions-header'>
          <h2 className='text-2xl font-bold tracking-tight text-foreground'>
            Assessment Instructions
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Please read the following instructions carefully.
          </p>
        </div>
        <div className='space-y-6'>
          {/* Assessment Rules */}
          <Card className='glass-card border border-border/60 shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
                <BookOpen className='size-5 text-indigo-500' />
                Assessment Rules
              </CardTitle>
              <CardDescription>Ground rules for taking the online proctored exam</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2.5'>
                {config.assessmentRules.map((rule: string, idx: number) => (
                  <li
                    key={idx}
                    className='text-sm text-muted-foreground flex items-start gap-2 leading-relaxed'
                  >
                    <span className='size-1.5 rounded-full bg-indigo-500 shrink-0 mt-2' />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Navigation Rules */}
          <Card className='glass-card border border-border/60 shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
                <Navigation className='size-5 text-indigo-500' />
                Navigation Rules
              </CardTitle>
              <CardDescription>Rules on moving between questions and sections</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2.5'>
                {config.navigationRules.map((rule: string, idx: number) => (
                  <li
                    key={idx}
                    className='text-sm text-muted-foreground flex items-start gap-2 leading-relaxed'
                  >
                    <span className='size-1.5 rounded-full bg-indigo-500 shrink-0 mt-2' />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Timer and Submission Rules */}
          <Card className='glass-card border border-border/60 shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
                <Laptop className='size-5 text-indigo-500' />
                Timer & Submission Rules
              </CardTitle>
              <CardDescription>Details about time limits and submission procedures</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2.5'>
                {[...config.timerRules, ...config.submissionRules].map(
                  (rule: string, idx: number) => (
                    <li
                      key={idx}
                      className='text-sm text-muted-foreground flex items-start gap-2 leading-relaxed'
                    >
                      <span className='size-1.5 rounded-full bg-indigo-500 shrink-0 mt-2' />
                      <span>{rule}</span>
                    </li>
                  ),
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Declaration and Agreement Checkbox */}
        <div className='p-5 border border-border/60 bg-muted/20 rounded-2xl flex items-start gap-3.5'>
          <Checkbox
            id='terms-accept'
            checked={isAccepted}
            onCheckedChange={(checked: boolean | 'indeterminate') =>
              handleCheckboxChange(checked === true)
            }
            className='mt-1 text-primary border-muted-foreground size-5 rounded'
          />
          <label
            htmlFor='terms-accept'
            className='text-sm font-medium leading-relaxed text-muted-foreground cursor-pointer select-none'
          >
            I have read and understood all the instructions listed above. I agree that I will abide
            by the rules during the assessment, and I consent to screen sharing, camera recording,
            and focus tracking monitoring.
          </label>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end pt-6 border-t border-border/40'>
          <Button
            onClick={() => router.push(`/candidate/tests/${testId}/launch`)}
            disabled={!isAccepted}
            size='lg'
            className='px-8 shadow-md hover:shadow-lg transition-shadow'
          >
            Proceed to System Check <ArrowRight className='ml-2 size-4' />
          </Button>
        </div>
      </main>
    </div>
  );
}
