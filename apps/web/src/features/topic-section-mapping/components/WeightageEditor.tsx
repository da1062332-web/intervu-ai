'use client';

import { useTopicMappingStore } from '../store/topic-mapping.store';
import { useWeightages, useUpdateWeightage, useCreateWeightage } from '@/services/topic-weightages/hooks';
import { Input } from '@/components/ui/input';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { Skeleton } from '@/components/ui/skeleton';

interface WeightageEditorProps {
  sectionId: string;
  topics: SectionTopicResponse[];
}

export function WeightageEditor({ sectionId, topics }: WeightageEditorProps) {
  const { data: weightagesData = [], isLoading, isError } = useWeightages(sectionId);
  const updateWeightage = useUpdateWeightage(sectionId);
  const createWeightage = useCreateWeightage(sectionId);
  const weightages = useTopicMappingStore((state) => state.weightages);
  const updateLocalWeightage = useTopicMappingStore((state) => state.updateWeightage);

  if (isLoading) {
    return (
      <div className='space-y-4 border rounded-lg p-4'>
        <Skeleton className='h-8 w-1/3' />
        <Skeleton className='h-8 w-1/3' />
      </div>
    );
  }

  if (isError) {
    return <p className='text-red-500'>Error loading weightages.</p>;
  }

  if (topics.length === 0) {
    return null;
  }

  const handleBlur = (topicId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

    const existing = weightagesData.find(w => w.topicId === topicId);
    if (existing) {
      if (existing.weightagePercentage !== numValue) {
        updateWeightage.mutate({ id: existing.id, weightagePercentage: numValue });
      }
    } else {
      createWeightage.mutate({ topicId, weightagePercentage: numValue });
    }
  };

  const handleChange = (topicId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      updateLocalWeightage(topicId, numValue);
    }
  };

  const totalWeightage = Object.values(weightages).reduce((sum, val) => sum + (val || 0), 0);
  const is100 = totalWeightage === 100;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium'>Weightage Configuration</h3>
        <div className={`font-semibold ${is100 ? 'text-green-600' : 'text-red-600'}`}>
          Current Total: {totalWeightage}%
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {topics.map(topic => {
          const topicId = topic.topicId;
          const currentVal = weightages[topicId] !== undefined ? weightages[topicId] : '';
          return (
            <div key={topicId} className='flex items-center justify-between p-3 border rounded-md bg-background'>
              <span className='font-medium'>{topic.topicName}</span>
              <div className='flex items-center gap-2 w-24'>
                <Input 
                  type='number' 
                  min={0} 
                  max={100}
                  value={currentVal}
                  onChange={(e) => handleChange(topicId, e.target.value)}
                  onBlur={(e) => handleBlur(topicId, e.target.value)}
                  className='text-right'
                />
                <span className='text-muted-foreground'>%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
