'use client';

import { useExecutionStore } from '../stores/execution.store';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

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
    requestSectionChange,
    lockedSectionKeys,
    sectionTimingEnabled,
    sectionRemainingTime,
    currentSectionIndex,
  } = useExecutionStore();

  if (!testInstance || !testInstance.sections || testInstance.sections.length === 0) return null;

  // In standard CBT exams like TCS NQT, we show the section buttons even if there is just 1 section
  let runningCount = 0;
  const sectionStartIndices: Record<string, number> = {};

  for (const section of testInstance.sections) {
    sectionStartIndices[section.id] = runningCount;
    runningCount += section.questions.length;
  }

  // Active section is authoritatively tracked by currentSectionIndex in the store
  const activeSectionIndex =
    typeof currentSectionIndex === 'number' &&
    currentSectionIndex >= 0 &&
    currentSectionIndex < testInstance.sections.length
      ? currentSectionIndex
      : 0;

  const isTimerWarning =
    sectionTimingEnabled && sectionRemainingTime > 0 && sectionRemainingTime <= 60;

  return (
    <div className='relative border border-gray-300 rounded-sm pt-3 pb-2 px-3 bg-white shadow-xs w-full mb-2.5 shrink-0 select-none'>
      <span className='absolute -top-2.5 left-4 bg-white px-1.5 font-bold text-xs text-gray-800 tracking-wide font-sans'>
        Sections
      </span>

      <div className='flex gap-2 overflow-x-auto hide-scrollbar items-center py-0.5'>
        {testInstance.sections.map((section, idx) => {
          const isActive = idx === activeSectionIndex;
          const isLocked =
            lockedSectionKeys.includes(section.sectionKey) ||
            (sectionTimingEnabled && idx < currentSectionIndex);
          const isCurrentActive = idx === currentSectionIndex && sectionTimingEnabled;

          return (
            <button
              key={section.id}
              onClick={() =>
                !isLocked && !isActive ? requestSectionChange(idx) : undefined
              }
              disabled={isLocked}
              title={isLocked ? 'This section is locked' : section.title}
              className={cn(
                'px-6 py-1.5 text-sm font-bold rounded-sm transition-all whitespace-nowrap border shadow-xs flex items-center gap-2 tracking-wide shrink-0',
                isActive
                  ? 'bg-[#27783f] hover:bg-[#206333] text-white border-[#195027]'
                  : isLocked
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed font-medium'
                    : 'bg-[#d6eafb] hover:bg-[#c2e0f5] text-[#1c4068] border-[#93bae3] font-semibold cursor-pointer',
              )}
            >
              {isLocked ? <Lock className='size-3.5 shrink-0 opacity-70' /> : null}

              <span>{section.title || section.sectionName || `Section ${idx + 1}`}</span>

              {isCurrentActive && isActive && sectionRemainingTime > 0 && (
                <span
                  className={cn(
                    'ml-1.5 text-xs font-mono font-black tabular-nums px-1.5 py-0.5 rounded border shadow-2xs',
                    isTimerWarning
                      ? 'bg-red-600 text-white border-red-700 animate-pulse'
                      : 'bg-black/20 text-white border-white/20',
                  )}
                >
                  {formatTime(sectionRemainingTime)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
