'use client';

import React, { useCallback, Fragment, useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { Input } from '@/components/ui/input';
import { EmbeddedCompiler } from './EmbeddedCompiler';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { executionService } from '../services/execution.service';

export function StreamlinedQuestionRenderer() {
  const {
    currentQuestion,
    currentQuestionIndex,
    answers,
    saveAnswer,
    testInstance,
    currentSectionIndex,
    syncQuestionsFromInstance,
  } = useExecutionStore();

  useEffect(() => {
    if (!currentQuestion && testInstance?.id) {
      let isMounted = true;
      const timer = setTimeout(async () => {
        try {
          const latest = await executionService.getTestInstance(testInstance.id);
          if (latest && isMounted) {
            const currentSec = latest.sections[currentSectionIndex];
            if (currentSec && currentSec.questions && currentSec.questions.length > 0) {
              syncQuestionsFromInstance(latest);
            }
          }
        } catch (err) {
          console.warn('Auto-sync questions failed:', err);
        }
      }, 600);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [currentQuestion, testInstance?.id, currentSectionIndex, syncQuestionsFromInstance]);

  const handleCompilerChange = useCallback(
    (data: any) => {
      if (!currentQuestion) return;
      saveAnswer(currentQuestion.id, { textResponse: JSON.stringify(data) });
    },
    [currentQuestion?.id, saveAnswer],
  );

  if (!currentQuestion) {
    return (
      <div className='flex flex-col items-center justify-center h-80 text-center px-4'>
        <div className='w-9 h-9 border-3 border-[#27783f] border-t-transparent rounded-full animate-spin mb-3' />
        <h3 className='text-sm font-semibold text-gray-800 mb-1'>Loading Section Questions...</h3>
        <p className='text-xs text-gray-500 max-w-sm'>
          Preparing questions for this section. Please wait a moment.
        </p>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];

  // Extract saved compiler state for active question
  let initialCode: string | undefined;
  let initialLanguage = 'java';
  let initialRunResponse: any = null;
  let initialSubmitResponse: any = null;
  let initialActiveTab: 'editor' | 'results' = 'editor';

  if (currentAnswer?.textResponse) {
    try {
      const parsed = JSON.parse(currentAnswer.textResponse);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.code === 'string') initialCode = parsed.code;
        if (typeof parsed.language === 'string') initialLanguage = parsed.language;
        if (parsed.runResponse) initialRunResponse = parsed.runResponse;
        if (parsed.submitResponse) initialSubmitResponse = parsed.submitResponse;
        if (parsed.activeTab === 'results' || parsed.activeTab === 'editor') {
          initialActiveTab = parsed.activeTab;
        } else if (parsed.submitResponse || parsed.runResponse) {
          initialActiveTab = 'results';
        }
      } else if (typeof parsed === 'string') {
        initialCode = parsed;
      }
    } catch {
      initialCode = currentAnswer.textResponse;
    }
  }

  let parsedInstructions: any = null;
  if (currentQuestion.instructions) {
    if (typeof currentQuestion.instructions === 'string') {
      try {
        parsedInstructions = JSON.parse(currentQuestion.instructions);
      } catch {
        parsedInstructions = { constraints: currentQuestion.instructions };
      }
    } else {
      parsedInstructions = currentQuestion.instructions;
    }
  }

  const extractOptionText = (option: any): string => {
    if (option === null || option === undefined) return '';
    if (typeof option === 'string') return option;
    if (typeof option === 'number' || typeof option === 'boolean') return String(option);
    if (typeof option === 'object') {
      if (typeof option.text === 'string') return option.text;
      if (typeof option.value === 'string') return option.value;
      if (typeof option.label === 'string') return option.label;
      if (typeof option.optionText === 'string') return option.optionText;
      if (typeof option.option === 'string') return option.option;
      if (typeof option.content === 'string') return option.content;
      if (typeof option.statement === 'string') return option.statement;
      if (typeof option.text === 'object' && option.text !== null) return extractOptionText(option.text);
      if (typeof option.value === 'object' && option.value !== null) return extractOptionText(option.value);
      for (const key of ['text', 'value', 'label', 'option', 'content', 'title', 'description']) {
        if (typeof option[key] === 'string') return option[key];
      }
      for (const [k, v] of Object.entries(option)) {
        if (k !== 'id' && k !== 'isCorrect' && typeof v === 'string' && v.trim() !== '') {
          return v;
        }
      }
    }
    const str = String(option);
    return str === '[object Object]' ? '' : str;
  };

  const getOptionsList = (q: any): any[] => {
    if (Array.isArray(q.options) && q.options.length > 0) return q.options;
    if (Array.isArray(q.mcqData?.options) && q.mcqData.options.length > 0) return q.mcqData.options;
    if (Array.isArray(q.mcqData?.choices) && q.mcqData.choices.length > 0) return q.mcqData.choices;
    if (Array.isArray(q.metadata?.options) && q.metadata.options.length > 0) return q.metadata.options;
    if (Array.isArray(q.metadata?.choices) && q.metadata.choices.length > 0) return q.metadata.choices;
    if (Array.isArray(q.choices) && q.choices.length > 0) return q.choices;
    return [];
  };

  const formatOptionDisplay = (rawOption: any): string => {
    const text = extractOptionText(rawOption);
    if (!text) return '';
    return text.replace(/-?\d+\.\d{3,}/g, (match) => {
      const num = parseFloat(match);
      if (isNaN(num)) return match;
      const rounded = num.toFixed(2);
      return rounded.endsWith('.00') ? String(Math.round(num)) : rounded;
    });
  };

  // Section-relative question numbering for palette alignment
  const currentSection = testInstance?.sections?.[currentSectionIndex];
  const sectionQuestions = currentSection?.questions || [];
  const sectionRelativeIndex = sectionQuestions.findIndex((q) => q.id === currentQuestion.id);
  const displaySectionQuestionNo =
    sectionRelativeIndex >= 0 ? sectionRelativeIndex + 1 : currentQuestionIndex + 1;
  const sectionTotalQuestions = sectionQuestions.length > 0 ? sectionQuestions.length : 1;
  const overallQuestionNo = currentQuestionIndex + 1;

  const renderMCQ = () => {
    const selectedOptionId = currentAnswer?.selectedOptionId;
    const optionsList = getOptionsList(currentQuestion);

    if (optionsList.length === 0) {
      return renderNumeric();
    }

    const palettes = [
      { circle: 'bg-[#ede9fe] text-[#7c3aed]', boxSelected: 'bg-[#f5f3ff] border-[#c4b5fd]' },
      { circle: 'bg-[#fef9c3] text-[#ca8a04]', boxSelected: 'bg-[#fefce8] border-[#fde047]' },
      { circle: 'bg-[#d1fae5] text-[#059669]', boxSelected: 'bg-[#ecfdf5] border-[#a7f3d0]' },
      { circle: 'bg-[#fee2e2] text-[#e11d48]', boxSelected: 'bg-[#fef2f2] border-[#fecaca]' },
      { circle: 'bg-[#e0f2fe] text-[#0284c7]', boxSelected: 'bg-[#f0f9ff] border-[#bae6fd]' },
    ];

    return (
      <div className='space-y-4 mt-2' role='radiogroup' aria-label='Select an option'>
        {optionsList.map((option: any, index: number) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D...
          const optKey = `opt-${currentQuestion.id}-${index}`;
          const optText = formatOptionDisplay(option);
          const rawOptValue =
            typeof option === 'string'
              ? option
              : option?.id || option?.text || option?.value || index.toString();
          const optValue = typeof rawOptValue === 'string' ? rawOptValue : String(rawOptValue);
          const isSelected =
            selectedOptionId === optValue ||
            selectedOptionId === optText ||
            selectedOptionId === (typeof option === 'object' ? option?.id : null);

          const htmlId = `opt-${currentQuestion.id}-${index}`;
          const palette = palettes[index % palettes.length];

          return (
            <label
              key={optKey}
              htmlFor={htmlId}
              className={`
                flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-150 focus-within:ring-2 focus-within:ring-slate-300 shadow-sm
                ${
                  isSelected
                    ? palette.boxSelected
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 bg-white text-slate-800'
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
                className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 text-base font-bold shrink-0 ${palette.circle}`}
                aria-hidden='true'
              >
                {letter}
              </div>
              <span className='text-sm sm:text-[15px] font-medium leading-relaxed break-words text-slate-700'>
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
    const optionsList = getOptionsList(currentQuestion);

    if (optionsList.length === 0) {
      return renderNumeric();
    }

    const handleToggle = (optionId: string) => {
      const isSelected = selectedOptionIds.includes(optionId);
      const newSelection = isSelected
        ? selectedOptionIds.filter((id) => id !== optionId)
        : [...selectedOptionIds, optionId];
      saveAnswer(currentQuestion.id, { selectedOptionIds: newSelection });
    };

    const palettes = [
      { circle: 'bg-[#ede9fe] text-[#7c3aed]', boxSelected: 'bg-[#f5f3ff] border-[#c4b5fd]' },
      { circle: 'bg-[#fef9c3] text-[#ca8a04]', boxSelected: 'bg-[#fefce8] border-[#fde047]' },
      { circle: 'bg-[#d1fae5] text-[#059669]', boxSelected: 'bg-[#ecfdf5] border-[#a7f3d0]' },
      { circle: 'bg-[#fee2e2] text-[#e11d48]', boxSelected: 'bg-[#fef2f2] border-[#fecaca]' },
      { circle: 'bg-[#e0f2fe] text-[#0284c7]', boxSelected: 'bg-[#f0f9ff] border-[#bae6fd]' },
    ];

    return (
      <div className='space-y-4 mt-2' role='group' aria-label='Select multiple options'>
        {optionsList.map((option: any, index: number) => {
          const letter = String.fromCharCode(65 + index);
          const optText = formatOptionDisplay(option);
          const rawOptValue =
            typeof option === 'string'
              ? option
              : option?.id || option?.text || option?.value || index.toString();
          const optValue = typeof rawOptValue === 'string' ? rawOptValue : String(rawOptValue);
          const isSelected =
            selectedOptionIds.includes(optValue) ||
            selectedOptionIds.includes(optText) ||
            (typeof option === 'object' && option?.id && selectedOptionIds.includes(option.id));

          const htmlId = `msq-${currentQuestion.id}-${index}`;
          const palette = palettes[index % palettes.length];

          return (
            <label
              key={`opt-${currentQuestion.id}-${index}`}
              htmlFor={htmlId}
              className={`
                flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-150 focus-within:ring-2 focus-within:ring-slate-300 shadow-sm
                ${
                  isSelected
                    ? palette.boxSelected
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 bg-white text-slate-800'
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
                flex items-center justify-center w-8 h-8 rounded-md border-2 mr-4 shrink-0 transition-colors text-base font-bold
                ${
                  isSelected
                    ? `${palette.circle} border-transparent`
                    : 'border-slate-300 bg-white text-slate-400'
                }
              `}
                aria-hidden='true'
              >
                {isSelected ? (
                  <svg className='w-5 h-5 text-current' viewBox='0 0 20 20' fill='currentColor'>
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                ) : (
                  letter
                )}
              </div>
              <span className='text-sm sm:text-[15px] font-medium leading-relaxed break-words text-slate-700'>
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
              questionId={currentQuestion.id}
              testInstanceId={testInstance?.id}
              initialCode={initialCode}
              initialLanguage={initialLanguage}
              initialRunResponse={initialRunResponse}
              initialSubmitResponse={initialSubmitResponse}
              initialActiveTab={initialActiveTab}
              onChange={handleCompilerChange}
            />
          </div>
        );
      default:
        return renderMCQ();
    }
  };

  const isCoding =
    currentQuestion.type?.toUpperCase() === 'CODING' ||
    Boolean((currentQuestion as any).codingData) ||
    Boolean((currentQuestion as any).questionSnapshot?.codingData);

  if (isCoding) {
    const qSnapshot = (currentQuestion as any).questionSnapshot || {};
    const codingData =
      (currentQuestion as any).codingData ||
      qSnapshot.codingData ||
      {};

    const qText = (
      currentQuestion.text ||
      (currentQuestion as any).questionStatement ||
      qSnapshot.questionStatement ||
      qSnapshot.questionText ||
      qSnapshot.stem ||
      codingData.narrative ||
      codingData.statement ||
      codingData.problemStatement ||
      codingData.description ||
      parsedInstructions?.narrative ||
      parsedInstructions?.statement ||
      ''
    ).trim();

    const qTitle =
      (currentQuestion as any).questionTitle ||
      qSnapshot.questionTitle ||
      codingData.title ||
      '';

    const funcSig =
      codingData.functionSignature ||
      codingData.signature ||
      qSnapshot.functionSignature ||
      null;

    const inputDesc =
      codingData.inputDescription ||
      qSnapshot.inputDescription ||
      null;

    const outputDesc =
      codingData.outputDescription ||
      qSnapshot.outputDescription ||
      null;

    // Collect all possible sample test cases
    let rawTestCases: any[] = [];
    if (parsedInstructions?.testCases) {
      if (typeof parsedInstructions.testCases === 'string') {
        try {
          rawTestCases = JSON.parse(parsedInstructions.testCases);
        } catch {
          rawTestCases = [];
        }
      } else if (Array.isArray(parsedInstructions.testCases)) {
        rawTestCases = parsedInstructions.testCases;
      }
    }

    if (rawTestCases.length === 0) {
      const candidates =
        codingData.examples ||
        codingData.exampleWalkthrough ||
        codingData.sampleTestCases ||
        (currentQuestion as any).testCases ||
        (currentQuestion as any).sampleTestCases ||
        qSnapshot.testCases ||
        qSnapshot.sampleTestCases ||
        [];
      if (Array.isArray(candidates)) {
        rawTestCases = candidates;
      }
    }

    const sampleCases = rawTestCases.map((tc: any) => {
      let inp = tc.input;
      if (typeof inp === 'object' && inp !== null) {
        if (typeof inp.stdin === 'string') {
          inp = inp.stdin.trim();
        } else {
          // Convert object to clean plain-text competitive programming lines instead of JSON
          const lines: string[] = [];
          for (const key of Object.keys(inp)) {
            const val = inp[key];
            if (val === null || val === undefined) continue;
            if (Array.isArray(val)) {
              if (val.length === 0) {
                lines.push('0');
              } else if (typeof val[0] === 'object' && val[0] !== null) {
                lines.push(String(val.length));
                for (const item of val) {
                  lines.push(Object.values(item).join(' '));
                }
              } else {
                lines.push(val.join(' '));
              }
            } else if (typeof val === 'object') {
              lines.push(Object.values(val).join(' '));
            } else {
              lines.push(String(val));
            }
          }
          inp = lines.join('\n');
        }
      } else if (typeof inp === 'string') {
        const trimmed = inp.trim();
        if (
          (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))
        ) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object') {
              if (typeof parsed.stdin === 'string') {
                inp = parsed.stdin.trim();
              } else {
                const lines: string[] = [];
                for (const key of Object.keys(parsed)) {
                  const val = parsed[key];
                  if (val === null || val === undefined) continue;
                  if (Array.isArray(val)) {
                    if (val.length === 0) {
                      lines.push('0');
                    } else if (typeof val[0] === 'object' && val[0] !== null) {
                      lines.push(String(val.length));
                      for (const item of val) {
                        lines.push(Object.values(item).join(' '));
                      }
                    } else {
                      lines.push(val.join(' '));
                    }
                  } else if (typeof val === 'object') {
                    lines.push(Object.values(val).join(' '));
                  } else {
                    lines.push(String(val));
                  }
                }
                inp = lines.join('\n');
              }
            }
          } catch {
            // Keep as-is
          }
        }
      }

      let out = tc.output ?? tc.expectedOutput ?? tc.result;
      if (typeof out === 'object' && out !== null) {
        if ('result' in out) out = out.result;
        else if ('indices' in out && Array.isArray(out.indices)) out = out.indices.join(' ');
        else if ('index' in out) out = out.index;
        else if ('ans' in out) out = out.ans;
        else if ('answer' in out) out = out.answer;
        else if (Array.isArray(out)) out = out.join(' ');
        else out = Object.values(out).join(' ');
      } else if (typeof out === 'string') {
        const trimmed = out.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object') {
              if ('result' in parsed) out = parsed.result;
              else if ('indices' in parsed && Array.isArray(parsed.indices)) out = parsed.indices.join(' ');
              else if ('index' in parsed) out = parsed.index;
              else if ('ans' in parsed) out = parsed.ans;
              else if ('answer' in parsed) out = parsed.answer;
              else out = Object.values(parsed).join(' ');
            }
          } catch {
            // Keep as-is
          }
        }
      }

      return {
        input: String(inp ?? ''),
        output: String(out ?? ''),
        explanation: tc.explanation || null,
      };
    });

    const constraints =
      parsedInstructions?.constraints ||
      codingData.constraints ||
      qSnapshot.constraints ||
      (currentQuestion as any).constraints ||
      null;

    // Check if qText already embeds samples or constraints to avoid redundant duplication
    const hasEmbeddedSamples =
      qText.toLowerCase().includes('### sample input') ||
      qText.toLowerCase().includes('sample input:') ||
      qText.toLowerCase().includes('### examples') ||
      qText.toLowerCase().includes('examples:');

    const hasEmbeddedConstraints =
      qText.toLowerCase().includes('### constraints') ||
      qText.toLowerCase().includes('constraints:');

    return (
      <div className='flex flex-col flex-1 w-full h-full overflow-hidden bg-white select-none'>
        {/* Question Number Header Bar */}
        <div className='bg-white px-4 py-3 border-b border-gray-300 flex items-center justify-between shrink-0'>
          <div className='flex items-center gap-3'>
            <h2 className='text-base md:text-lg font-bold text-gray-900 tracking-tight font-sans'>
              Question {displaySectionQuestionNo} of {sectionTotalQuestions}
            </h2>
            <span className='text-xs font-semibold text-slate-400 hidden sm:inline'>
              • (Overall #{overallQuestionNo})
            </span>
            {qTitle && (
              <span className='text-xs font-semibold text-slate-600 hidden md:inline'>
                • {qTitle}
              </span>
            )}
          </div>
          <span className='text-xs font-bold text-gray-600 bg-gray-100 border border-gray-300 px-3 py-0.5 rounded-sm uppercase tracking-wider'>
            {currentQuestion.type}
          </span>
        </div>

        <div className='flex flex-col flex-1 w-full overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar select-text'>
          {/* Structured Coding Problem Statement Card */}
          <div className='bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 shrink-0 text-slate-800 font-sans'>
            {qText ? (
              <MarkdownRenderer
                content={qText}
                className='text-sm sm:text-base font-normal leading-relaxed text-slate-700'
              />
            ) : (
              <p className='text-slate-400 italic text-sm'>No question statement available.</p>
            )}

            {/* FUNCTION SIGNATURE */}
            {funcSig && (
              <div className='space-y-1.5 pt-1'>
                <h4 className='text-[11px] font-bold tracking-wider uppercase text-slate-500'>
                  FUNCTION SIGNATURE
                </h4>
                <div className='inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-xs sm:text-sm font-semibold px-3 py-1 rounded-md shadow-2xs'>
                  {funcSig}
                </div>
              </div>
            )}

            {/* INPUT DESCRIPTION */}
            {inputDesc && (
              <div className='space-y-1.5'>
                <h4 className='text-[11px] font-bold tracking-wider uppercase text-slate-500'>
                  INPUT FORMAT
                </h4>
                <div className='text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80'>
                  {inputDesc}
                </div>
              </div>
            )}

            {/* OUTPUT DESCRIPTION */}
            {outputDesc && (
              <div className='space-y-1.5'>
                <h4 className='text-[11px] font-bold tracking-wider uppercase text-slate-500'>
                  OUTPUT FORMAT
                </h4>
                <div className='text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80'>
                  {outputDesc}
                </div>
              </div>
            )}

            {/* SAMPLE TEST CASES / EXAMPLES */}
            {!hasEmbeddedSamples && sampleCases.length > 0 && (
              <div className='space-y-3 pt-2'>
                <h4 className='text-[11px] font-bold tracking-wider uppercase text-slate-500'>
                  SAMPLE TEST CASES
                </h4>
                <div className='space-y-3'>
                  {sampleCases.map((sample, idx) => (
                    <div
                      key={idx}
                      className='rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs font-sans'
                    >
                      <span className='font-bold text-slate-700'>
                        Sample Case #{idx + 1}
                      </span>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <div className='space-y-1'>
                          <span className='text-[10px] font-bold uppercase tracking-wider text-slate-500'>
                            Sample Input:
                          </span>
                          <pre className='bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap select-all'>
                            {sample.input || '(empty)'}
                          </pre>
                        </div>
                        <div className='space-y-1'>
                          <span className='text-[10px] font-bold uppercase tracking-wider text-slate-500'>
                            Sample Output:
                          </span>
                          <pre className='bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap select-all'>
                            {sample.output || '(empty)'}
                          </pre>
                        </div>
                      </div>
                      {sample.explanation && (
                        <p className='text-slate-600 text-xs italic pt-0.5'>
                          <span className='font-semibold'>Explanation:</span> {sample.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONSTRAINTS CARD */}
            {!hasEmbeddedConstraints && constraints && (
              <div className='p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 text-xs space-y-1.5 mt-2'>
                <h4 className='font-bold text-amber-900 text-[11px] uppercase tracking-wider'>
                  CONSTRAINTS
                </h4>
                <div className='font-mono text-slate-800 text-xs font-semibold whitespace-pre-wrap'>
                  {constraints}
                </div>
              </div>
            )}
          </div>

          {/* Full Width Embedded Compiler */}
          <div className='w-full flex-1 min-h-[550px]'>
            <EmbeddedCompiler
              key={currentQuestion.id}
              questionId={currentQuestion.id}
              testInstanceId={testInstance?.id}
              initialCode={initialCode}
              initialLanguage={initialLanguage}
              initialRunResponse={initialRunResponse}
              initialSubmitResponse={initialSubmitResponse}
              initialActiveTab={initialActiveTab}
              onChange={handleCompilerChange}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col md:flex-row flex-1 w-full h-full overflow-hidden gap-4 lg:gap-6 select-none bg-transparent'>
      
      {/* Left Pane - Question Card */}
      <div className='w-full md:w-1/2 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden shrink-0'>
        {/* Header Ribbon */}
        <div className='flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100'>
          <div className='bg-[#4939a3] text-white text-xs font-bold px-4 py-1.5 rounded-r-full -ml-5 shadow-sm'>
            Q {displaySectionQuestionNo} OF {sectionTotalQuestions}
          </div>
          <span className='text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md uppercase tracking-wider'>
            {currentQuestion.type}
          </span>
        </div>
        
        {/* Question Content */}
        <div className='flex-1 overflow-y-auto p-5 custom-scrollbar select-text flex flex-col space-y-6'>
          <div className='flex items-center gap-2 text-slate-800 font-bold mb-1'>
            <div className='w-5 h-5 bg-[#4939a3] rounded-md text-white flex items-center justify-center text-xs'>?</div>
            <span>Question</span>
          </div>
          
          <div className='text-slate-700 space-y-5 font-sans leading-relaxed'>
            {currentQuestion.stem &&
              currentQuestion.stem.trim().toLowerCase() !==
                (currentQuestion.text || '').trim().toLowerCase() && (
                <div className='text-[15px] sm:text-[16px]'>
                  <div className='font-bold text-sm text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'></path></svg>
                    Statements:
                  </div>
                  <MarkdownRenderer content={currentQuestion.stem} />
                </div>
              )}

            <div className='text-[15px] sm:text-[16px]'>
              <MarkdownRenderer
                content={currentQuestion.text?.replace(/^Question\s*:\s*/i, '').trim()}
              />
            </div>

            {parsedInstructions?.constraints && (
              <div className='p-4 rounded-md border border-amber-200 bg-amber-50 text-sm'>
                <h4 className='font-semibold text-amber-900 mb-2'>Constraints</h4>
                <div className='font-mono text-slate-800 whitespace-pre-wrap'>
                  {parsedInstructions.constraints}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Pane - Options Card */}
      <div className='w-full md:w-1/2 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden shrink-0'>
        <div className='flex-1 overflow-y-auto p-5 custom-scrollbar select-text flex flex-col'>
          <div className='bg-[#f8f6ff] text-[#4939a3] font-bold text-sm rounded-lg px-4 py-3 flex items-center gap-2 mb-5'>
            <span className='text-lg'>✨</span> Choose the correct option
          </div>
          
          <div className='w-full'>
            {renderQuestionContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
