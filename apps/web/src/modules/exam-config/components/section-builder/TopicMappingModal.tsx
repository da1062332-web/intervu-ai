'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { useSectionTopics, useAdminTopics, useAssignTopic, useRemoveTopic } from '@/features/topic-section-mapping/api/queries';
import { WeightageEditor } from '@/features/topic-section-mapping/components/WeightageEditor';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { ExamSection } from '@/services/exam-sections/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';

interface TopicMappingModalProps {
  section: ExamSection | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TopicMappingModal({ section, isOpen, onClose }: TopicMappingModalProps) {
  const sectionId = section?.id;
  const queryClient = useQueryClient();
  
  const { data: assignedData, isLoading: isLoadingAssigned, refetch } = useSectionTopics(sectionId || '');
  const { data: allTopics = [], isLoading: isLoadingAll } = useAdminTopics();
  
  const assignTopic = useAssignTopic(sectionId || '');
  const removeTopic = useRemoveTopic(sectionId || '');

  const assignedTopics: SectionTopicResponse[] = Array.isArray(assignedData) ? assignedData : (assignedData as any)?.data || [];
  const assignedTopicIds = assignedTopics.map((t) => t.topicId);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Initialize checkboxes when modal opens or assigned topics change
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(assignedTopicIds));
    }
  }, [isOpen, assignedTopics.length]);

  const handleToggle = (topicId: string) => {
    const next = new Set(selectedIds);
    if (next.has(topicId)) {
      next.delete(topicId);
    } else {
      next.add(topicId);
    }
    setSelectedIds(next);
  };

  const handleSave = async () => {
    if (!sectionId) return;
    setIsSaving(true);
    try {
      const initialIds = new Set(assignedTopicIds);
      const toAdd = Array.from(selectedIds).filter(id => !initialIds.has(id));
      const toRemove = Array.from(initialIds).filter(id => !selectedIds.has(id));

      const promises: Promise<any>[] = [];
      
      for (const id of toAdd) {
        promises.push(assignTopic.mutateAsync(id));
      }
      for (const id of toRemove) {
        promises.push(removeTopic.mutateAsync(id));
      }

      const results = await Promise.allSettled(promises);
      
      // Check for errors
      const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      if (rejected.length > 0) {
        for (const r of rejected) {
          const errData = r.reason?.response?.data || r.reason?.data || r.reason;
          const msg = errData?.message || r.reason?.message || 'Failed to assign topic.';
          const shortcutUrl = errData?.details?.shortcutUrl;

          toast.error(msg, {
            duration: 8000,
            action: shortcutUrl ? {
              label: '⚡ Generate Questions',
              onClick: () => window.location.href = shortcutUrl,
            } : undefined,
          });
        }
      } else {
        toast.success('Topic mappings updated successfully!');
      }

      // Invalidate configuration and readiness queries to ensure UI updates across the board
      await queryClient.invalidateQueries({ queryKey: ['config-validation'] });
      await queryClient.invalidateQueries({ queryKey: ['config-readiness'] });
      await queryClient.invalidateQueries({ queryKey: ['exam-configs'] });
      await refetch();
      
      if (rejected.length === 0) {
        onClose();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save topic mappings.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingAssigned || isLoadingAll;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-3xl'>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold'>Manage Topics - {section?.name}</h2>
        <p className='text-sm text-muted-foreground'>
          Select the topics to include in this section and configure their weightages.
        </p>
      </div>
        
      {sectionId && (
        <div className='space-y-6'>
          {isLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
            </div>
          ) : (
            <div className='bg-card border rounded-lg p-4 max-h-[300px] overflow-y-auto'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {allTopics.map((topic) => {
                  const id = topic.id || topic.topicId;
                  const name = topic.topicName || topic.topic || topic.name || 'Unnamed Topic';
                  return (
                    <label key={id} className='flex items-center space-x-3 p-2 rounded hover:bg-muted cursor-pointer border border-transparent hover:border-border transition-colors'>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => handleToggle(id)}
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <span className='font-medium text-sm'>{name}</span>
                    </label>
                  );
                })}
              </div>
              {allTopics.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No topics found in the system.</p>
              )}
            </div>
          )}

          {/* Only show weightage editor for currently assigned topics (already saved) */}
          {assignedTopics.length > 0 && (
            <div className='bg-card border rounded-lg p-6 shadow-sm mt-6'>
              <WeightageEditor sectionId={sectionId} topics={assignedTopics} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Saving...' : 'Save Mappings'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
