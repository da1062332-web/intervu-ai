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
    return <div className="text-sm text-muted-foreground italic">No topic analysis available.</div>;
  }

  // Sort by score descending
  const sorted = [...topics].sort((a, b) => b.score - a.score);

  return (
    <div className='space-y-4'>
      {sorted.map((t, idx) => (
        <div key={idx} className='space-y-1.5'>
          <div className='flex justify-between items-center text-sm'>
            <span className='font-medium text-foreground'>{t.topic}</span>
            <span className={`font-semibold ${
              t.score >= 80 ? 'text-green-600 dark:text-green-400' :
              t.score >= 50 ? 'text-orange-500' : 'text-red-500'
            }`}>
              {t.score}%
            </span>
          </div>
          <Progress value={t.score} className={`h-2 ${
            t.score >= 80 ? '[&>div]:bg-green-500' :
            t.score >= 50 ? '[&>div]:bg-orange-500' : '[&>div]:bg-red-500'
          }`} />
        </div>
      ))}
    </div>
  );
});
