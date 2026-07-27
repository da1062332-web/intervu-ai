'use client';

import { useExecutionStore } from '../stores/execution.store';
import { Input } from '@/components/ui/input';
import { EmbeddedCompiler } from './EmbeddedCompiler';

export function QuestionRenderer() {
  const { currentQuestion, currentQuestionIndex, answers, saveAnswer, testInstance } =
    useExecutionStore();

  if (!currentQuestion || !testInstance) return null;

  const currentAnswer = answers[currentQuestion.id];

  const renderMCQ = () => {
    const selectedOptionId = currentAnswer?.selectedOptionId;

    return (
      <div className='space-y-2 mt-4' role='radiogroup' aria-label='Select an option'>
        {currentQuestion.options.map((option, index) => {
          const letter = String.fromCharCode(97 + index); // a, b, c, d...
          const optId = option.id || index.toString();
          const isSelected = selectedOptionId === optId;
          const htmlId = `opt-${currentQuestion.id}-${index}`;

          return (
            <label
              key={optId}
              htmlFor={htmlId}
              onClick={() => saveAnswer(currentQuestion.id, { selectedOptionId: optId })}
              className={`flex items-start gap-2.5 px-3 py-2.5 rounded-sm cursor-pointer select-none transition-colors border ${
                isSelected
                  ? 'bg-green-50/90 font-medium text-green-950 border-green-300 shadow-2xs'
                  : 'hover:bg-gray-100/80 text-gray-800 font-normal border-transparent'
              }`}
            >
              <div className='mt-0.5 relative flex items-center justify-center shrink-0'>
                <input
                  type='radio'
                  id={htmlId}
                  name={`q-${currentQuestion.id}`}
                  checked={isSelected}
                  onChange={() => saveAnswer(currentQuestion.id, { selectedOptionId: optId })}
                  className='size-4 text-[#26773e] focus:ring-0 cursor-pointer accent-[#26773e]'
                />
              </div>
              <div className='text-[15px] sm:text-[16px] leading-snug'>
                <span className='font-normal text-gray-700 mr-1.5'>{letter})</span>
                <span>{option.text}</span>
              </div>
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
        {currentQuestion.options.map((option, index) => {
          const letter = String.fromCharCode(97 + index);
          const optId = option.id || index.toString();
          const isSelected = selectedOptionIds.includes(optId);
          const htmlId = `opt-${currentQuestion.id}-${index}`;

          return (
            <label
              key={optId}
              htmlFor={htmlId}
              onClick={() => handleToggle(optId)}
              className={`flex items-start gap-2.5 px-3 py-2.5 rounded-sm cursor-pointer select-none transition-colors border ${
                isSelected
                  ? 'bg-green-50/90 font-medium text-green-950 border-green-300 shadow-2xs'
                  : 'hover:bg-gray-100/80 text-gray-800 font-normal border-transparent'
              }`}
            >
              <div className='mt-0.5 relative flex items-center justify-center shrink-0'>
                <input
                  type='checkbox'
                  id={htmlId}
                  checked={isSelected}
                  onChange={() => handleToggle(optId)}
                  className='size-4 rounded-sm text-[#26773e] focus:ring-0 cursor-pointer accent-[#26773e]'
                />
              </div>
              <div className='text-[15px] sm:text-[16px] leading-snug'>
                <span className='font-normal text-gray-700 mr-1.5'>{letter})</span>
                <span>{option.text}</span>
              </div>
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
              onChange={(data) => saveAnswer(currentQuestion.id, { textResponse: JSON.stringify(data) })}
            />
          </div>
        );
      default:
        return renderMCQ();
    }
  };

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

      {/* Two-Column Split Pane (Passage / Directions on Left, Question & Options on Right) */}
      <div className='flex flex-1 w-full overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-300 min-h-[420px]'>
        {/* Left Pane - Directions / Passage / Stem */}
        <div className='w-full md:w-1/2 overflow-y-auto p-5 sm:p-6 bg-white shrink-0 custom-scrollbar select-text'>
          <div className='max-w-2xl text-gray-800 space-y-4 font-sans'>
            <h3 className='font-bold text-gray-900 text-sm md:text-[15px] leading-snug tracking-normal'>
              Directions [Set of Questions]: Read the following passage or instructions carefully and answer the questions that follow.
            </h3>

            {currentQuestion.stem ? (
              <div className='text-[15px] sm:text-[16px] leading-relaxed text-gray-800 font-normal space-y-3 text-justify whitespace-pre-line pt-2'>
                {currentQuestion.stem}
              </div>
            ) : (
              <div className='text-[15px] sm:text-[16px] leading-relaxed text-gray-800 font-normal space-y-3 text-justify pt-2'>
                <p>
                  Analyze the given statement on the right panel and select the correct answer from the provided options.
                </p>
                {currentQuestion.candidateInstructions && (
                  <div className='bg-blue-50/80 border-l-4 border-blue-600 p-3.5 my-3 text-sm text-gray-800 rounded-r-sm'>
                    <span className='font-bold underline block mb-1 text-blue-950'>Candidate Notice:</span>
                    {currentQuestion.candidateInstructions}
                  </div>
                )}
                <p className='text-gray-600 text-sm pt-2'>
                  Note: You may click <span className='font-bold text-gray-800'>Mark for Review & Next</span> if you wish to re-evaluate your response later before completing this section.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Question Statement & Options / Inputs */}
        <div className='w-full md:w-1/2 overflow-y-auto p-5 sm:p-6 bg-white flex flex-col justify-between custom-scrollbar select-text'>
          <div className='space-y-5'>
            <div className='text-base sm:text-[16px] font-normal leading-relaxed text-gray-950 font-sans break-words'>
              {currentQuestion.text}
            </div>

            <div className='pt-1'>
              {renderQuestionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
