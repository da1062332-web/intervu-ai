'use client';

import { useExecutionStore } from '../stores/execution.store';
import { cn } from '@/lib/utils';
import { Lock, Clock } from 'lucide-react';

// Format seconds as MM:SS
function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SectionTabs() {
  const {
    testInstance,
    currentQuestionIndex,
    jumpToQuestion,
    lockedSectionKeys,
    sectionTimingEnabled,
    sectionRemainingTime,
    currentSectionIndex,
  } = useExecutionStore();

  if (!testInstance || !testInstance.sections || testInstance.sections.length === 0) return null;

  const showTabs = testInstance.sections.length > 1;

  // Map questions → section start indices
  let runningCount = 0;
  const sectionStartIndices: Record<string, number> = {};

  for (const section of testInstance.sections) {
    sectionStartIndices[section.id] = runningCount;
    runningCount += section.questions.length;
  }

  // Determine active section by comparing question index
  let activeSectionIndex = 0;
  runningCount = 0;
  for (let i = 0; i < testInstance.sections.length; i++) {
    const section = testInstance.sections[i];
    if (
      currentQuestionIndex >= runningCount &&
      currentQuestionIndex < runningCount + section.questions.length
    ) {
      activeSectionIndex = i;
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

  // Is section timer in warning zone (<= 60s)?
  const isTimerWarning = sectionTimingEnabled && sectionRemainingTime > 0 && sectionRemainingTime <= 60;
  const isTimerCritical = sectionTimingEnabled && sectionRemainingTime > 0 && sectionRemainingTime <= 30;

  return (
    <div className='flex justify-between items-end mb-4 border-b pb-2'>
      <div className='flex gap-2 overflow-x-auto hide-scrollbar'>
        {showTabs &&
          testInstance.sections.map((section, idx) => {
            const isActive = idx === activeSectionIndex;
            const isLocked = lockedSectionKeys.includes(section.sectionKey) || (sectionTimingEnabled && idx < currentSectionIndex);
            const isCompleted = section.status === 'COMPLETED' || section.status === 'LOCKED';
            const isUpcoming = idx > currentSectionIndex && !isActive;
            const isCurrentActive = idx === currentSectionIndex && sectionTimingEnabled;

            return (
              <button
                key={section.id}
                onClick={() => !isLocked ? jumpToQuestion(sectionStartIndices[section.id]) : undefined}
                disabled={isLocked}
                title={isLocked ? 'This section is locked and cannot be revisited' : section.title}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border-t border-x flex items-center gap-1.5',
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : isLocked
                      ? 'bg-muted/40 text-muted-foreground/50 border-border/30 cursor-not-allowed'
                      : isUpcoming
                        ? 'bg-white text-muted-foreground/70 border-border/50 cursor-not-allowed opacity-70'
                        : 'bg-white text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {isLocked ? (
                  <Lock className='size-3 shrink-0 opacity-60' />
                ) : isCompleted ? (
                  <span className='size-2 rounded-full bg-green-500 shrink-0' />
                ) : null}

                <span>{section.title}</span>

                {/* Show section timer on the active section when sectionTimingEnabled */}
                {isCurrentActive && isActive && sectionRemainingTime > 0 && (
                  <span
                    className={cn(
                      'ml-1 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded',
                      isTimerCritical
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : isTimerWarning
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-primary/10 text-primary',
                    )}
                  >
                    {formatTime(sectionRemainingTime)}
                  </span>
                )}
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
