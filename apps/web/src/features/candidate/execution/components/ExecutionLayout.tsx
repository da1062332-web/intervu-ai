'use client';

import { ExecutionHeader } from './ExecutionHeader';
import { QuestionRenderer } from './QuestionRenderer';
import { QuestionPalette } from './QuestionPalette';
import { ProgressTracker } from './ProgressTracker';
import { NavigationControls } from './NavigationControls';
import { ResumeBanner } from './ResumeBanner';
import { SubmissionModal } from './SubmissionModal';
import { SectionTabs } from './SectionTabs';
import { useExecutionStore } from '../stores/execution.store';
import { useAutosave } from '../hooks/useAutosave';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { useResume } from '../hooks/useResume';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAnswerPersistence } from '../hooks/useAnswerPersistence';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LayoutGrid } from 'lucide-react';

export function ExecutionLayout() {
  const { testInstance } = useExecutionStore();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Initialize day 4 hooks
  useConnectionMonitor();
  useResume(testInstance?.id);
  useAutosave(testInstance?.id || 'unknown');
  useAnswerPersistence(testInstance?.id || 'unknown');

  const handleSubmit = useCallback(() => setIsSubmitModalOpen(true), []);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onSubmit: handleSubmit,
  });

  return (
    <div className='min-h-screen bg-background flex flex-col relative'>
      <ResumeBanner />
      <ExecutionHeader />

      <main className='flex-1 container max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start'>
          {/* Left Column - Question & Navigation */}
          <div className='lg:col-span-8 flex flex-col min-h-[500px]'>
            <SectionTabs />
            <div className='flex-1'>
              <QuestionRenderer />
            </div>
            <div className='mt-6 md:mt-8'>
              <NavigationControls onSubmitClick={handleSubmit} />
            </div>
          </div>

          {/* Mobile Drawer Trigger (Only visible on < lg screens) */}
          <div className='lg:hidden flex items-center justify-between mb-4 px-1'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='outline' size='sm' className='w-full border-dashed'>
                  <LayoutGrid className='mr-2 size-4' />
                  Open Question Palette
                </Button>
              </SheetTrigger>
              <SheetContent side='right' className='w-full sm:w-[400px] overflow-y-auto p-6'>
                <SheetHeader className='mb-6 px-0'>
                  <SheetTitle>Assessment Overview</SheetTitle>
                  <SheetDescription>Track your progress and navigate questions.</SheetDescription>
                </SheetHeader>
                <div className='flex flex-col gap-6'>
                  <QuestionPalette />
                  <div className='border rounded-xl p-6'>
                    <ProgressTracker />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right Column - Palette & Progress (Desktop Only) */}
          <div className='hidden lg:flex lg:col-span-4 flex-col gap-6 lg:sticky lg:top-[88px]'>
            <QuestionPalette />

            <div className='border rounded-xl p-6 md:shadow-sm'>
              <ProgressTracker />
            </div>
          </div>
        </div>
      </main>

      {testInstance && (
        <SubmissionModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          testId={testInstance.id}
        />
      )}
    </div>
  );
}
