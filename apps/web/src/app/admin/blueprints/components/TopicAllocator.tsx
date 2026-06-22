'use client';

import { useBlueprintBuilderStore } from '@/store/blueprint-builder.store';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import type { BlueprintSectionPayload } from '@/services/blueprints/types';

interface TopicAllocatorProps {
  sectionId: string;
}

export function TopicAllocator({ sectionId }: TopicAllocatorProps) {
  const { data: topics, isLoading, isError } = useSectionTopics(sectionId);
  const sectionsState = useBlueprintBuilderStore((state) => state.sections);
  const updateSection = useBlueprintBuilderStore((state) => state.updateSection);

  const sectionState = sectionsState.find((s) => s.sectionId === sectionId) as
    | BlueprintSectionPayload
    | undefined;
  const allocations = sectionState?.topicAllocations || [];

  useEffect(() => {
    // If topics are loaded but allocations aren't initialized yet, set them to 0 or an even split
    if (topics && topics.length > 0 && allocations.length === 0) {
      const initialAllocations = topics.map((t) => ({
        topicId: t.topicId,
        percentage: 0,
      }));
      updateSection(sectionId, { topicAllocations: initialAllocations });
    }
  }, [topics, allocations.length, sectionId, updateSection]);

  if (isLoading) {
    return <Skeleton className='h-20 w-full' />;
  }

  if (isError || !topics || topics.length === 0) {
    return <p className='text-sm text-muted-foreground'>No topics mapped to this section.</p>;
  }

  const handleUpdate = (topicId: string, percentage: number) => {
    const newAllocations = allocations.map((a) => {
      if (a.topicId === topicId) {
        return { ...a, percentage };
      }
      return a;
    });

    // If it's a new topic being interacted with and not in the array
    if (!newAllocations.find((a) => a.topicId === topicId)) {
      newAllocations.push({ topicId, percentage });
    }

    updateSection(sectionId, { topicAllocations: newAllocations });
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.percentage || 0), 0);
  const isValid = totalAllocated === 100;

  return (
    <div className='space-y-4 border p-4 rounded-md bg-white dark:bg-gray-900'>
      <div className='flex justify-between items-center'>
        <Label className='font-semibold text-gray-800 dark:text-gray-200'>
          Topic Allocation (%)
        </Label>
        <span className={`text-xs font-bold ${isValid ? 'text-emerald-600' : 'text-red-500'}`}>
          Sum: {totalAllocated}% / 100%
        </span>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {topics.map((topic) => {
          const alloc = allocations.find((a) => a.topicId === topic.topicId);
          const currentVal = alloc?.percentage || 0;

          return (
            <div key={topic.topicId} className='space-y-2'>
              <div className='flex justify-between text-xs'>
                <span className='font-medium text-gray-700 dark:text-gray-300'>
                  {topic.topicName}
                </span>
                <span className='font-bold text-indigo-600'>{currentVal}%</span>
              </div>
              <Input
                type='number'
                min='0'
                max='100'
                value={currentVal || ''}
                onChange={(e) => handleUpdate(topic.topicId, parseInt(e.target.value) || 0)}
                className='w-full'
                placeholder='0'
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
