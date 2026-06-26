'use client';

import React from 'react';
import { Layers, Hash, Clock, BookOpen } from 'lucide-react';

interface SectionInfo {
  name: string;
  code: string;
  questionCount: number;
  durationMinutes: number;
  topicCount: number;
}

interface SectionSummaryProps {
  sections: SectionInfo[];
  totalQuestions?: number;
}

/**
 * Task Group 9 — SectionSummary
 * Displays section breakdown as a list of cards with progress bars.
 */
export function SectionSummary({ sections, totalQuestions }: SectionSummaryProps) {
  const maxQuestions = Math.max(...sections.map((s) => s.questionCount), 1);
  const total = totalQuestions ?? sections.reduce((sum, s) => sum + s.questionCount, 0);

  return (
    <div className='border rounded-xl overflow-hidden bg-background shadow-sm'>
      <div className='px-5 py-4 border-b bg-muted/20 flex items-center gap-2'>
        <Layers className='w-4 h-4 text-muted-foreground' />
        <h4 className='font-semibold text-sm'>Sections ({sections.length})</h4>
      </div>

      {sections.length === 0 ? (
        <div className='p-6 text-center text-sm text-muted-foreground'>No sections configured.</div>
      ) : (
        <div className='divide-y'>
          {sections.map((section, idx) => {
            const percentage = Math.round((section.questionCount / total) * 100);
            return (
              <div key={section.code ?? idx} className='px-5 py-4'>
                <div className='flex items-center justify-between mb-2'>
                  <div>
                    <span className='text-sm font-medium'>{section.name}</span>
                    <span className='ml-2 text-xs text-muted-foreground font-mono'>
                      ({section.code})
                    </span>
                  </div>
                  <span className='text-xs text-muted-foreground'>{percentage}%</span>
                </div>

                {/* Progress bar */}
                <div className='w-full bg-muted rounded-full h-1.5 mb-3'>
                  <div
                    className='bg-indigo-500 rounded-full h-1.5 transition-all duration-500'
                    style={{ width: `${(section.questionCount / maxQuestions) * 100}%` }}
                  />
                </div>

                <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Hash className='w-3 h-3' />
                    {section.questionCount} questions
                  </div>
                  <div className='flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    {section.durationMinutes} min
                  </div>
                  <div className='flex items-center gap-1'>
                    <BookOpen className='w-3 h-3' />
                    {section.topicCount} topic{section.topicCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
