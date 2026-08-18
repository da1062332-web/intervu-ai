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
    requestNextSection,
  } = useExecutionStore();

  const isFirst = currentQuestionIndex === 0;

  // Calculate current section boundaries
  let currentSectionStartIndex = 0;
  let currentSectionEndIndex = questions.length;
  const totalSections = testInstance?.sections?.length ?? 1;

  if (testInstance?.sections && testInstance.sections.length > 0) {
    let running = 0;
    for (let i = 0; i < testInstance.sections.length; i++) {
      const secLen = testInstance.sections[i].questions?.length ?? 0;
      if (i === currentSectionIndex) {
        currentSectionStartIndex = running;
        currentSectionEndIndex = running + (secLen > 0 ? secLen : 0);
        break;
      }
      running += secLen;
    }
  }

  const isLastQuestionOfSection = currentQuestionIndex >= currentSectionEndIndex - 1;
  const isLastSection = currentSectionIndex >= totalSections - 1;
  const isFinalAssessmentQuestion = isLastSection && isLastQuestionOfSection;

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
    if (!isLastQuestionOfSection) {
      goNext();
    }
  };

  const handleSaveAndNext = () => {
    if (isFinalAssessmentQuestion) {
      if (onSubmitClick) onSubmitClick();
    } else if (isLastQuestionOfSection && !isLastSection) {
      // Trigger section advance modal
      requestNextSection();
    } else {
      goNext();
    }
  };

  // Determine button label
  let nextButtonLabel = 'Save & Next';
  if (isFinalAssessmentQuestion) {
    nextButtonLabel = 'Submit Assessment';
  } else if (isLastQuestionOfSection && !isLastSection) {
    nextButtonLabel = 'Next Section';
  }

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

      {/* Right Button Group: Save & Next / Next Section / Submit Assessment */}
      <div className='flex items-center shrink-0 ml-auto'>
        <button
          onClick={handleSaveAndNext}
          className='bg-[#27783f] hover:bg-[#1f6333] text-white font-bold text-sm px-10 py-2.5 rounded-sm border border-[#195028] shadow-md transition-all tracking-wide flex items-center justify-center shrink-0 cursor-pointer'
        >
          {nextButtonLabel}
        </button>
      </div>
    </div>
  );
});
