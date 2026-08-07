import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { QuestionCard } from './QuestionCard';

interface BatchQuestionListProps {
  disabled?: boolean;
}

export function BatchQuestionList({ disabled }: BatchQuestionListProps) {
  const { control, getValues } = useFormContext();
  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'questions',
  });

  const handleAddQuestion = React.useCallback(() => {
    append({
      questionType: 'MCQ',
      difficulty: 'MEDIUM',
      questionTitle: '',
      questionText: '',
      options: ['', '', '', ''],
      answer: '',
      explanation: '',
    });
  }, [append]);

  const handleDuplicate = React.useCallback((index: number) => {
    const currentVals = getValues(`questions.${index}`);
    insert(index + 1, { ...currentVals });
  }, [getValues, insert]);

  return (
    <div className="space-y-8">
      {fields.map((field, index) => (
        <QuestionCard
          key={field.id}
          index={index}
          onRemove={remove}
          onDuplicate={handleDuplicate}
          disabled={disabled}
        />
      ))}

      <div className="flex justify-center pt-4 border-t border-dashed">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddQuestion}
          disabled={disabled}
          className="border-dashed hover:border-solid bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>
    </div>
  );
}
