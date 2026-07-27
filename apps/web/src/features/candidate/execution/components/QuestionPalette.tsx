'use client';

import { useExecutionStore } from '../stores/execution.store';
import { QuestionStatusBadge } from './QuestionStatusBadge';
import { InstructionsModal } from './InstructionsModal';
import { useCallback, memo, useMemo, useState } from 'react';

interface QuestionPaletteProps {
  onSubmitClick?: () => void;
}

export const QuestionPalette = memo(function QuestionPalette({
  onSubmitClick,
}: QuestionPaletteProps) {
  const { palette, jumpToQuestion, answers, questions, testInstance, currentQuestionIndex, currentSectionIndex } =
    useExecutionStore();
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  const handleJump = useCallback(
    (index: number) => {
      jumpToQuestion(index);
    },
    [jumpToQuestion],
  );

  // Compute boundaries for the active section
  const { startIndex, endIndex, currentSectionTitle } = useMemo(() => {
    let start = 0;
    let end = questions.length;
    let title = 'General';

    if (testInstance?.sections) {
      let runningCount = 0;
      for (const section of testInstance.sections) {
        const sectionLength = section.questions.length;
        if (
          currentQuestionIndex >= runningCount &&
          currentQuestionIndex < runningCount + sectionLength
        ) {
          start = runningCount;
          end = runningCount + sectionLength;
          title = section.title || section.sectionName || 'Section';
          break;
        }
        runningCount += sectionLength;
      }
    }
    return { startIndex: start, endIndex: end, currentSectionTitle: title };
  }, [testInstance, currentQuestionIndex, questions.length]);

  const visiblePalette = palette.slice(startIndex, endIndex);

  // Calculate realistic legend counts for current section
  const answeredCount = visiblePalette.filter((_, idx) => {
    const absIdx = startIndex + idx;
    const qId = questions[absIdx]?.id;
    const ans = answers[qId];
    const hasAns = qId ? !!(ans?.selectedOptionId || (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) || ans?.textResponse) : false;
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
    const hasAns = qId ? !!(ans?.selectedOptionId || (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) || ans?.textResponse) : false;
    return !hasAns && (absIdx <= currentQuestionIndex || status === 'CURRENT') && ans?.status !== 'MARKED_FOR_REVIEW';
  }).length;

  const notVisitedCount = Math.max(0, visiblePalette.length - answeredCount - markedCount - notAnsweredCount);

  const handleNextSectionClick = () => {
    if (testInstance && testInstance.sections && currentSectionIndex + 1 < testInstance.sections.length) {
      let runningCount = 0;
      for (let i = 0; i <= currentSectionIndex; i++) {
        runningCount += testInstance.sections[i].questions.length;
      }
      jumpToQuestion(runningCount);
    } else {
      if (onSubmitClick) onSubmitClick();
    }
  };

  return (
    <>
      <div className='flex flex-col flex-1 h-full bg-[#e3f2fb] select-none text-gray-800 overflow-hidden'>
        {/* Legend Container */}
        <div className='p-3.5 flex-1 flex flex-col overflow-hidden'>
          <h3 className='text-sm font-bold text-gray-900 mb-3 tracking-tight'>Legend</h3>

          <div className='grid grid-cols-2 gap-y-3 gap-x-2 text-xs mb-5 font-semibold text-gray-800 shrink-0'>
            <div className='flex items-center gap-2'>
              <span className='inline-flex items-center justify-center min-w-[26px] h-6 px-2 bg-[#5cb85c] text-white font-bold text-xs rounded-full border border-[#4a9b4a] shadow-2xs'>
                {answeredCount}
              </span>
              <span>Answered</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='inline-flex items-center justify-center w-6 h-6 bg-[#e54524] text-white font-bold text-xs rounded-sm border border-[#c33315] shadow-2xs'>
                {notAnsweredCount}
              </span>
              <span>Not Answered</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='inline-flex items-center justify-center min-w-[26px] h-6 px-2 bg-[#8e24aa] text-white font-bold text-xs rounded-full border border-[#751c8e] shadow-2xs'>
                {markedCount}
              </span>
              <span>Marked</span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='inline-flex items-center justify-center w-6 h-6 bg-white text-gray-700 font-bold text-xs rounded-sm border border-gray-300 shadow-2xs'>
                {notVisitedCount}
              </span>
              <span>Not Visited</span>
            </div>
          </div>

          {/* Section Notice & Title */}
          <div className='mt-1 mb-2 shrink-0 border-t border-[#b7d5ec]/60 pt-3'>
            <p className='text-xs text-gray-700 font-normal mb-0.5'>
              You are viewing <span className='font-bold text-gray-900'>{currentSectionTitle}</span> section
            </p>
            <p className='text-xs font-bold text-gray-900'>
              Question Palette:
            </p>
          </div>

          {/* Scrollable Question Grid */}
          <div className='relative flex flex-1 overflow-hidden mt-1'>
            {/* Collapse chevron indicator on left border */}
            <div className='flex items-center justify-center w-4 text-gray-500 hover:text-gray-800 pr-1 select-none pointer-events-none'>
              <span className='text-xs font-bold text-gray-500'>&gt;&gt;</span>
            </div>

            <div className='flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-full py-1'>
              <div className='grid grid-cols-4 gap-2.5 px-1 pb-4'>
                {visiblePalette.map((status, relativeIndex) => {
                  const absoluteIndex = startIndex + relativeIndex;
                  const questionId = questions[absoluteIndex]?.id;
                  const ans = answers[questionId];
                  const isAnswered = questionId
                    ? !!(
                        ans?.selectedOptionId ||
                        (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                        ans?.textResponse
                      )
                    : false;

                  let displayState: 'ANSWERED' | 'NOT_ANSWERED' | 'MARKED' | 'NOT_VISITED' = 'NOT_VISITED';
                  if (ans?.status === 'MARKED_FOR_REVIEW' || status === 'MARKED_FOR_REVIEW') {
                    displayState = 'MARKED';
                  } else if (isAnswered) {
                    displayState = 'ANSWERED';
                  } else if (absoluteIndex <= currentQuestionIndex || status === 'CURRENT') {
                    displayState = 'NOT_ANSWERED';
                  } else {
                    displayState = 'NOT_VISITED';
                  }

                  return (
                    <QuestionStatusBadge
                      key={`palette-${absoluteIndex}`}
                      index={absoluteIndex}
                      displayIndex={relativeIndex + 1}
                      status={status}
                      isAnswered={isAnswered}
                      onClick={handleJump}
                      isCurrent={absoluteIndex === currentQuestionIndex}
                      displayState={displayState}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons: Only Instructions and Next Section */}
        <div className='p-3 bg-[#e3f2fb] border-t border-[#b8daee] grid grid-cols-2 gap-2 shrink-0'>
          <button
            onClick={() => setIsInstructionsOpen(true)}
            className='bg-[#d6eafb] hover:bg-[#c1dff6] text-[#1c3e66] border border-[#96bae0] shadow-sm font-semibold text-xs py-2.5 px-2 rounded-sm transition-colors text-center truncate cursor-pointer flex items-center justify-center tracking-wide'
          >
            Instructions
          </button>
          <button
            onClick={handleNextSectionClick}
            className='bg-[#d6eafb] hover:bg-[#c1dff6] text-[#1c3e66] border border-[#96bae0] shadow-sm font-semibold text-xs py-2.5 px-2 rounded-sm transition-colors text-center truncate cursor-pointer flex items-center justify-center tracking-wide'
          >
            Next Section
          </button>
        </div>
      </div>

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />
    </>
  );
});
