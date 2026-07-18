'use client';

import React, { useState, useEffect } from 'react';
import { useSections } from '@/services/exam-sections/hooks';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { useWeightages } from '@/services/topic-weightages/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronRight } from 'lucide-react';

interface TopicsSummaryTabProps {
  configId: string;
}

export function TopicsSummaryTab({ configId }: TopicsSummaryTabProps) {
  const { data: sections = [], isLoading: isLoadingSections } = useSections(configId);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  
  // Auto-select first section
  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const { data: topicsData, isLoading: isLoadingTopics } = useSectionTopics(selectedSectionId);
  const { data: weightages = [], isLoading: isLoadingWeightages } = useWeightages(selectedSectionId);
  const topics = Array.isArray(topicsData) ? topicsData : (topicsData as any)?.data || [];
  
  const { data: weightagesData = [] } = useWeightages(selectedSectionId);

  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  const weightageMap = weightages.reduce(
    (map: Record<string, number>, weightage) => {
      map[weightage.topicId] = weightage.weightagePercentage;
      return map;
    },
    {},
  );

  // Auto-select first topic
  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].topicId);
    } else if (topics.length === 0) {
      setSelectedTopicId('');
    }
  }, [topics, selectedTopicId]);

  if (isLoadingSections) {
    return <Skeleton className="w-full h-64" />;
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        title="No Sections"
        description="You must create sections and assign topics to them before managing concepts."
      />
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4'>
      <div className='space-y-1'>
        <h3 className='text-2xl font-semibold tracking-tight'>Topics Summary</h3>
        <p className='text-muted-foreground'>
          Review the topic distribution assigned to your sections.
        </p>
      </div>

      <div className='flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden min-h-[400px]'>
        {/* Topics Main Area */}
        <div className='flex-1 p-6 flex flex-col'>
          <div className='flex items-center justify-between mb-6 gap-4 border-b pb-4'>
            <h3 className='font-semibold text-lg whitespace-nowrap'>Assigned Topics</h3>
            
            {/* Section Filter Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-medium">Section:</span>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="flex h-9 min-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingTopics ? (
            <div className='space-y-3'>
              <Skeleton className='w-full h-12 rounded-lg' />
              <Skeleton className='w-full h-12 rounded-lg' />
              <Skeleton className='w-full h-12 rounded-lg' />
            </div>
          ) : topics.length === 0 ? (
            <div className='flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/5 p-8 text-center'>
              <p className='text-muted-foreground font-medium'>No topics mapped to this section.</p>
              <p className='text-sm text-muted-foreground mt-1'>Topics must be assigned in the Blueprint tab.</p>
            </div>
          ) : (
            <div className='grid gap-3'>
              {topics.map((topic: any) => (
                <div key={topic.topicId} className='p-4 border rounded-lg bg-background flex justify-between items-center shadow-sm hover:shadow transition-shadow'>
                  <div>
                    <p className='font-medium text-base'>{topic.topicName || topic.topic || topic.name || 'Unnamed'}</p>
                    <p className='text-sm text-muted-foreground mt-0.5'>Weightage: {weightageMap[topic.topicId] ?? 0}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
