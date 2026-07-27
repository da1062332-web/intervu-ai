'use client';

import { useExecutionStore } from '../stores/execution.store';

export function ExecutionHeader() {
  const { testInstance, currentQuestionIndex, questions } = useExecutionStore();

  if (!testInstance) return null;

  const currentQuestionId = questions[currentQuestionIndex]?.id;
  const currentSection = testInstance.sections.find((s) =>
    s.questions.some((q) => q.id === currentQuestionId),
  );

  return (
    <header className='sticky top-0 z-50 w-full bg-[#26773e] border-b border-[#1c5a2e] shadow-sm select-none'>
      <div className='flex items-center justify-between h-14 w-full px-4 md:px-6'>
        {/* Left - Assessment Title & Section */}
        <div className='flex items-center gap-3 overflow-hidden pr-4 flex-1'>
          <h1 className='text-base sm:text-xl font-bold text-white tracking-wide truncate font-sans'>
            {testInstance.assessmentName || 'Assessment'}
            {currentSection ? ` : ${currentSection.title}` : ''}
          </h1>
        </div>

        {/* Right - Company Logo Emblem */}
        <div className='flex items-center gap-2.5 shrink-0'>
          <div className='w-8 h-8 rounded-sm bg-white text-[#26773e] font-black text-xl flex items-center justify-center shadow-xs border border-green-200'>
            V
          </div>
          <div className='flex flex-col text-white leading-none'>
            <span className='font-extrabold text-base tracking-wide uppercase font-sans'>InterVu AI</span>
            <span className='text-[10px] font-semibold tracking-wider text-green-100 uppercase mt-0.5'>Skill Sandbox</span>
          </div>
        </div>
      </div>
    </header>
  );
}
