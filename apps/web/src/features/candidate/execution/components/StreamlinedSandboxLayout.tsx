'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronRight, ChevronLeft, Layout, LayoutGrid, Bookmark, RefreshCw } from 'lucide-react';
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
import { StreamlinedQuestionRenderer } from './StreamlinedQuestionRenderer';
import { SectionTabs } from './SectionTabs';
import { BrandLogo } from '@/components/ui/brand-logo';

export interface SandboxLayoutProps {
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function StreamlinedSandboxLayout(props: SandboxLayoutProps) {
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

  // Force light mode
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

  // Compute section and palette boundaries
  const { startIndex, endIndex, currentSectionTitle } = useMemo(() => {
    let start = 0;
    let end = questions.length;
    let title = 'General';
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

  const answeredCount = visiblePalette.filter((_, idx) => {
    const ans = answers[questions[startIndex + idx]?.id];
    const hasAns = !!(ans?.selectedOptionId || (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) || ans?.textResponse);
    return hasAns && ans?.status !== 'MARKED_FOR_REVIEW';
  }).length;

  const notAnsweredCount = visiblePalette.filter((status, idx) => {
    const ans = answers[questions[startIndex + idx]?.id];
    const hasAns = !!(ans?.selectedOptionId || (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) || ans?.textResponse);
    return !hasAns && (startIndex + idx <= currentQuestionIndex || status === 'CURRENT') && ans?.status !== 'MARKED_FOR_REVIEW';
  }).length;

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
      className='flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans'
      onCopy={handleCopyPaste}
      onCut={handleCopyPaste}
      onPaste={handleCopyPaste}
      style={isInteractionBlocked || isSubmitting ? { pointerEvents: 'none' } : undefined}
    >
      {isSubmitting && (
        <div className='fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200'>
          <div className='w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-5 shadow-lg' />
          <h2 className='text-2xl font-bold tracking-tight'>Assessment Submitted</h2>
          <p className='text-slate-300 text-sm mt-2 max-w-sm'>
            Your answers have been securely submitted. Finalizing evaluation and redirecting to results...
          </p>
        </div>
      )}

      <FullscreenOverlay />
      <TabWarningModal />

      {/* Top Header */}
      <header className='h-20 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm pr-6 shrink-0'>
        <div className='flex items-center h-full'>
          <div className='h-full bg-[#161439] flex items-center px-6 rounded-br-3xl'>
            <BrandLogo logoClassName='w-8 h-8' textClassName='text-white text-xl truncate max-w-[200px]' />
          </div>
          <div className='ml-6 hidden md:block max-w-xl'>
            <h2 className='text-lg font-bold text-slate-900 truncate'>
              {testInstance?.assessmentName || 'Placement Assessment'}
            </h2>
            <p className='text-sm text-slate-500 font-medium truncate'>
              Assessment • Section: {currentSectionTitle}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0'>
            <FaceTracker onSubmit={() => submitAssessment({ autoSubmit: true })} />
          </div>
          <div className='flex flex-col items-center justify-center bg-amber-100 border border-amber-200 px-4 py-1.5 rounded-xl min-w-[120px]'>
            <span className='text-[10px] font-bold text-amber-800 uppercase tracking-widest'>Time Left</span>
            <div className='flex items-center gap-1.5 text-slate-900 font-bold text-lg font-mono tracking-tight'>
              <Clock className='w-4 h-4' />
              <TimerWidget />
            </div>
          </div>
          <Button
            size='sm'
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='bg-[#4939a3] hover:bg-[#3c2f86] text-white font-medium px-4 ml-2'
          >
            Submit
          </Button>
        </div>
      </header>

      {/* Section Tabs (Same as default as requested) */}
      <div className='px-4 md:px-6 pt-4'>
        <SectionTabs />
      </div>

      {/* Main Content Area */}
      <main className='flex-1 w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-4 lg:gap-6 min-h-0 overflow-hidden'>
        
        {/* Left + Middle Area (handled by StreamlinedQuestionRenderer) */}
        <div className='flex-1 flex flex-col min-w-0 min-h-[500px] md:min-h-0'>
          <div className='flex-1 flex overflow-hidden'>
            <StreamlinedQuestionRenderer />
          </div>

          {/* Navigation Footer */}
          <div className='flex items-center justify-between pt-4 mt-2 shrink-0'>
            <Button 
              variant='outline' 
              className='gap-2 bg-white text-slate-700 hover:bg-slate-50 border-slate-300 rounded-lg h-11 px-5 font-semibold'
              onClick={goPrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className='w-4 h-4' /> Previous
            </Button>
            
            <div className='flex items-center gap-3'>
              <Button 
                variant='outline' 
                className='gap-2 bg-[#f1edfc] text-[#4939a3] hover:bg-[#e4dcfb] border-transparent rounded-lg h-11 px-5 font-semibold'
                onClick={() => currentQuestion && toggleReview(currentQuestion.id)}
              >
                <Bookmark className='w-4 h-4' /> Mark for Review & Next
              </Button>
              <Button 
                variant='outline' 
                className='gap-2 bg-slate-200 text-slate-700 hover:bg-slate-300 border-transparent rounded-lg h-11 px-5 font-semibold'
                onClick={handleClearResponse}
              >
                <RefreshCw className='w-4 h-4' /> Clear Response
              </Button>
            </div>

            <Button 
              className='bg-[#4939a3] hover:bg-[#3c2f86] text-white gap-2 rounded-lg h-11 px-8 font-semibold'
              onClick={handleNextAction}
            >
              {isLastQuestionOverall ? 'Save & Finish' : 'Save & Next'} <ChevronRight className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Right Section: Palette (Fixed Width) */}
        <div className='w-full md:w-[320px] lg:w-[350px] shrink-0 flex flex-col'>
          <div className='bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-full overflow-hidden'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-sm font-bold text-slate-800 font-sans'>
                Questions
              </h3>
              <LayoutGrid className='w-4 h-4 text-slate-400' />
            </div>

            {/* Legend */}
            <div className='grid grid-cols-2 gap-y-4 gap-x-2 mb-6 text-[11px] font-semibold text-slate-600'>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 rounded-full bg-[#6be0b3]' /> Answered
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 rounded-full bg-white border border-[#4939a3] relative flex items-center justify-center'>
                  <Bookmark className='w-2.5 h-2.5 text-[#4939a3] fill-current' />
                </span> Marked
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 rounded-full bg-[#e2e8f0]' /> Not Visited
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 rounded-full bg-[#fecaca]' /> Not Answered
              </div>
            </div>

            {/* Grid */}
            <div className='grid grid-cols-5 gap-2.5 overflow-y-auto custom-scrollbar pr-2 pb-2'>
              {visiblePalette.map((status, idx) => {
                const absIdx = startIndex + idx;
                const isCurrent = absIdx === currentQuestionIndex;
                const ans = answers[questions[absIdx]?.id];
                const hasAns = !!(ans?.selectedOptionId || (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) || ans?.textResponse);
                
                let btnClass = 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300';
                let indicator = null;

                if (hasAns) {
                  btnClass = 'bg-[#6be0b3] border-[#6be0b3] text-white';
                } else if (status === 'CURRENT' || ans?.status === 'UNANSWERED' || (ans && !hasAns)) {
                  btnClass = 'bg-white border-[#fca5a5] text-[#dc2626]'; // Visited/Current but not answered
                }

                if (isCurrent) {
                  btnClass += ' ring-2 ring-slate-400 ring-offset-1';
                }

                if (status === 'MARKED_FOR_REVIEW' || ans?.status === 'MARKED_FOR_REVIEW') {
                  btnClass = 'bg-white border-[#4939a3] text-[#4939a3] relative';
                  indicator = <Bookmark className='absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-[#4939a3] fill-[#4939a3] bg-white rounded-full' />;
                }

                return (
                  <button
                    key={absIdx}
                    onClick={() => jumpToQuestion(absIdx)}
                    className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center transition-all relative ${btnClass}`}
                  >
                    {idx + 1}
                    {indicator}
                  </button>
                );
              })}
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
