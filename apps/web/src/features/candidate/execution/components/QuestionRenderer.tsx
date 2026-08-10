'use client';

import { useCallback } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { Input } from '@/components/ui/input';
import { EmbeddedCompiler } from './EmbeddedCompiler';

export function QuestionRenderer() {
  const { currentQuestion, currentQuestionIndex, answers, saveAnswer, testInstance } =
    useExecutionStore();

  const handleCompilerChange = useCallback(
    (data: any) => {
      if (!currentQuestion) return;
      saveAnswer(currentQuestion.id, { textResponse: JSON.stringify(data) });
    },
    [currentQuestion?.id, saveAnswer],
  );

  if (!currentQuestion || !testInstance) return null;

  const currentAnswer = answers[currentQuestion.id];

  let parsedInstructions: { constraints?: string; testCases?: string } | null = null;
  let rawInstructions = '';

  if (currentQuestion.candidateInstructions) {
    try {
      const parsed = JSON.parse(currentQuestion.candidateInstructions);
      if (typeof parsed === 'object' && parsed !== null) {
        parsedInstructions = parsed;
      } else {
        rawInstructions = currentQuestion.candidateInstructions;
      }
    } catch {
      rawInstructions = currentQuestion.candidateInstructions;
    }
  }

  const renderMCQ = () => {
    const selectedOptionId = currentAnswer?.selectedOptionId;

    return (
      <div className='space-y-2 mt-4' role='radiogroup' aria-label='Select an option'>
        {currentQuestion.options.map((option: any, index: number) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D...
          const optKey = `opt-${currentQuestion.id}-${index}`;
          const optText =
            typeof option === 'string'
              ? option
              : option?.text || option?.value || option?.label || '';
          const optValue =
            typeof option === 'string' ? option : option?.text || option?.id || index.toString();
          const isSelected = selectedOptionId === optValue;

          const htmlId = `opt-${currentQuestion.id}-${index}`;

          return (
            <label
              key={optKey}
              htmlFor={htmlId}
              className={`
                flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 shadow-xs
                ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900'
                }
              `}
            >
              <input
                type='radio'
                name={`mcq-${currentQuestion.id}`}
                value={optValue}
                id={htmlId}
                checked={isSelected}
                onChange={() => saveAnswer(currentQuestion.id, { selectedOptionId: optValue })}
                className='sr-only'
                aria-label={`Option ${letter}: ${optText}`}
              />
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded-full border mr-4 text-sm font-medium shrink-0
                ${
                  isSelected
                    ? 'bg-primary border-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }
              `}
                aria-hidden='true'
              >
                {letter}
              </div>
              <span className='text-base font-medium leading-relaxed break-words text-slate-900 dark:text-slate-100'>
                {optText}
              </span>
            </label>
          );
        })}
      </div>
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
      <div className='space-y-2 mt-4' role='group' aria-label='Select multiple options'>
        {currentQuestion.options.map((option: any, index: number) => {
          const letter = String.fromCharCode(65 + index);
          const optText =
            typeof option === 'string'
              ? option
              : option?.text || option?.value || option?.label || '';
          const optValue =
            typeof option === 'string' ? option : option?.text || option?.id || index.toString();
          const isSelected = selectedOptionIds.includes(optValue);

          const htmlId = `opt-${currentQuestion.id}-${index}`;

          return (
            <label
              key={`opt-${currentQuestion.id}-${index}`}
              htmlFor={htmlId}
              className={`
                flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 shadow-xs
                ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900'
                }
              `}
            >
              <input
                type='checkbox'
                id={htmlId}
                className='sr-only'
                checked={isSelected}
                onChange={() => handleToggle(optValue)}
                aria-label={`Option ${letter}: ${optText}`}
              />
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded border mr-4 text-sm font-medium shrink-0
                ${
                  isSelected
                    ? 'bg-primary border-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }
              `}
                aria-hidden='true'
              >
                {letter}
              </div>
              <span className='text-base font-medium leading-relaxed break-words text-slate-900 dark:text-slate-100'>
                {optText}
              </span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderNumeric = () => {
    const textResponse = currentAnswer?.textResponse || '';

    return (
      <div className='mt-4 p-4 rounded-sm border border-gray-300 bg-gray-50/50 shadow-2xs max-w-sm'>
        <label className='block text-xs font-bold text-gray-700 uppercase mb-2'>
          Enter Numeric Value:
        </label>
        <Input
          type='number'
          placeholder='Type your numerical answer...'
          value={textResponse}
          onChange={(e) => saveAnswer(currentQuestion.id, { textResponse: e.target.value })}
          className='w-full border-gray-400 bg-white font-mono text-base font-semibold shadow-xs rounded-sm h-10 px-3 focus:ring-1 focus:ring-green-700'
        />
      </div>
    );
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.type?.toUpperCase()) {
      case 'MCQ':
        return renderMCQ();
      case 'MSQ':
        return renderMSQ();
      case 'NUMERIC':
        return renderNumeric();
      case 'CODING':
        return (
          <div className='mt-4 w-full flex-1'>
            <EmbeddedCompiler
              key={currentQuestion.id}
              onChange={(data) =>
                saveAnswer(currentQuestion.id, { textResponse: JSON.stringify(data) })
              }
            />
          </div>
        );
      default:
        return renderMCQ();
    }
  };

  const isCoding = currentQuestion.type?.toUpperCase() === 'CODING';

  if (isCoding) {
    return (
      <div className='flex flex-col flex-1 w-full h-full overflow-hidden bg-white select-none'>
        {/* Question Number Header Bar */}
        <div className='bg-white px-4 py-3 border-b border-gray-300 flex items-center justify-between shrink-0'>
          <h2 className='text-base md:text-lg font-bold text-gray-900 tracking-tight font-sans'>
            Question No {currentQuestionIndex + 1}
          </h2>
          <span className='text-xs font-bold text-gray-600 bg-gray-100 border border-gray-300 px-3 py-0.5 rounded-sm uppercase tracking-wider'>
            {currentQuestion.type}
          </span>
        </div>

        <div className='flex flex-col flex-1 w-full overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar select-text'>
          {/* Question Statement & Constraints */}
          <div className='bg-slate-50 p-4 sm:p-5 rounded-lg border border-slate-200 space-y-3 shrink-0'>
            <div className='text-base sm:text-lg font-semibold leading-relaxed text-slate-900 font-sans break-words'>
              {currentQuestion.text}
            </div>

            {parsedInstructions?.constraints && (
              <div className='p-3.5 rounded-md border border-amber-200 bg-amber-50/70 text-sm'>
                <h4 className='font-semibold text-amber-900 mb-1 text-xs uppercase tracking-wider'>
                  Constraints
                </h4>
                <div className='font-mono text-gray-800 text-xs whitespace-pre-wrap'>
                  {parsedInstructions.constraints}
                </div>
              </div>
            )}
          </div>

          {/* Full Width Embedded Compiler */}
          <div className='w-full flex-1 min-h-[550px]'>
            <EmbeddedCompiler key={currentQuestion.id} onChange={handleCompilerChange} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col flex-1 w-full h-full overflow-hidden bg-white select-none'>
      {/* Question Number Header Bar */}
      <div className='bg-white px-4 py-3 border-b border-gray-300 flex items-center justify-between shrink-0'>
        <h2 className='text-base md:text-lg font-bold text-gray-900 tracking-tight font-sans'>
          Question No {currentQuestionIndex + 1}
        </h2>
        <span className='text-xs font-bold text-gray-600 bg-gray-100 border border-gray-300 px-3 py-0.5 rounded-sm uppercase tracking-wider'>
          {currentQuestion.type}
        </span>
      </div>

      {/* Two-Column Split Pane (Question & Context on Left, Options / Actions on Right) */}
      <div className='flex flex-1 w-full overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-300 min-h-[420px]'>
        {/* Left Pane - Question Statement & Context */}
        <div className='w-full md:w-1/2 overflow-y-auto p-5 sm:p-6 bg-white shrink-0 custom-scrollbar select-text flex flex-col justify-between'>
          <div className='max-w-2xl text-gray-800 space-y-5 font-sans'>
            {currentQuestion.stem && (
              <div className='bg-slate-50 border border-slate-200 rounded-lg p-4 text-[15px] sm:text-[16px] leading-relaxed text-gray-800 font-normal space-y-3 text-justify whitespace-pre-line'>
                <h4 className='font-bold text-xs text-slate-500 uppercase tracking-wider mb-1'>
                  Question Context / Passage:
                </h4>
                {currentQuestion.stem}
              </div>
            )}

            <div className='text-base sm:text-[17px] font-semibold leading-relaxed text-gray-950 font-sans break-words pb-2 border-b border-gray-100'>
              <span className='font-bold text-gray-900'>Question : </span>
              {currentQuestion.text}
            </div>

            {parsedInstructions?.constraints && (
              <div className='p-4 rounded-md border border-amber-200 bg-amber-50/50 text-sm'>
                <h4 className='font-semibold text-amber-900 mb-2'>Constraints</h4>
                <div className='font-mono text-gray-800 whitespace-pre-wrap'>
                  {parsedInstructions.constraints}
                </div>
              </div>
            )}

            {rawInstructions && (
              <div className='bg-blue-50/80 border-l-4 border-blue-600 p-3.5 text-sm text-gray-800 rounded-r-sm'>
                <span className='font-bold underline block mb-1 text-blue-950'>
                  Candidate Notice:
                </span>
                {rawInstructions}
              </div>
            )}
          </div>

          <p className='text-gray-500 text-xs pt-4 mt-6 border-t border-gray-100'>
            Note: You may click{' '}
            <span className='font-semibold text-gray-700'>Mark for Review & Next</span> if you wish
            to re-evaluate your response later before completing this section.
          </p>
        </div>

        {/* Right Pane - Options / Response Box */}
        <div className='w-full md:w-1/2 overflow-y-auto p-5 sm:p-6 bg-slate-50/30 flex flex-col justify-between custom-scrollbar select-text'>
          <div className='space-y-4 max-w-2xl w-full'>
            <div className='text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-gray-200'>
              <span>
                {currentQuestion.type === 'CODING'
                  ? 'Code Solution'
                  : currentQuestion.type === 'NUMERIC'
                    ? 'Numeric Answer'
                    : 'Select Response'}
              </span>
            </div>
            <div className='pt-1'>{renderQuestionContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
