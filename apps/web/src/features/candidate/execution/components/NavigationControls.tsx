'use client';

import { useExecutionStore } from '../stores/execution.store';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2, Bookmark, Eraser } from 'lucide-react';
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
    toggleReview
  } = useExecutionStore();

  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isMarkedForReview = currentAnswer?.status === 'MARKED_FOR_REVIEW';

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    saveAnswer(currentQuestion.id, { 
      selectedOptionId: undefined, 
      selectedOptionIds: [], 
      textResponse: '' 
    });
  };

  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    toggleReview(currentQuestion.id);
    goNext(); // Usually "Mark for Review & Next"
  };

  const handleSaveAndNext = () => {
    if (isLast) {
      if (onSubmitClick) onSubmitClick();
    } else {
      goNext();
    }
  };

  return (
    <div className='flex items-center justify-between w-full gap-4'>
      <div className='flex items-center gap-3'>
        <Button
          variant='outline'
          onClick={goPrevious}
          disabled={isFirst}
          className='w-full sm:w-32 h-10 border-gray-300'
        >
          <ChevronLeft className='w-4 h-4 mr-2' />
          Previous
        </Button>
      </div>

      <div className='flex items-center gap-3 overflow-x-auto hide-scrollbar'>
        <Button
          variant='outline'
          onClick={handleMarkForReview}
          className={`h-10 whitespace-nowrap ${isMarkedForReview ? 'bg-purple-50 text-purple-600 border-purple-200' : 'border-gray-300'}`}
        >
          <Bookmark className={`w-4 h-4 mr-2 ${isMarkedForReview ? 'fill-current' : ''}`} />
          Mark for Review & Next
        </Button>
        <Button
          variant='outline'
          onClick={handleClearResponse}
          className='h-10 border-gray-300 whitespace-nowrap'
        >
          <Eraser className='w-4 h-4 mr-2' />
          Clear Response
        </Button>
        <Button
          onClick={handleSaveAndNext}
          className='px-8 h-10 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap shadow-sm'
        >
          {isLast ? (
            <>
              <CheckCircle2 className='w-4 h-4 mr-2' />
              Submit Assessment
            </>
          ) : (
            <>
              Save & Next
              <ChevronRight className='w-4 h-4 ml-2' />
            </>
          )}
        </Button>
      </div>
    </div>
  );
});
