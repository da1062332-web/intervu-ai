'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  RotateCcw,
  Terminal,
  Lock,
  LayoutGrid,
  ShieldAlert,
  HelpCircle,
  FileEdit,
  Calculator,
} from 'lucide-react';
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
import { InstructionsModal } from './InstructionsModal';
import { FloatingScratchPad } from '@/components/candidate/sandbox/FloatingScratchPad';
import { FloatingCalculator } from '@/components/candidate/sandbox/FloatingCalculator';
import { useScratchPad } from '@/components/candidate/sandbox/useScratchPad';
import { useCalculator } from '@/components/candidate/sandbox/useCalculator';
import { useSandboxZIndex } from '@/components/candidate/sandbox/useSandboxZIndex';
import { FaceTracker } from './FaceTracker';
import { TimerWidget } from './TimerWidget';
import { TerminalQuestionRenderer } from './TerminalQuestionRenderer';
import { BrandLogo } from '@/components/ui/brand-logo';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
    requestSectionChange,
    lockedSectionKeys,
    sectionTimingEnabled,
    sectionRemainingTime,
    currentQuestion,
    saveAnswer,
    toggleReview,
    connectionStatus,
    autosaveStatus,
    hasUnsavedChanges,
    ping,
    lastSavedAt,
  } = useExecutionStore();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  // ScratchPad and Calculator hooks
  const { initialize: initScratchPad, toggleOpen: toggleScratchPad, isOpen: isScratchOpen } = useScratchPad();
  const { initialize: initCalc, toggleOpen: toggleCalc, isOpen: isCalcOpen } = useCalculator();
  const { bringToFront } = useSandboxZIndex();

  useEffect(() => {
    if (testInstance?.id) {
      initScratchPad(testInstance.id);
      initCalc(testInstance.id);
    }
  }, [testInstance?.id, initScratchPad, initCalc]);

  const handleOpenScratchPad = () => {
    toggleScratchPad();
    if (!isScratchOpen) {
      bringToFront('scratchpad');
    }
  };

  const handleOpenCalc = () => {
    toggleCalc();
    if (!isCalcOpen) {
      bringToFront('calculator');
    }
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    saveAnswer(currentQuestion.id, {
      selectedOptionId: undefined,
      selectedOptionIds: [],
      textResponse: '',
    });
  };

  // Force dark mode for terminal sandbox
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    const originalColorScheme = root.style.colorScheme;
    root.style.colorScheme = 'dark';
    return () => {
      root.classList.remove('dark');
      root.classList.add('light');
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
  const isOffline = connectionStatus === 'OFFLINE';

  const totalSections = testInstance?.sections?.length || 1;

  const {
    startIndex,
    endIndex,
    currentSectionTitle,
    isLastQuestionOfSection,
    isLastSection,
    isFinalAssessmentQuestion,
    isPreviousDisabled,
  } = useMemo(() => {
    let start = 0;
    let end = questions.length;
    let title = 'Section 1';
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

    const lastQOfSec = currentQuestionIndex === end - 1;
    const lastSec = secIdx === totalSections - 1;
    const finalQ = currentQuestionIndex === questions.length - 1 || (lastSec && lastQOfSec);
    const prevDisabled =
      currentQuestionIndex === 0 ||
      (sectionTimingEnabled && currentQuestionIndex === start);

    return {
      startIndex: start,
      endIndex: end,
      currentSectionTitle: title,
      isLastQuestionOfSection: lastQOfSec,
      isLastSection: lastSec,
      isFinalAssessmentQuestion: finalQ,
      isPreviousDisabled: prevDisabled,
    };
  }, [testInstance, currentSectionIndex, questions.length, currentQuestionIndex, totalSections, sectionTimingEnabled]);

  const visiblePalette = palette.slice(startIndex, endIndex);

  // Dynamic next button label based on section & test boundaries
  let nextButtonLabel = 'Save & Next';
  if (isFinalAssessmentQuestion) {
    nextButtonLabel = 'Submit Assessment';
  } else if (isLastQuestionOfSection && !isLastSection) {
    nextButtonLabel = 'Next Section';
  }

  const handleNextAction = () => {
    if (isFinalAssessmentQuestion) {
      handleSubmit();
    } else if (isLastQuestionOfSection && !isLastSection) {
      requestNextSection();
    } else {
      goNext();
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;
    toggleReview(currentQuestion.id);
    if (!isLastQuestionOfSection) {
      goNext();
    }
  };

  // Calculate accurate counts for current section legend
  const answeredCount = visiblePalette.filter((_, idx) => {
    const qId = questions[startIndex + idx]?.id;
    const ans = answers[qId];
    const hasAns = qId
      ? !!(
          ans?.selectedOptionId ||
          (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
          ans?.textResponse
        )
      : false;
    return hasAns && ans?.status !== 'MARKED_FOR_REVIEW';
  }).length;

  const markedCount = visiblePalette.filter((status, idx) => {
    const qId = questions[startIndex + idx]?.id;
    const ans = answers[qId];
    return ans?.status === 'MARKED_FOR_REVIEW' || status === 'MARKED_FOR_REVIEW';
  }).length;

  const notAnsweredCount = visiblePalette.filter((status, idx) => {
    const absIdx = startIndex + idx;
    const qId = questions[absIdx]?.id;
    const ans = answers[qId];
    const hasAns = qId
      ? !!(
          ans?.selectedOptionId ||
          (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
          ans?.textResponse
        )
      : false;
    return (
      !hasAns &&
      (absIdx <= currentQuestionIndex || status === 'CURRENT') &&
      ans?.status !== 'MARKED_FOR_REVIEW'
    );
  }).length;

  const notVisitedCount = Math.max(
    0,
    visiblePalette.length - answeredCount - markedCount - notAnsweredCount,
  );

  const activeSectionIndex =
    typeof currentSectionIndex === 'number' &&
    currentSectionIndex >= 0 &&
    testInstance?.sections &&
    currentSectionIndex < testInstance.sections.length
      ? currentSectionIndex
      : 0;

  const isTimerWarning =
    sectionTimingEnabled && sectionRemainingTime > 0 && sectionRemainingTime <= 60;

  return (
    <div 
      className='flex flex-col min-h-screen bg-[#090d13] text-slate-100 font-sans select-none antialiased'
      onCopy={handleCopyPaste}
      onCut={handleCopyPaste}
      onPaste={handleCopyPaste}
      style={isInteractionBlocked || isSubmitting ? { pointerEvents: 'none' } : undefined}
    >
      {isSubmitting && (
        <div className='fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200'>
          <div className='w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-5 shadow-lg' />
          <h2 className='text-2xl font-bold tracking-tight font-mono text-emerald-400'>[SYS_EXEC: SUBMITTING]</h2>
          <p className='text-slate-400 text-sm mt-2 max-w-sm'>
            Your assessment answers are being evaluated and securely finalized...
          </p>
        </div>
      )}

      <FullscreenOverlay />
      <TabWarningModal />

      {/* Top Terminal Header */}
      <header className='h-16 bg-[#0d1117] border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shadow-md shrink-0'>
        {/* Left: Branding & Assessment Title */}
        <div className='flex items-center gap-4 min-w-0'>
          <div className='flex items-center gap-2.5 bg-[#161b22] px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner shrink-0'>
            <BrandLogo logoClassName='w-6 h-6' textClassName='text-slate-100 text-base font-bold font-mono tracking-tight' />
            <span className='hidden sm:inline-block text-[10px] font-mono font-bold bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded'>
              DEV_IDE
            </span>
          </div>

          <div className='hidden md:flex flex-col min-w-0'>
            <h2 className='text-sm font-bold text-slate-100 truncate font-mono'>
              {testInstance?.assessmentName || 'Assessment'}
            </h2>
            <p className='text-xs text-slate-400 truncate'>
              Active Section: <span className='text-emerald-400 font-semibold'>{currentSectionTitle}</span>
            </p>
          </div>
        </div>

        {/* Right: Sync Status, Face Tracker, Instructions, Timer, Submit */}
        <div className='flex items-center gap-2.5 sm:gap-3 shrink-0'>
          {/* Instructions Modal Button */}
          <Button
            size='sm'
            variant='outline'
            onClick={() => setIsInstructionsOpen(true)}
            className='bg-[#161b22] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-9 px-3 gap-1.5 font-mono text-xs cursor-pointer'
          >
            <HelpCircle className='w-3.5 h-3.5 text-emerald-400' />
            <span className='hidden sm:inline'>Instructions</span>
          </Button>

          {/* Connection & Autosave Status */}
          <div className='hidden lg:flex items-center gap-2 bg-[#161b22] border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono'>
            <div className='flex items-center gap-1.5'>
              {isOffline ? (
                <>
                  <WifiOff className='w-3.5 h-3.5 text-rose-400' />
                  <span className='text-rose-400'>Offline</span>
                </>
              ) : (
                <>
                  <Wifi className='w-3.5 h-3.5 text-emerald-400' />
                  <span className='text-emerald-400 font-semibold'>{ping !== null ? `${ping}ms` : 'Online'}</span>
                </>
              )}
            </div>
            <span className='text-slate-600'>|</span>
            <div className='flex items-center gap-1 text-slate-300'>
              {autosaveStatus === 'SAVING' || hasUnsavedChanges ? (
                <>
                  <RefreshCw className='w-3 h-3 text-amber-400 animate-spin' />
                  <span className='text-amber-400'>Syncing</span>
                </>
              ) : autosaveStatus === 'FAILED' ? (
                <>
                  <AlertCircle className='w-3 h-3 text-rose-400' />
                  <span className='text-rose-400'>Sync Error</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className='w-3 h-3 text-emerald-400' />
                  <span className='text-slate-400'>Synced</span>
                </>
              )}
            </div>
          </div>

          {/* Camera Proctoring */}
          <div className='w-10 h-10 rounded-lg bg-[#161b22] border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner'>
            <FaceTracker onSubmit={() => submitAssessment({ autoSubmit: true })} />
          </div>

          {/* Timer Widget */}
          <div className='flex items-center gap-2 bg-[#161b22] border border-emerald-500/30 px-3.5 py-1.5 rounded-lg text-emerald-400 font-mono text-sm font-bold shadow-xs'>
            <Clock className='w-4 h-4 text-emerald-400 shrink-0' />
            <TimerWidget />
          </div>

          {/* Submit Button */}
          <Button
            size='sm'
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono text-xs px-4 h-9 shadow-sm cursor-pointer'
          >
            {isSubmitting ? 'Evaluating...' : 'Submit'}
          </Button>
        </div>
      </header>

      {/* Top Section Navigation Tabs */}
      {testInstance?.sections && testInstance.sections.length > 0 && (
        <div className='bg-[#161b22] border-b border-slate-800 px-4 md:px-6 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 select-none'>
          <span className='text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider mr-1 shrink-0 flex items-center gap-1.5'>
            <Terminal className='w-3.5 h-3.5 text-emerald-400' />
            Sections:
          </span>

          {testInstance.sections.map((section, idx) => {
            const isActive = idx === activeSectionIndex;
            const isLocked =
              lockedSectionKeys.includes(section.sectionKey) ||
              (sectionTimingEnabled && idx < currentSectionIndex);
            const isCurrentActive = idx === currentSectionIndex && sectionTimingEnabled;

            return (
              <button
                key={section.id}
                onClick={() => (!isLocked && !isActive ? requestSectionChange(idx) : undefined)}
                disabled={isLocked}
                title={isLocked ? 'This section is locked' : section.title}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-2 shrink-0 border cursor-pointer',
                  isActive
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
                    : isLocked
                      ? 'bg-[#0d1117] border-slate-800/80 text-slate-600 cursor-not-allowed'
                      : 'bg-[#0d1117] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-800/40',
                )}
              >
                {isLocked && <Lock className='w-3 h-3 text-slate-500 shrink-0' />}
                <span>
                  {idx + 1}. {section.title || section.sectionName || `Section ${idx + 1}`}
                </span>

                {isCurrentActive && isActive && sectionRemainingTime > 0 && (
                  <span
                    className={cn(
                      'ml-1 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded',
                      isTimerWarning
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/30',
                    )}
                  >
                    {formatTime(sectionRemainingTime)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Viewport Container */}
      <main className='flex-1 w-full p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 overflow-hidden'>
        {/* Left / Center Area: Question Renderer & Footer Action Bar */}
        <div className='flex-1 flex flex-col min-w-0 min-h-[500px] lg:min-h-0 overflow-hidden'>
          {/* Question Renderer */}
          <div className='flex-1 flex overflow-hidden'>
            <TerminalQuestionRenderer />
          </div>

          {/* Bottom Action Footer Bar */}
          <div className='flex items-center justify-between pt-4 mt-2 shrink-0 border-t border-slate-800/80'>
            <Button
              variant='outline'
              className='gap-2 bg-[#161b22] text-slate-200 hover:bg-slate-800 hover:text-white border-slate-700 rounded-lg h-10 px-4 font-mono text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
              onClick={goPrevious}
              disabled={isPreviousDisabled}
            >
              <ChevronLeft className='w-4 h-4' /> &lt; Prev
            </Button>

            <div className='flex items-center gap-2 sm:gap-3'>
              <Button
                variant='outline'
                className='gap-1.5 bg-amber-950/40 text-amber-400 hover:bg-amber-900/60 hover:text-amber-300 border-amber-500/40 rounded-lg h-10 px-3 sm:px-4 font-mono text-xs font-semibold cursor-pointer'
                onClick={handleMarkForReviewAndNext}
              >
                <Bookmark className='w-3.5 h-3.5 fill-amber-400 text-amber-400' />
                <span className='hidden xs:inline'>Mark & Next</span>
                <span className='xs:hidden'>Review</span>
              </Button>
              <Button
                variant='outline'
                className='gap-1.5 bg-[#161b22] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-slate-700 rounded-lg h-10 px-3 sm:px-4 font-mono text-xs font-semibold cursor-pointer'
                onClick={handleClearResponse}
              >
                <RotateCcw className='w-3.5 h-3.5' />
                <span>Clear</span>
              </Button>
            </div>

            <Button
              className={cn(
                'gap-2 rounded-lg h-10 px-5 sm:px-6 font-mono text-xs font-bold transition-all shadow-sm cursor-pointer',
                isFinalAssessmentQuestion
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : isLastQuestionOfSection && !isLastSection
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950',
              )}
              onClick={handleNextAction}
            >
              <span>{nextButtonLabel}</span>
              <ChevronRight className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Right Area: Productivity Tools & Question Matrix Palette */}
        <div className='w-full lg:w-[320px] shrink-0 flex flex-col'>
          <div className='bg-[#161b22] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col h-full overflow-hidden'>
            {/* Productivity Tools Bar */}
            <div className='p-3 bg-[#0d1117] border border-slate-800 rounded-lg mb-4 shrink-0 select-none'>
              <div className='flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2'>
                <span>Productivity Tools</span>
                <span className='text-[10px] text-slate-500 lowercase'>scratch & calc</span>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <button
                  onClick={handleOpenScratchPad}
                  className={cn(
                    'py-2 px-2 rounded-lg border font-mono font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs',
                    isScratchOpen
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-inner ring-1 ring-emerald-500/40'
                      : 'bg-[#161b22] hover:bg-slate-800 text-slate-300 border-slate-700',
                  )}
                  title='Toggle Rough Paper (Scratch Pad)'
                  aria-pressed={isScratchOpen}
                >
                  <FileEdit className='w-3.5 h-3.5 text-emerald-400' />
                  <span>Scratch Pad</span>
                </button>
                <button
                  onClick={handleOpenCalc}
                  className={cn(
                    'py-2 px-2 rounded-lg border font-mono font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs',
                    isCalcOpen
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-inner ring-1 ring-emerald-500/40'
                      : 'bg-[#161b22] hover:bg-slate-800 text-slate-300 border-slate-700',
                  )}
                  title='Toggle Scientific Calculator'
                  aria-pressed={isCalcOpen}
                >
                  <Calculator className='w-3.5 h-3.5 text-emerald-400' />
                  <span>Calculator</span>
                </button>
              </div>
            </div>

            <div className='flex items-center justify-between mb-3 pb-2 border-b border-slate-800'>
              <div className='flex items-center gap-2'>
                <LayoutGrid className='w-4 h-4 text-emerald-400' />
                <h3 className='text-xs font-bold uppercase tracking-wider text-slate-200 font-mono'>
                  Question Matrix
                </h3>
              </div>
              <span className='text-[11px] font-mono text-slate-400'>
                Total: {visiblePalette.length}
              </span>
            </div>

            {/* Status Legend */}
            <div className='grid grid-cols-2 gap-y-2 gap-x-2 mb-3.5 p-2.5 bg-[#0d1117] rounded-lg border border-slate-800 text-[11px] font-mono font-medium text-slate-300'>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-md bg-emerald-500 shrink-0' /> Answered ({answeredCount})
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-md bg-amber-400 shrink-0' /> Review ({markedCount})
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-md bg-rose-500 shrink-0' /> Visited ({notAnsweredCount})
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-md bg-slate-700 shrink-0' /> Left ({notVisitedCount})
              </div>
            </div>

            {/* Matrix Button Grid */}
            <div className='grid grid-cols-5 gap-2 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1'>
              {visiblePalette.map((status, idx) => {
                const absIdx = startIndex + idx;
                const isCurrent = absIdx === currentQuestionIndex;
                const ans = answers[questions[absIdx]?.id];
                const hasAns = !!(ans?.selectedOptionId || (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) || ans?.textResponse);
                const isMarked = status === 'MARKED_FOR_REVIEW' || ans?.status === 'MARKED_FOR_REVIEW';

                let btnClass = 'bg-[#0d1117] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200';
                let indicator = null;

                if (hasAns && isMarked) {
                  btnClass = 'bg-purple-950/80 border-purple-500 text-purple-300 font-bold';
                  indicator = <span className='absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black' />;
                } else if (hasAns) {
                  btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold';
                } else if (isMarked) {
                  btnClass = 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold';
                  indicator = <span className='absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black' />;
                } else if (status === 'CURRENT' || ans?.status === 'UNANSWERED' || (ans && !hasAns)) {
                  btnClass = 'bg-rose-950/30 border-rose-500/50 text-rose-400';
                }

                if (isCurrent) {
                  btnClass += ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#161b22] text-white font-bold';
                }

                return (
                  <button
                    key={absIdx}
                    onClick={() => jumpToQuestion(absIdx)}
                    className={cn(
                      'h-9 rounded-lg text-xs font-mono font-semibold flex items-center justify-center transition-all border relative cursor-pointer',
                      btnClass,
                    )}
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
          <InstructionsModal
            isOpen={isInstructionsOpen}
            onClose={() => setIsInstructionsOpen(false)}
          />
        </>
      )}
    </div>
  );
}

