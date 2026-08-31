'use client';

import { useTopicMappingStore } from '../store/topic-mapping.store';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TopicMappingHealthWidgetProps {
  topics: SectionTopicResponse[];
}

export function TopicMappingHealthWidget({ topics }: TopicMappingHealthWidgetProps) {
  const weightages = useTopicMappingStore((state) => state.weightages);

  const hasTopicsAssigned = topics.length > 0;

  const totalWeightage = Object.values(weightages).reduce((sum, val) => sum + (val || 0), 0);
  const is100Percent = totalWeightage === 100;

  const isReady = hasTopicsAssigned && is100Percent;

  return (
    <div className='p-6 border rounded-lg bg-background shadow-sm space-y-4'>
      <h3 className='text-lg font-medium'>Topic Mapping Health</h3>

      <ul className='space-y-3'>
        <li className='flex items-center gap-3'>
          {hasTopicsAssigned ? (
            <CheckCircle2 className='w-5 h-5 text-green-500' />
          ) : (
            <XCircle className='w-5 h-5 text-red-500' />
          )}
          <span className={hasTopicsAssigned ? 'text-foreground' : 'text-muted-foreground'}>
            Topics Assigned
          </span>
        </li>
        <li className='flex items-center gap-3'>
          {is100Percent ? (
            <CheckCircle2 className='w-5 h-5 text-green-500' />
          ) : (
            <XCircle className='w-5 h-5 text-red-500' />
          )}
          <span className={is100Percent ? 'text-foreground' : 'text-muted-foreground'}>
            Weightages Total 100%
          </span>
        </li>
      </ul>

      <div
        className={`p-3 rounded-md border mt-4 ${isReady ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'}`}
      >
        <p
          className={`font-semibold flex items-center gap-2 ${isReady ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
        >
          {isReady ? (
            <>
              <CheckCircle2 className='w-4 h-4' /> Ready For Blueprint
            </>
          ) : (
            <>
              <XCircle className='w-4 h-4' /> Invalid Configuration
            </>
          )}
        </p>
      </div>
    </div>
  );
}
