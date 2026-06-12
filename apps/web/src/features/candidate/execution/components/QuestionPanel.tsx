'use client';

import { useExecutionStore } from '../stores/execution.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function QuestionPanel() {
  const { 
    currentQuestion, 
    currentQuestionIndex, 
    answers, 
    saveAnswer,
    markForReview,
    removeReview,
    testInstance
  } = useExecutionStore();

  if (!currentQuestion || !testInstance) return null;

  const currentAnswer = answers[currentQuestion.id];
  const selectedOptionId = currentAnswer?.selectedOptionId;
  const isMarkedForReview = currentAnswer?.status === 'MARKED_FOR_REVIEW';

  return (
    <Card className='w-full h-full border-none shadow-none md:border-solid md:shadow-sm'>
      <CardHeader className='pb-4 border-b'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl font-bold'>Question {currentQuestionIndex + 1}</CardTitle>
          <span className='text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md'>MCQ</span>
        </div>
      </CardHeader>

      <CardContent className='pt-6'>
        <div className='prose prose-slate max-w-none mb-8 dark:prose-invert'>
          <p className='text-lg leading-relaxed'>{currentQuestion.text}</p>
        </div>

        <div className='mt-8'>
          <RadioGroup
            value={selectedOptionId || ''}
            onValueChange={(val: string) => saveAnswer(currentQuestion.id, val)}
            className='space-y-4'
          >
            {currentQuestion.options.map((option, index) => {
              const letter = String.fromCharCode(65 + index); // A, B, C, D...
              const isSelected = selectedOptionId === option.id;

              return (
                <Label
                  key={option.id}
                  htmlFor={option.id}
                  className={`
                    flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }
                  `}
                >
                  <RadioGroupItem value={option.id} id={option.id} className='sr-only' />
                  <div
                    className={`
                    flex items-center justify-center w-8 h-8 rounded-full border mr-4 text-sm font-medium
                    ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background border-muted-foreground/30 text-muted-foreground'
                    }
                  `}
                  >
                    {letter}
                  </div>
                  <span className='text-base font-normal leading-relaxed'>{option.text}</span>
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              checked={isMarkedForReview}
              onChange={(e) => {
                if (e.target.checked) {
                  markForReview(currentQuestion.id);
                } else {
                  removeReview(currentQuestion.id);
                }
              }}
            />
            <span>Mark for Review</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
