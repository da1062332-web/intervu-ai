'use client';

import { ReactNode, useState, useCallback, useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { useSubmission } from '../hooks/useSubmission';
import { useAutosave } from '../hooks/useAutosave';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { useResume } from '../hooks/useResume';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAnswerPersistence } from '../hooks/useAnswerPersistence';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { useSectionTimer } from '../hooks/useSectionTimer';

import { SubmissionModal } from './SubmissionModal';
import { FullscreenOverlay } from './FullscreenOverlay';
import { TabWarningModal } from './TabWarningModal';
import { SectionChangeModal } from './SectionChangeModal';
import { FloatingScratchPad } from '@/components/candidate/sandbox/FloatingScratchPad';
import { FloatingCalculator } from '@/components/candidate/sandbox/FloatingCalculator';

interface ExecutionRuntimeProps {
  children: (props: {
    onSubmit: () => void;
    isSubmitting: boolean;
  }) => ReactNode;
}

export function ExecutionRuntime({ children }: ExecutionRuntimeProps) {
  const { testInstance, isInteractionBlocked, submissionStatus } = useExecutionStore();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Force light mode on sandbox/execution viewport to ensure readability
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    if (isDark) {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    const originalColorScheme = root.style.colorScheme;
    root.style.colorScheme = 'light';

    return () => {
      if (isDark) {
        root.classList.remove('light');
        root.classList.add('dark');
      }
      root.style.colorScheme = originalColorScheme;
    };
  }, []);

  // Initialize runtime hooks
  useConnectionMonitor();
  useResume(testInstance?.id || '');
  useAutosave(testInstance?.id || 'unknown');
  useAnswerPersistence(testInstance?.id || 'unknown');
  useCheckpoint(testInstance?.id || '');
  useSectionTimer(testInstance?.id);

  useSubmission(testInstance?.id || '');

  const handleSubmit = useCallback(() => setIsSubmitModalOpen(true), []);

  useKeyboardShortcuts({
    onSubmit: handleSubmit,
    disabled: isInteractionBlocked || submissionStatus === 'SUBMITTING' || submissionStatus === 'SUCCESS',
  });

  const handleCopyPaste = (e: React.ClipboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isEditable =
      target?.closest?.('.monaco-editor, textarea, input, [contenteditable="true"]') !== null;

    if (isEditable) {
      return;
    }
    e.preventDefault();
  };

  const isSubmitting = submissionStatus === 'SUBMITTING' || submissionStatus === 'SUCCESS';

  return (
    <div
      className='min-h-screen lg:h-screen bg-[#f1f5f9] lg:flex lg:flex-col lg:overflow-hidden relative select-none font-sans'
      onCopy={handleCopyPaste}
      onCut={handleCopyPaste}
      onPaste={handleCopyPaste}
      style={isInteractionBlocked || isSubmitting ? { pointerEvents: 'none' } : undefined}
    >
      {/* Full-Screen Submission Overlay */}
      {isSubmitting && (
        <div className='fixed inset-0 z-100 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200'>
          <div className='w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-5 shadow-lg' />
          <h2 className='text-2xl font-bold tracking-tight'>Assessment Submitted</h2>
          <p className='text-slate-300 text-sm mt-2 max-w-sm'>
            Your answers have been securely submitted. Finalizing evaluation and redirecting to results...
          </p>
        </div>
      )}

      {/* Shared Modals and Overlays */}
      <FullscreenOverlay />
      <TabWarningModal />

      {/* Render the specific Sandbox UI */}
      {children({ onSubmit: handleSubmit, isSubmitting })}

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
