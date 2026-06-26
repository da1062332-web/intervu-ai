'use client';

import React from 'react';
import { BookOpen, CheckCircle2, Tag } from 'lucide-react';

interface TopicInfo {
  topicName: string;
  topicCode: string;
  topicStatus: string;
  weightagePercentage?: number | null;
}

interface SectionWithTopics {
  name: string;
  code: string;
  topics?: TopicInfo[];
  topicCount?: number;
}

interface TopicSummaryProps {
  sections: SectionWithTopics[];
}

/**
 * Task Group 9 — TopicSummary
 * Displays topic coverage per section — which topics are mapped and their weightages.
 */
export function TopicSummary({ sections }: TopicSummaryProps) {
  const totalTopics = sections.reduce((sum, s) => sum + (s.topics?.length ?? s.topicCount ?? 0), 0);
  const activeTopics = sections.reduce(
    (sum, s) => sum + (s.topics?.filter((t) => t.topicStatus === 'ACTIVE').length ?? 0),
    0,
  );

  return (
    <div className='border rounded-xl overflow-hidden bg-background shadow-sm'>
      <div className='px-5 py-4 border-b bg-muted/20 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <BookOpen className='w-4 h-4 text-muted-foreground' />
          <h4 className='font-semibold text-sm'>Topic Coverage</h4>
        </div>
        <div className='text-xs text-muted-foreground'>
          <span className='text-green-600 dark:text-green-400 font-medium'>
            {activeTopics} active
          </span>{' '}
          / {totalTopics} total
        </div>
      </div>

      {sections.length === 0 ? (
        <div className='p-6 text-center text-sm text-muted-foreground'>No sections configured.</div>
      ) : (
        <div className='divide-y'>
          {sections.map((section) => (
            <div key={section.code} className='px-5 py-4'>
              <div className='flex items-center gap-2 mb-3'>
                <Tag className='w-3.5 h-3.5 text-muted-foreground' />
                <span className='text-sm font-medium'>{section.name}</span>
                <span className='text-xs text-muted-foreground'>
                  ({section.topics?.length ?? section.topicCount ?? 0} topics)
                </span>
              </div>

              {(!section.topics || section.topics.length === 0) &&
              (section.topicCount ?? 0) === 0 ? (
                <p className='text-xs text-muted-foreground italic ml-5'>
                  No topics mapped to this section.
                </p>
              ) : section.topics && section.topics.length > 0 ? (
                <div className='ml-5 flex flex-wrap gap-2'>
                  {section.topics.map((topic, idx) => (
                    <div
                      key={topic.topicCode ?? idx}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                        topic.topicStatus === 'ACTIVE'
                          ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800/50 dark:text-green-400'
                          : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-800/50 dark:text-red-400'
                      }`}
                    >
                      <CheckCircle2 className='w-3 h-3' />
                      {topic.topicName}
                      {topic.weightagePercentage != null && (
                        <span className='font-medium'>{topic.weightagePercentage}%</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-xs text-muted-foreground ml-5'>
                  {section.topicCount} topics mapped.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
