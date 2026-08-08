'use client';

import { useExecutionStore } from '../stores/execution.store';
import { memo } from 'react';

interface NavigationControlsProps {
  onSubmitClick?: () => void;
}

export const NavigationControls = memo(function NavigationControls({
  onSubmitClick,
}: NavigationControlsProps) {
  const {
    currentQuestionIndex,
    questions,
    goNext,
    goPrevious,
    currentQuestion,
    answers,
    saveAnswer,
    toggleReview,
    testInstance,
    sectionTimingEnabled,
    currentSectionIndex,
  } = useExecutionStore();

  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;

  let currentSectionStartIndex = 0;
  if (testInstance && currentSectionIndex > 0) {
    let count = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      count += testInstance.sections[i].questions.length;
    }
    currentSectionStartIndex = count;
  }
  const isPreviousDisabled =
    isFirst || (sectionTimingEnabled && currentQuestionIndex === currentSectionStartIndex);

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    saveAnswer(currentQuestion.id, {
      selectedOptionId: undefined,
      selectedOptionIds: [],
      textResponse: '',
    });
  };

  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    toggleReview(currentQuestion.id);
    goNext();
  };

  const handleSaveAndNext = () => {
    if (isLast) {
      if (onSubmitClick) onSubmitClick();
    } else {
      goNext();
    }
  };

  return (
    <div className='flex flex-wrap items-center justify-between w-full gap-3 select-none font-sans'>
      {/* Left Button Group: Previous, Mark for Review & Next, Clear Response */}
      <div className='flex items-center gap-3 overflow-x-auto hide-scrollbar flex-wrap sm:flex-nowrap'>
        {!isPreviousDisabled && (
          <button
            onClick={goPrevious}
            disabled={isPreviousDisabled}
            className='bg-[#d6eafb] hover:bg-[#c2dff5] text-[#1c3e66] font-bold text-sm px-5 py-2.5 rounded-sm border border-[#96bae0] shadow-sm transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Previous
          </button>
        )}
        <button
          onClick={handleMarkForReview}
          className='bg-[#d6eafb] hover:bg-[#c2dff5] text-[#1c3e66] font-bold text-sm px-6 py-2.5 rounded-sm border border-[#96bae0] shadow-sm transition-all flex items-center justify-center shrink-0 cursor-pointer'
        >
          Mark for Review & Next
        </button>
        <button
          onClick={handleClearResponse}
          className='bg-[#d6eafb] hover:bg-[#c2dff5] text-[#1c3e66] font-bold text-sm px-8 py-2.5 rounded-sm border border-[#96bae0] shadow-sm transition-all flex items-center justify-center shrink-0 cursor-pointer'
        >
          Clear Response
        </button>
      </div>

      {/* Right Button Group: Save & Next / Submit */}
      <div className='flex items-center shrink-0 ml-auto'>
        <button
          onClick={handleSaveAndNext}
          className='bg-[#27783f] hover:bg-[#1f6333] text-white font-bold text-sm px-12 py-2.5 rounded-sm border border-[#195028] shadow-md transition-all tracking-wide flex items-center justify-center shrink-0 cursor-pointer'
        >
          {isLast ? 'Submit Assessment' : 'Save & Next'}
        </button>
      </div>
    </div>
  );
});
