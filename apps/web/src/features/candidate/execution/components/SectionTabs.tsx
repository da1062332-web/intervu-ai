'use client';

import { useExecutionStore } from '../stores/execution.store';
import { cn } from '@/lib/utils';

export function SectionTabs() {
  const { testInstance, currentQuestionIndex, jumpToQuestion } = useExecutionStore();

  if (!testInstance || !testInstance.sections || testInstance.sections.length === 0) return null;

  const showTabs = testInstance.sections.length > 1;

  // Determine active section based on current question
  let activeSectionId = testInstance.sections[0].id;
  let runningCount = 0;

  const sectionStartIndices: Record<string, number> = {};

  for (const section of testInstance.sections) {
    sectionStartIndices[section.id] = runningCount;
    if (
      currentQuestionIndex >= runningCount &&
      currentQuestionIndex < runningCount + section.questions.length
    ) {
      activeSectionId = section.id;
    }
    runningCount += section.questions.length;
  }

  // Calculate Progress
  const { questions, answers } = useExecutionStore.getState();
  const total = questions.length;
  let answered = 0;
  Object.values(answers).forEach((ans) => {
    if (
      ans.status !== 'MARKED_FOR_REVIEW' &&
      (ans.selectedOptionId || (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) || ans.textResponse)
    ) {
      answered++;
    }
  });
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className='flex justify-between items-end mb-4 border-b pb-2'>
      <div className='flex gap-2 overflow-x-auto hide-scrollbar'>
        {showTabs && testInstance.sections.map((section) => {
          const isActive = section.id === activeSectionId;
          return (
            <button
              key={section.id}
              onClick={() => jumpToQuestion(sectionStartIndices[section.id])}
              className={cn(
                'px-6 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border-t border-x',
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {section.title}
            </button>
          );
        })}
      </div>
      
      {/* Progress Bar at Right Corner */}
      <div className='hidden md:flex items-center gap-3 w-48 mb-2 mr-2 ml-auto'>
        <span className='text-xs font-medium text-muted-foreground'>Progress</span>
        <div className='flex-1 h-2 bg-muted rounded-full overflow-hidden'>
          <div
            className='h-full bg-primary transition-all duration-300 ease-in-out'
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className='text-xs font-medium'>{percentage}%</span>
      </div>
    </div>
  );
}
