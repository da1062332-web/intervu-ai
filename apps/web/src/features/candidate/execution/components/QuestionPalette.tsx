'use client';

import { useExecutionStore } from '../stores/execution.store';
import { QuestionStatusBadge } from './QuestionStatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCallback, memo, useMemo } from 'react';

export const QuestionPalette = memo(function QuestionPalette() {
  const { palette, jumpToQuestion, answers, questions, testInstance, currentQuestionIndex } =
    useExecutionStore();

  const handleJump = useCallback(
    (index: number) => {
      jumpToQuestion(index);
    },
    [jumpToQuestion],
  );

  // Compute boundaries for the active section
  const { startIndex, endIndex } = useMemo(() => {
    let start = 0;
    let end = questions.length;
    
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
          break;
        }
        runningCount += sectionLength;
      }
    }
    return { startIndex: start, endIndex: end };
  }, [testInstance, currentQuestionIndex, questions.length]);

  const visiblePalette = palette.slice(startIndex, endIndex);

  return (
    <Card className='border-none shadow-none md:border-solid md:shadow-sm'>
      <CardHeader className='pb-4 border-b'>
        <CardTitle className='text-lg font-bold'>Question Palette</CardTitle>
      </CardHeader>
      <CardContent className='pt-4'>
        <div className='grid grid-cols-2 gap-2 mb-6 text-xs'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded bg-green-600' />
            <span>Answered</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded bg-orange-500' />
            <span>Current</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded bg-purple-600' />
            <span>Marked</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded bg-gray-100 border border-gray-300' />
            <span>Not Visited</span>
          </div>
        </div>

        <div className='grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2'>
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

            return (
              <QuestionStatusBadge
                key={`palette-${absoluteIndex}`}
                index={absoluteIndex}
                displayIndex={relativeIndex + 1}
                status={status}
                isAnswered={isAnswered}
                onClick={handleJump}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
