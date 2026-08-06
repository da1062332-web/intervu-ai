'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';

interface TopicScore {
  topic: string;
  score: number;
}

interface TopicAnalysisProps {
  topics: TopicScore[];
}

export const TopicAnalysis = React.memo(function TopicAnalysis({ topics }: TopicAnalysisProps) {
  if (!topics || topics.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-48 text-sm text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/40 p-4 text-center'>
        <p className='font-semibold text-foreground/80'>No topic analysis available</p>
        <p className='text-xs text-muted-foreground mt-1'>Complete assessments to view topic mastery breakdown.</p>
      </div>
    );
  }

  const isUuidOrId = (str: string) => {
    if (!str) return true;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cuidRegex = /^c[a-z0-9]{24}$/i;
    const isHexHash = /^[0-9a-f]{16,}$/i;
    return uuidRegex.test(str.trim()) || cuidRegex.test(str.trim()) || isHexHash.test(str.trim());
  };

  // Filter out raw UUID/ID strings and take TOP 5 topics only
  const validTopics = topics.filter((t) => !isUuidOrId(t.topic));
  const sorted = [...(validTopics.length > 0 ? validTopics : topics)]
    .map((t) => ({
      ...t,
      topic: isUuidOrId(t.topic) ? 'Core Technical Concepts' : t.topic,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className='space-y-4 py-1'>
      {sorted.map((t, idx) => (
        <div key={`${t.topic}-${idx}`} className='space-y-1.5'>
          <div className='flex justify-between items-center text-sm'>
            <span className='font-semibold text-foreground truncate max-w-[78%]' title={t.topic}>
              {t.topic}
            </span>
            <span
              className={`font-extrabold shrink-0 text-xs px-2 py-0.5 rounded-md ${
                t.score >= 80
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : t.score >= 50
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {t.score}%
            </span>
          </div>
          <Progress
            value={t.score}
            className={`h-2.5 rounded-full ${
              t.score >= 80
                ? '[&>div]:bg-emerald-500'
                : t.score >= 50
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-rose-500'
            }`}
          />
        </div>
      ))}
    </div>
  );
});

