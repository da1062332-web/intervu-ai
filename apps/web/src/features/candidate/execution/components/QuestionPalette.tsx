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
        <div className='grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5'>
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
