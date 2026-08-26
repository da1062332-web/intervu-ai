'use client';

import { useExecutionStore } from '../stores/execution.store';
import { QuestionStatusBadge } from './QuestionStatusBadge';
import { InstructionsModal } from './InstructionsModal';
import { useCallback, memo, useMemo, useState } from 'react';

export const QuestionPalette = memo(function QuestionPalette() {
  const {
    palette,
    jumpToQuestion,
    requestNextSection,
    answers,
    questions,
    testInstance,
    currentQuestionIndex,
    currentSectionIndex,
  } = useExecutionStore();
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  const handleJump = useCallback(
    (index: number) => {
      jumpToQuestion(index);
    },
    [jumpToQuestion],
  );

  // Compute boundaries and active section index from the authoritative currentSectionIndex
  const { startIndex, endIndex, currentSectionTitle, activeSectionIdx } = useMemo(() => {
    let start = 0;
    let end = questions.length;
    let title = 'General';
    let secIdx = typeof currentSectionIndex === 'number' ? currentSectionIndex : 0;

    if (testInstance?.sections && testInstance.sections.length > 0) {
      if (secIdx >= testInstance.sections.length || secIdx < 0) {
        secIdx = 0;
      }
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
    return {
      startIndex: start,
      endIndex: end,
      currentSectionTitle: title,
      activeSectionIdx: secIdx,
    };
  }, [testInstance, currentSectionIndex, questions.length]);

  const visiblePalette = palette.slice(startIndex, endIndex);

  // Calculate realistic legend counts for current section
  const answeredCount = visiblePalette.filter((_, idx) => {
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

  // Check if there is an actual subsequent section to navigate to
  const hasNextSection = Boolean(
    testInstance && testInstance.sections && activeSectionIdx + 1 < testInstance.sections.length,
  );

  const handleNextSectionClick = () => {
    requestNextSection();
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
              You are viewing <span className='font-bold text-gray-900'>{currentSectionTitle}</span>{' '}
              section
            </p>
            <p className='text-xs font-bold text-gray-900'>Question Palette:</p>
          </div>

          {/* Scrollable Question Grid */}
          <div className='relative flex flex-1 overflow-hidden mt-1'>
            <div className='flex-1 overflow-y-auto custom-scrollbar max-h-full py-1'>
              <div className='grid grid-cols-5 gap-2 px-1 pb-2'>
                {visiblePalette.length === 0 ? (
                  <div className='col-span-4 text-center py-6 text-xs text-gray-400 font-medium'>
                    Loading questions...
                  </div>
                ) : (
                  visiblePalette.map((status, relativeIndex) => {
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

                    let displayState: 'ANSWERED' | 'NOT_ANSWERED' | 'MARKED' | 'NOT_VISITED' =
                      'NOT_VISITED';
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
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons: Only Instructions and Next Section */}
        <div className='p-2 sm:p-2.5 bg-[#e3f2fb] border-t border-[#b8daee] grid grid-cols-2 gap-1.5 shrink-0'>
          <button
            onClick={() => setIsInstructionsOpen(true)}
            className='bg-[#d6eafb] hover:bg-[#c1dff6] text-[#1c3e66] border border-[#96bae0] shadow-2xs font-bold text-[11px] sm:text-xs py-2 px-1 rounded-sm transition-colors text-center truncate cursor-pointer flex items-center justify-center tracking-wide'
          >
            Instructions
          </button>
          <button
            onClick={handleNextSectionClick}
            disabled={!hasNextSection}
            className='bg-[#d6eafb] hover:bg-[#c1dff6] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400 text-[#1c3e66] border border-[#96bae0] shadow-2xs font-bold text-[11px] sm:text-xs py-2 px-1 rounded-sm transition-colors text-center truncate cursor-pointer flex items-center justify-center tracking-wide'
          >
            Next Section
          </button>
        </div>
      </div>

      <InstructionsModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} />
    </>
  );
});
