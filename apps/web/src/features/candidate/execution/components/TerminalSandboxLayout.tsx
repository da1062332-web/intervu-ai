'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Code2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useExecutionStore } from '../stores/execution.store';
import { useSubmission } from '../hooks/useSubmission';
import { useAutosave } from '../hooks/useAutosave';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { useResume } from '../hooks/useResume';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAnswerPersistence } from '../hooks/useAnswerPersistence';
import { useCheckpoint } from '../hooks/useCheckpoint';
import { useSectionTimer } from '../hooks/useSectionTimer';
import { FullscreenOverlay } from './FullscreenOverlay';
import { TabWarningModal } from './TabWarningModal';
import { SubmissionModal } from './SubmissionModal';
import { SectionChangeModal } from './SectionChangeModal';
import { FloatingScratchPad } from '@/components/candidate/sandbox/FloatingScratchPad';
import { FloatingCalculator } from '@/components/candidate/sandbox/FloatingCalculator';
import { FaceTracker } from './FaceTracker';
import { TimerWidget } from './TimerWidget';
import { TerminalQuestionRenderer } from './TerminalQuestionRenderer';

export interface SandboxLayoutProps {
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function TerminalSandboxLayout(props: SandboxLayoutProps) {
  const {
    testInstance,
    isInteractionBlocked,
    submissionStatus,
    questions,
    palette,
    currentQuestionIndex,
    currentSectionIndex,
    jumpToQuestion,
    answers,
    goNext,
    goPrevious,
    requestNextSection,
    currentQuestion,
    saveAnswer,
    toggleReview,
  } = useExecutionStore();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    saveAnswer(currentQuestion.id, {
      selectedOptionId: undefined,
      selectedOptionIds: [],
      textResponse: '',
    });
  };

  // Force dark mode for terminal
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    const originalColorScheme = root.style.colorScheme;
    root.style.colorScheme = 'dark';
    return () => {
      root.classList.remove('dark');
      root.classList.add('light'); // default back to light
      root.style.colorScheme = originalColorScheme;
    };
  }, []);

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
    disabled: isInteractionBlocked || submissionStatus === 'SUBMITTING' || submissionStatus === 'SUCCESS',
  });

  const handleCopyPaste = (e: React.ClipboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isEditable = target?.closest?.('.monaco-editor, textarea, input, [contenteditable="true"]') !== null;
    if (isEditable) return;
    e.preventDefault();
  };

  const isSubmitting = submissionStatus === 'SUBMITTING' || submissionStatus === 'SUCCESS';

  const { startIndex, endIndex, currentSectionTitle } = useMemo(() => {
    let start = 0;
    let end = questions.length;
    let title = 'Terminal Section';
    let secIdx = typeof currentSectionIndex === 'number' ? currentSectionIndex : 0;

    if (testInstance?.sections && testInstance.sections.length > 0) {
      if (secIdx >= testInstance.sections.length || secIdx < 0) secIdx = 0;
      let runningCount = 0;
      for (let i = 0; i < testInstance.sections.length; i++) {
        const section = testInstance.sections[i];
        const sectionLength = section.questions.length;
        if (i === secIdx) {
          start = runningCount;
          end = runningCount + sectionLength;
          title = section.title || (section as any).sectionName || `Section ${i + 1}`;
          break;
        }
        runningCount += sectionLength;
      }
    }
    return { startIndex: start, endIndex: end, currentSectionTitle: title };
  }, [testInstance, currentSectionIndex, questions.length]);

  const visiblePalette = palette.slice(startIndex, endIndex);
  const totalQuestions = questions.length;
  const isLastQuestionOverall = currentQuestionIndex === totalQuestions - 1;

  const handleNextAction = () => {
    if (currentQuestionIndex === endIndex - 1 && !isLastQuestionOverall) {
      requestNextSection();
    } else {
      goNext();
    }
  };

  return (
    <div 
      className='flex flex-col min-h-screen bg-[#0d1117] text-slate-200 font-mono'
      onCopy={handleCopyPaste}
      onCut={handleCopyPaste}
      onPaste={handleCopyPaste}
      style={isInteractionBlocked || isSubmitting ? { pointerEvents: 'none' } : undefined}
    >
      {isSubmitting && (
        <div className='fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200'>
          <div className='w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-5 shadow-lg' />
          <h2 className='text-2xl font-bold tracking-tight font-sans'>Evaluating Submission</h2>
          <p className='text-slate-400 text-sm mt-2 max-w-sm font-sans'>
            Compiling results and securely finalizing assessment...
          </p>
        </div>
      )}

      <FullscreenOverlay />
      <TabWarningModal />

      {/* Top Navigation */}
      <header className='h-14 bg-[#161b22] border-b border-slate-800 px-6 flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center overflow-hidden'>
            <FaceTracker onSubmit={() => submitAssessment({ autoSubmit: true })} />
          </div>
          <div>
            <h1 className='text-xs font-bold text-slate-200 tracking-wider uppercase'>
              Terminal CBT
            </h1>
            <span className='text-[11px] text-emerald-400'>
              Terminal IDE Layout
            </span>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 bg-slate-900 border border-slate-700/60 px-3 py-1 rounded text-xs text-emerald-400'>
            <Clock className='w-3.5 h-3.5' />
            <TimerWidget />
          </div>
          <Button
            size='sm'
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-8 px-4'
          >
            {isSubmitting ? 'Evaluating...' : 'Submit & Exit'}
          </Button>
        </div>
      </header>

      {/* Main IDE Layout */}
      <main className='flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800'>
        {/* Left Pane: Question Palette & Navigation */}
        <div className='lg:w-64 flex flex-col bg-[#161b22] shrink-0'>
          <div className='p-4 border-b border-slate-800'>
            <h3 className='text-xs font-bold uppercase tracking-wider text-slate-500 mb-3'>
              {currentSectionTitle}
            </h3>
            <div className='flex flex-wrap gap-2'>
              {visiblePalette.map((status, idx) => {
                const absIdx = startIndex + idx;
                const isCurrent = absIdx === currentQuestionIndex;
                const ans = answers[questions[absIdx]?.id];
                const hasAns = !!(ans?.selectedOptionId || (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) || ans?.textResponse);
                
                let btnClass = 'bg-[#0d1117] text-slate-400 border border-slate-800 hover:border-slate-600';
                if (isCurrent) {
                  btnClass = 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50';
                } else if (status === 'MARKED_FOR_REVIEW' || ans?.status === 'MARKED_FOR_REVIEW') {
                  btnClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/50';
                } else if (hasAns) {
                  btnClass = 'bg-slate-800 text-slate-300 border border-slate-600';
                }

                return (
                  <button
                    key={absIdx}
                    onClick={() => jumpToQuestion(absIdx)}
                    className={`w-8 h-8 rounded text-[11px] font-bold flex items-center justify-center transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className='mt-auto p-4 flex flex-col gap-2 border-t border-slate-800'>
            <div className='flex gap-2'>
              <Button 
                variant='outline' 
                className='flex-1 bg-[#0d1117] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs h-8'
                onClick={goPrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className='w-4 h-4 mr-1' /> Prev
              </Button>
              <Button 
                className='flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-8'
                onClick={handleNextAction}
              >
                Next <ChevronRight className='w-4 h-4 ml-1' />
              </Button>
            </div>
            <div className='flex gap-2'>
              <Button 
                variant='outline' 
                className='flex-1 bg-[#0d1117] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs h-8'
                onClick={handleClearResponse}
              >
                Clear
              </Button>
              <Button 
                variant='outline' 
                className='flex-1 bg-[#0d1117] border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 text-xs h-8'
                onClick={() => currentQuestion && toggleReview(currentQuestion.id)}
              >
                Review
              </Button>
            </div>
          </div>
        </div>

        {/* Right Pane: Question Renderer */}
        <div className='flex-1 flex flex-col bg-[#090d13] overflow-hidden min-h-[500px]'>
          <TerminalQuestionRenderer />
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
