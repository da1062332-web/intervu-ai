'use client';

import { useExecutionStore } from '../stores/execution.store';
import { TimerWidget } from './TimerWidget';
import { Badge } from '@/components/ui/badge';

export function ExecutionHeader() {
  const { testInstance, currentQuestionIndex, questions } = useExecutionStore();

  if (!testInstance) return null;

  // Derive current section based on question if sections were strictly separated,
  // but for our simple prototype we can just show the section title of the first section,
  // or figure out which section this question belongs to.
  // Since we flattened the questions in initializeTest, we can find the section matching the current question.
  const currentQuestionId = questions[currentQuestionIndex]?.id;
  const currentSection = testInstance.sections.find((s) =>
    s.questions.some((q) => q.id === currentQuestionId),
  );

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex items-center justify-between h-16 max-w-7xl px-4 md:px-8 mx-auto'>
        <div className='flex flex-col'>
          <h1 className='text-sm md:text-base font-semibold truncate max-w-[200px] md:max-w-sm'>
            {testInstance.assessmentName}
          </h1>
          <div className='flex items-center gap-2 text-xs md:text-sm text-muted-foreground mt-0.5'>
            <span className='truncate max-w-[120px] md:max-w-none'>
              {testInstance.candidateName}
            </span>
            {currentSection && (
              <>
                <span className='hidden md:inline'>•</span>
                <Badge variant='secondary' className='hidden md:inline-flex text-xs font-normal'>
                  {currentSection.title}
                </Badge>
              </>
            )}
          </div>
        </div>

        <TimerWidget />
      </div>
      {currentSection && (
        <div className='md:hidden border-t bg-muted/30 px-4 py-2'>
          <Badge variant='secondary' className='text-xs font-normal'>
            {currentSection.title}
          </Badge>
        </div>
      )}
    </header>
  );
}
