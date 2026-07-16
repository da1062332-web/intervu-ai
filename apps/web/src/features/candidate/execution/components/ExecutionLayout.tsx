'use client';

import { ExecutionHeader } from './ExecutionHeader';
import { QuestionRenderer } from './QuestionRenderer';
import { QuestionPalette } from './QuestionPalette';
import { ProgressTracker } from './ProgressTracker';
import { NavigationControls } from './NavigationControls';
import { ResumeBanner } from './ResumeBanner';
import { SubmissionModal } from './SubmissionModal';
import { SectionTabs } from './SectionTabs';
import { FullscreenOverlay } from './FullscreenOverlay';
import { TabWarningModal } from './TabWarningModal';
import { SectionChangeModal } from './SectionChangeModal';
import { FaceTracker } from './FaceTracker';
import { useExecutionStore } from '../stores/execution.store';
import { useSubmission } from '../hooks/useSubmission';
import { useAutosave } from '../hooks/useAutosave';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { useResume } from '../hooks/useResume';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAnswerPersistence } from '../hooks/useAnswerPersistence';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { useSectionTimer } from '../hooks/useSectionTimer';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ExecutionLayout() {
  const { testInstance, currentSectionIndex } = useExecutionStore();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Initialize day 4 hooks
  useConnectionMonitor();
  // Removed useResume to always start from beginning
  useAutosave(testInstance?.id || 'unknown');
  useAnswerPersistence(testInstance?.id || 'unknown');
  useCheckpoint(testInstance?.id || '');
  // Section timer (Feature 6 & 8) – auto-advances section when timer expires
  useSectionTimer(testInstance?.id);

  const { submitAssessment } = useSubmission(testInstance?.id || '');

  const handleSubmit = useCallback(() => setIsSubmitModalOpen(true), []);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onSubmit: handleSubmit,
  });

  // Prevent copy, cut, paste
  const handleCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className='min-h-screen bg-background flex flex-col relative select-none'
      onCopy={handleCopyPaste}
      onCut={handleCopyPaste}
      onPaste={handleCopyPaste}
    >
      <FullscreenOverlay />
      <TabWarningModal />
      <ExecutionHeader />

      <main className='flex-1 container max-w-[1600px] mx-auto px-0 md:px-0 py-6 md:py-6 pb-24 select-text'>
        <div className='grid grid-cols-1 lg:grid-cols-10 gap-6 h-full items-start'>
          {/* Left + Center Columns - Question & Resources */}
          <div className='lg:col-span-8 flex flex-col'>
            <SectionTabs />
            <div className='flex-1 mt-4 relative overflow-hidden'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentSectionIndex}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='h-full'
                >
                  <QuestionRenderer />
                </motion.div>
              </AnimatePresence>
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
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right Column - Palette & Progress (Desktop Only) */}
          <div className='hidden lg:flex lg:col-span-2 flex-col gap-3 lg:sticky lg:top-[88px]'>
            <FaceTracker onSubmit={() => submitAssessment({ autoSubmit: true })} />
            <QuestionPalette />
          </div>
        </div>
      </main>

      {/* Sticky Footer for Navigation */}
      <footer className='fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg p-4'>
        <div className='container max-w-[1600px] mx-auto flex justify-between items-center'>
          <NavigationControls onSubmitClick={handleSubmit} />
        </div>
      </footer>

      {testInstance && (
        <>
          <SubmissionModal
            isOpen={isSubmitModalOpen}
            onClose={() => setIsSubmitModalOpen(false)}
            testId={testInstance.id}
          />
          <SectionChangeModal />
        </>
      )}
    </div>
  );
}
