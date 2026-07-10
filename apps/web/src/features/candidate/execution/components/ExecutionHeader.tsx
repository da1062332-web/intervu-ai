'use client';

import { useExecutionStore } from '../stores/execution.store';
import { TimerWidget } from './TimerWidget';
import { AutosaveIndicator } from './AutosaveIndicator';
import { UnsavedChangesBanner } from './UnsavedChangesBanner';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { Badge } from '@/components/ui/badge';

export function ExecutionHeader() {
  const { testInstance, currentQuestionIndex, questions } = useExecutionStore();

  if (!testInstance) return null;

  const currentQuestionId = questions[currentQuestionIndex]?.id;
  const currentSection = testInstance.sections.find((s) =>
    s.questions.some((q) => q.id === currentQuestionId),
  );

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-white shadow-sm'>
      <div className='container flex items-center justify-between h-16 max-w-[1600px] px-4 md:px-8 mx-auto'>
        {/* Left - Logo & Assessment Info */}
        <div className='flex items-center gap-4 w-1/3'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded bg-primary flex items-center justify-center'>
              <span className='text-white font-bold text-lg'>V</span>
            </div>
            <span className='font-bold text-lg hidden sm:inline-block'>InterVu AI</span>
          </div>
          <div className='hidden md:flex flex-col border-l pl-4'>
            <h1 className='text-sm font-semibold text-foreground truncate max-w-[200px] lg:max-w-[300px]'>
              {testInstance.assessmentName}
            </h1>
            <span className='text-xs text-muted-foreground'>
              Company Assessment
            </span>
          </div>
        </div>

        {/* Center - Progress (or Status) */}
        <div className='hidden md:flex flex-col items-center justify-center w-1/3'>
           <div className='flex items-center gap-4'>
              <ConnectionStatusBadge />
              <AutosaveIndicator />
              <UnsavedChangesBanner />
           </div>
        </div>

        {/* Right - Timer & Candidate Info */}
        <div className='flex items-center justify-end gap-6 w-1/3'>
          <TimerWidget />
          <div className='hidden md:flex items-center gap-3 border-l pl-6'>
            <div className='flex flex-col items-end'>
              <span className='text-sm font-medium text-foreground'>
                {testInstance.candidateName}
              </span>
              <span className='text-xs text-muted-foreground'>Candidate</span>
            </div>
            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm'>
              {testInstance.candidateName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
