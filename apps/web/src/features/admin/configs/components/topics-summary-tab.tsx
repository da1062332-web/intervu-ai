'use client';

import React, { useState, useEffect } from 'react';
import { useSections } from '@/services/exam-sections/hooks';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { useWeightages } from '@/services/topic-weightages/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ChevronRight, ExternalLink } from 'lucide-react';

import { useConfigWizardStore } from './wizard-store';
import { useBlueprints, useBlueprint } from '@/services/blueprints/hooks';
import { useTopics } from '@/services/topics/hooks';

interface TopicsSummaryTabProps {
  configId: string;
}

export function TopicsSummaryTab({ configId }: TopicsSummaryTabProps) {
  const { data: sections = [], isLoading: isLoadingSections } = useSections(configId);
  const { data: allTopics = [] } = useTopics(false);
  const selectedBlueprintId = useConfigWizardStore((state) => state.getBlueprintId(configId));
  const { data: blueprints } = useBlueprints();
  const selectedBlueprint = blueprints?.find((b) => b.id === selectedBlueprintId);
  const { data: blueprintDetail } = useBlueprint(selectedBlueprintId || '');

  const topicNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    (allTopics || []).forEach((t: any) => {
      if (t.id) {
        map[t.id] = t.name || t.displayName || t.code || t.id;
      }
    });
    return map;
  }, [allTopics]);

  const bpRawSections =
    (blueprintDetail as any)?.sections || (selectedBlueprint as any)?.sections || [];

  const displaySections =
    selectedBlueprintId && Array.isArray(bpRawSections) && bpRawSections.length > 0
      ? bpRawSections.map((sec: any, idx: number) => ({
          id: sec.sectionId || sec.id || `bp_sec_${idx}`,
          name: sec.displayName || sec.name || `Section ${idx + 1}`,
        }))
      : sections;

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Auto-select first section
  useEffect(() => {
    if (displaySections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(displaySections[0].id);
    }
  }, [displaySections, selectedSectionId]);

  const { data: topicsData, isLoading: isLoadingTopics } = useSectionTopics(selectedSectionId);
  const { data: weightages = [] } = useWeightages(selectedSectionId);
  const topics = Array.isArray(topicsData) ? topicsData : (topicsData as any)?.data || [];

  const currentBpSec = Array.isArray(bpRawSections)
    ? bpRawSections.find((s: any) => (s.sectionId || s.id) === selectedSectionId) ||
      bpRawSections[0]
    : null;

  const sectionBpTopics =
    currentBpSec?.topicAllocations || currentBpSec?.sectionTopics || currentBpSec?.topics || [];
  const allBpTopics = Array.isArray(bpRawSections)
    ? bpRawSections.flatMap((s: any) => s.topicAllocations || s.sectionTopics || s.topics || [])
    : [];

  const bpTopics = sectionBpTopics.length > 0 ? sectionBpTopics : allBpTopics;

  const displayTopics =
    selectedBlueprintId && Array.isArray(bpTopics) && bpTopics.length > 0
      ? bpTopics.map((ta: any) => {
          const id = ta.topicId || ta.id;
          const name = ta.topicName || ta.name || topicNameMap[id] || id;
          const percentage = ta.percentage ?? ta.weightagePercentage ?? ta.weightage ?? 50;
          return {
            topicId: id,
            topicName: name,
            percentage,
          };
        })
      : topics;

  const weightageMap = selectedBlueprintId
    ? (bpTopics || []).reduce((map: Record<string, number>, ta: any) => {
        const id = ta.topicId || ta.id;
        map[id] = ta.percentage ?? ta.weightagePercentage ?? ta.weightage ?? 0;
        return map;
      }, {})
    : weightages.reduce((map: Record<string, number>, weightage: any) => {
        map[weightage.topicId] = weightage.weightagePercentage;
        return map;
      }, {});

  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Auto-select first topic
  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].topicId);
    } else if (topics.length === 0) {
      setSelectedTopicId('');
    }
  }, [topics, selectedTopicId]);

  if (isLoadingSections) {
    return <Skeleton className='w-full h-64' />;
  }

  if (displaySections.length === 0 && !selectedBlueprintId) {
    return (
      <EmptyState
        title='No Sections'
        description='You must create sections and assign topics to them before managing concepts.'
      />
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4'>
      {selectedBlueprintId && (
        <div className='p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl flex items-center justify-between shadow-sm'>
          <div className='flex items-center gap-3'>
            <div className='h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm'>
              🔒
            </div>
            <div>
              <h4 className='text-sm font-semibold text-indigo-950 dark:text-indigo-200'>
                Pre-configured by Blueprint:{' '}
                {selectedBlueprint?.name || selectedBlueprint?.displayName || 'Selected Blueprint'}
              </h4>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Topics and topic weightages are loaded directly from the blueprint rules in
                Read-Only Inspection Mode.
              </p>
            </div>
          </div>
        </div>
      )}

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
            <div className='flex items-center gap-3'>
              <span className='text-sm text-muted-foreground font-medium'>Section:</span>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className='flex h-9 min-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              >
                {displaySections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingTopics && !selectedBlueprintId ? (
            <div className='space-y-3'>
              <Skeleton className='w-full h-12 rounded-lg' />
              <Skeleton className='w-full h-12 rounded-lg' />
              <Skeleton className='w-full h-12 rounded-lg' />
            </div>
          ) : displayTopics.length === 0 ? (
            <div className='flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/5 p-8 text-center'>
              <p className='text-muted-foreground font-medium'>No topics mapped to this section.</p>
              <p className='text-sm text-muted-foreground mt-1'>
                Topics must be assigned in the Blueprint tab.
              </p>
            </div>
          ) : (
            <div className='grid gap-3'>
              {displayTopics.map((topic: any) => {
                const topicId = topic.topicId || topic.id;
                const topicName = topic.topicName || topic.topic || topic.name || 'Unnamed Topic';

                return (
                  <div
                    key={topicId}
                    className='p-4 border rounded-lg bg-background flex justify-between items-center shadow-sm hover:shadow transition-shadow'
                  >
                    <div>
                      <p className='font-medium text-base'>{topicName}</p>
                      <p className='text-sm text-muted-foreground mt-0.5'>
                        Weightage: {weightageMap[topicId] ?? 0}%
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='gap-1.5 text-xs font-medium text-primary border-primary/30 hover:bg-primary/5'
                      onClick={() =>
                        window.open(`/admin/topics/${topicId}`, '_blank', 'noopener,noreferrer')
                      }
                    >
                      <span>Topic Details</span>
                      <ExternalLink className='w-3.5 h-3.5' />
                    </Button>
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
