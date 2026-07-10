'use client';

import { useExecutionStore } from '../stores/execution.store';
import { QuestionStatusBadge } from './QuestionStatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCallback, memo } from 'react';

export const QuestionPalette = memo(function QuestionPalette() {
  const { palette, jumpToQuestion, answers, questions } = useExecutionStore();

  const handleJump = useCallback(
    (index: number) => {
      jumpToQuestion(index);
    },
    [jumpToQuestion],
  );

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

        <div className='grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5 max-h-[300px] overflow-y-auto custom-scrollbar pr-2'>
          {palette.map((status, index) => {
            const questionId = questions[index]?.id;
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
                key={`palette-${index}`}
                index={index}
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
