'use client';

import { useExecutionStore } from '../stores/execution.store';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function NavigationControls() {
  const { currentQuestionIndex, questions, goNext, goPrevious } = useExecutionStore();

  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;

  return (
    <div className="flex items-center justify-between w-full mt-6 gap-4">
      <Button
        variant="outline"
        onClick={goPrevious}
        disabled={isFirst}
        className="flex-1 sm:flex-none w-full sm:w-32 h-12"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Previous
      </Button>

      <Button
        onClick={goNext}
        disabled={isLast}
        className="flex-1 sm:flex-none w-full sm:w-32 h-12"
      >
        Next
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
