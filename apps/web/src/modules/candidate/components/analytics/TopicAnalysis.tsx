'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useTopics } from '@/services/topics/hooks';

interface TopicScore {
  topic: string;
  score: number;
}

interface TopicAnalysisProps {
  topics: TopicScore[];
}

export const TopicAnalysis = React.memo(function TopicAnalysis({ topics }: TopicAnalysisProps) {
  const { data: topicsList } = useTopics(false);

  const topicMap = React.useMemo(() => {
    const map = new Map<string, string>();
    topicsList?.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [topicsList]);

  if (!topics || topics.length === 0) {
    return <div className='text-sm text-muted-foreground italic'>No topic analysis available.</div>;
  }

  // Sort by score descending
  const sorted = [...topics].sort((a, b) => b.score - a.score);

  return (
    <div className='space-y-4'>
      {sorted.map((t, idx) => {
        const displayName = topicMap.get(t.topic) || t.topic;
        return (
          <div key={idx} className='space-y-1.5'>
            <div className='flex justify-between items-center text-sm'>
              <span className='font-medium text-foreground truncate max-w-[80%]' title={displayName}>
                {displayName}
              </span>
              <span
                className={`font-semibold shrink-0 ${
                  t.score >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : t.score >= 50
                      ? 'text-orange-500'
                      : 'text-red-500'
                }`}
              >
                {t.score}%
              </span>
            </div>
            <Progress
              value={t.score}
              className={`h-2 ${
                t.score >= 80
                  ? '[&>div]:bg-green-500'
                  : t.score >= 50
                    ? '[&>div]:bg-orange-500'
                    : '[&>div]:bg-red-500'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
});
