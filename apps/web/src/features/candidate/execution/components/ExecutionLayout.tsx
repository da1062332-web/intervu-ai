'use client';

import { ExecutionHeader } from './ExecutionHeader';
import { QuestionRenderer } from './QuestionRenderer';
import { QuestionPalette } from './QuestionPalette';
import { NavigationControls } from './NavigationControls';
import { SubmissionModal } from './SubmissionModal';
import { SectionTabs } from './SectionTabs';
import { FullscreenOverlay } from './FullscreenOverlay';
import { TabWarningModal } from './TabWarningModal';
import { SectionChangeModal } from './SectionChangeModal';
import { FaceTracker } from './FaceTracker';
import { TimerWidget } from './TimerWidget';
import { useExecutionStore } from '../stores/execution.store';
import { useSubmission } from '../hooks/useSubmission';
import { useAutosave } from '../hooks/useAutosave';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { useResume } from '../hooks/useResume';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAnswerPersistence } from '../hooks/useAnswerPersistence';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { useSectionTimer } from '../hooks/useSectionTimer';
import { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LayoutGrid } from 'lucide-react';
import { FloatingToolbar } from '@/components/candidate/sandbox/FloatingToolbar';
import { FloatingScratchPad } from '@/components/candidate/sandbox/FloatingScratchPad';
import { FloatingCalculator } from '@/components/candidate/sandbox/FloatingCalculator';

export function ExecutionLayout() {
  const { testInstance, isInteractionBlocked } = useExecutionStore();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Initialize day 4 hooks
  useConnectionMonitor();
  useResume(testInstance?.id || '');
  useAutosave(testInstance?.id || 'unknown');
  useAnswerPersistence(testInstance?.id || 'unknown');
  useCheckpoint(testInstance?.id || '');
  useSectionTimer(testInstance?.id);

  const { submitAssessment } = useSubmission(testInstance?.id || '');

  const handleSubmit = useCallback(() => setIsSubmitModalOpen(true), []);

  useKeyboardShortcuts({
    onSubmit: handleSubmit,
    disabled: isInteractionBlocked,
  });

  const handleCopyPaste = (e: React.ClipboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isEditable =
      target?.closest?.('.monaco-editor, textarea, input, [contenteditable="true"]') !== null;

    if (isEditable) {
      // Allow copy, cut, and paste inside embedded compiler and text inputs
      return;
    }

    e.preventDefault();
  };

  return (
    <div
      className='min-h-screen lg:h-screen bg-[#f1f5f9] lg:flex lg:flex-col lg:overflow-hidden relative select-none font-sans'
      onCopy={handleCopyPaste}
      onCut={handleCopyPaste}
      onPaste={handleCopyPaste}
      style={isInteractionBlocked ? { pointerEvents: 'none' } : undefined}
    >
      <FullscreenOverlay />
      <TabWarningModal />

      {/* Green Header Banner (with integrated sync status) */}
      <ExecutionHeader />

      {/* Main Viewport Container */}
      <main className='flex flex-1 lg:h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f3f7fb] w-full select-text'>
        <div className='flex flex-col lg:flex-row w-full h-full overflow-y-auto lg:overflow-hidden'>
          {/* Left Column: Sections Box & Main Question Area */}
          <div className='flex-1 flex flex-col h-full lg:overflow-hidden p-2.5 sm:p-3 min-w-0 bg-[#f3f7fb]'>
            {/* Sections Border Fieldset */}
            <SectionTabs />

            {/* Main Question & Options Container with Fixed Layout Size */}
            <div className='flex flex-1 flex-col overflow-hidden border border-gray-300 rounded-sm bg-white shadow-sm min-h-[460px]'>
              <div className='flex-1 flex flex-col overflow-hidden min-h-0'>
                <QuestionRenderer />
              </div>

              {/* Bottom Action Toolbar inside the Question Box */}
              <div className='border-t border-gray-300 bg-white px-4 py-3 shrink-0 shadow-2xs'>
                <NavigationControls onSubmitClick={handleSubmit} />
              </div>
            </div>
          </div>

          {/* Mobile Drawer Button (< lg screens) */}
          <div className='lg:hidden flex items-center justify-between mx-3 my-2 shrink-0'>
            <Sheet>
              <SheetTrigger asChild>
                <button className='w-full bg-[#d6eafb] hover:bg-[#c2e0f5] text-[#1c3e66] border border-[#96bae0] font-bold text-sm py-2.5 px-4 rounded-sm shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer'>
                  <LayoutGrid className='size-4' />
                  Open Question Palette &amp; Test Info
                </button>
              </SheetTrigger>
              <SheetContent
                side='right'
                className='w-full sm:w-[380px] p-0 bg-[#e3f2fb] overflow-hidden flex flex-col z-[9999]'
              >
                <div className='p-3.5 bg-white border-b border-gray-300 flex items-center justify-between shrink-0'>
                  <div className='flex flex-col items-center w-24 shrink-0'>
                    <div className='w-20 h-20 border border-gray-300 rounded-sm overflow-hidden bg-gray-100 flex items-center justify-center shadow-2xs'>
                      <FaceTracker onSubmit={() => submitAssessment({ autoSubmit: true })} />
                    </div>
                    <span className='text-[9px] text-gray-700 font-bold mt-1 truncate max-w-full text-center'>
                      {testInstance?.candidateName || 'Your photo appears here'}
                    </span>
                  </div>
                  <div className='flex flex-col items-end justify-center flex-1 pl-2 text-right'>
                    <TimerWidget />
                  </div>
                </div>
                {testInstance && <FloatingToolbar assessmentId={testInstance.id} />}
                <div className='flex-1 flex flex-col overflow-hidden'>
                  <QuestionPalette />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right Sidebar: Candidate Photo, Timer & Question Palette (>= lg screens) */}
          <div className='hidden lg:flex flex-col w-[330px] xl:w-[350px] shrink-0 border-l border-gray-300 bg-[#e3f2fb] h-full overflow-hidden select-none z-20'>
            {/* Top White Info Header: Candidate Silhouette & Timer */}
            <div className='bg-white p-3.5 border-b border-gray-300 shrink-0 flex items-center justify-between gap-3 min-h-[110px]'>
              {/* Candidate Photo / Camera Box */}
              <div className='flex flex-col items-center w-28 shrink-0'>
                <div className='w-24 h-24 border border-gray-300 rounded-sm overflow-hidden bg-gray-100 flex items-center justify-center shadow-2xs'>
                  <FaceTracker onSubmit={() => submitAssessment({ autoSubmit: true })} />
                </div>
                <span className='text-[10px] text-gray-700 font-bold mt-1.5 text-center truncate w-full tracking-tight'>
                  {testInstance?.candidateName || 'Your photo appears here'}
                </span>
              </div>

              {/* Timer Display */}
              <div className='flex flex-col items-end justify-center flex-1 pl-1 text-right'>
                <TimerWidget />
              </div>
            </div>

            {/* Productivity Tools Bar (Under Video Camera) */}
            {testInstance && <FloatingToolbar assessmentId={testInstance.id} />}

            {/* Light Blue Question Palette Sidebar */}
            <div className='flex-1 flex flex-col overflow-hidden'>
              <QuestionPalette />
            </div>
          </div>
        </div>
      </main>

      {testInstance && (
        <>
          <FloatingScratchPad />
          <FloatingCalculator />
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
