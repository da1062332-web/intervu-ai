'use client';

import { useExecutionStore } from '../stores/execution.store';
import { cn } from '@/lib/utils';

export function SectionTabs() {
  const { testInstance, currentQuestionIndex, jumpToQuestion } = useExecutionStore();

  if (!testInstance || !testInstance.sections || testInstance.sections.length <= 1) return null;

  // Determine active section based on current question
  let activeSectionId = testInstance.sections[0].id;
  let runningCount = 0;
  
  const sectionStartIndices: Record<string, number> = {};

  for (const section of testInstance.sections) {
    sectionStartIndices[section.id] = runningCount;
    if (currentQuestionIndex >= runningCount && currentQuestionIndex < runningCount + section.questions.length) {
      activeSectionId = section.id;
    }
    runningCount += section.questions.length;
  }

  return (
    <div className='flex gap-2 mb-4 border-b pb-2 overflow-x-auto hide-scrollbar'>
      {testInstance.sections.map((section) => {
        const isActive = section.id === activeSectionId;
        return (
          <button
            key={section.id}
            onClick={() => jumpToQuestion(sectionStartIndices[section.id])}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
              isActive
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {section.title}
          </button>
        );
      })}
    </div>
  );
}
