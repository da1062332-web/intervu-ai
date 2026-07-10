'use client';

import { useExecutionStore } from '../stores/execution.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { EmbeddedCompiler } from './EmbeddedCompiler';

export function QuestionRenderer() {
  const { currentQuestion, currentQuestionIndex, answers, saveAnswer, toggleReview, testInstance } =
    useExecutionStore();

  if (!currentQuestion || !testInstance) return null;

  const currentAnswer = answers[currentQuestion.id];
  const isMarkedForReview = currentAnswer?.status === 'MARKED_FOR_REVIEW';
  const isCoding = currentQuestion.type === 'CODING';

  const renderMCQ = () => {
    const selectedOptionId = currentAnswer?.selectedOptionId;

    return (
      <RadioGroup
        value={selectedOptionId || ''}
        onValueChange={(val: string) => saveAnswer(currentQuestion.id, { selectedOptionId: val })}
        className='space-y-4'
        aria-label='Select an option'
      >
        {currentQuestion.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D...
          const optId = option.id || index.toString();
          const isSelected = selectedOptionId === optId;

          return (
            <Label
              key={optId}
              htmlFor={optId}
              className={`
                flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 shadow-sm
                ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50 bg-white'
                }
              `}
            >
              <RadioGroupItem
                value={optId}
                id={optId}
                className='sr-only'
                aria-label={`Option ${letter}: ${option.text}`}
              />
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded-full border mr-4 text-sm font-medium shrink-0
                ${
                  isSelected
                    ? 'bg-primary border-primary text-white'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground'
                }
              `}
                aria-hidden='true'
              >
                {letter}
              </div>
              <span className='text-base font-normal leading-relaxed break-words'>
                {option.text}
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    );
  };

  const renderMSQ = () => {
    const selectedOptionIds = currentAnswer?.selectedOptionIds || [];

    const handleToggle = (optionId: string) => {
      const isSelected = selectedOptionIds.includes(optionId);
      const newSelection = isSelected
        ? selectedOptionIds.filter((id) => id !== optionId)
        : [...selectedOptionIds, optionId];
      saveAnswer(currentQuestion.id, { selectedOptionIds: newSelection });
    };

    return (
      <div className='space-y-4' role='group' aria-label='Select multiple options'>
        {currentQuestion.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const optId = option.id || index.toString();
          const isSelected = selectedOptionIds.includes(optId);

          return (
            <Label
              key={optId}
              className={`
                flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 shadow-sm
                ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50 bg-white'
                }
              `}
            >
              <input
                type='checkbox'
                className='sr-only'
                checked={isSelected}
                onChange={() => handleToggle(optId)}
                aria-label={`Option ${letter}: ${option.text}`}
              />
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded border mr-4 text-sm font-medium shrink-0
                ${
                  isSelected
                    ? 'bg-primary border-primary text-white'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground'
                }
              `}
                aria-hidden='true'
              >
                {letter}
              </div>
              <span className='text-base font-normal leading-relaxed break-words'>
                {option.text}
              </span>
            </Label>
          );
        })}
      </div>
    );
  };

  const renderNumeric = () => {
    const textResponse = currentAnswer?.textResponse || '';

    return (
      <div className='bg-white p-6 rounded-xl border shadow-sm'>
        <Input
          type='number'
          placeholder='Enter your numeric answer'
          value={textResponse}
          onChange={(e) => saveAnswer(currentQuestion.id, { textResponse: e.target.value })}
          className='max-w-xs'
        />
      </div>
    );
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'MCQ':
        return renderMCQ();
      case 'MSQ':
        return renderMSQ();
      case 'NUMERIC':
        return renderNumeric();
      case 'CODING':
        return <EmbeddedCompiler />;
      default:
        return renderMCQ();
    }
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-start'>
      {/* Left Panel: Resources & Question Statement */}
      <Card className='w-full h-full min-h-[500px] border-solid shadow-sm flex flex-col bg-white overflow-hidden'>
        <CardHeader className='pb-4 border-b bg-muted/20'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xl font-bold'>Question {currentQuestionIndex + 1}</CardTitle>
            <span className='text-sm text-primary bg-primary/10 px-3 py-1 rounded-full font-medium'>
              {currentQuestion.type}
            </span>
          </div>
        </CardHeader>
        <CardContent className='pt-6 md:pt-8 px-6 md:px-8 flex-1 overflow-y-auto custom-scrollbar'>
          <div className='prose prose-slate max-w-none dark:prose-invert break-words'>
            <p className='text-[17px] leading-relaxed text-foreground'>
              {currentQuestion.text}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Center Panel: Interactive Area */}
      <div className='w-full h-full flex flex-col'>
        <div className='flex-1'>
          {renderQuestionContent()}
        </div>
      </div>
    </div>
  );
}
