'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import {
  useSectionTopics,
  useAdminTopics,
  useAssignTopic,
  useRemoveTopic,
} from '@/features/topic-section-mapping/api/queries';
import {
  useWeightages,
  useUpdateWeightage,
  useCreateWeightage,
} from '@/services/topic-weightages/hooks';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { ExamSection } from '@/services/exam-sections/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Sparkles, Search } from 'lucide-react';

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
  const { data: weightagesData = [] } = useWeightages(sectionId || '');

  const assignTopic = useAssignTopic(sectionId || '');
  const removeTopic = useRemoveTopic(sectionId || '');
  const updateWeightage = useUpdateWeightage(sectionId || '');
  const createWeightage = useCreateWeightage(sectionId || '');

  const assignedTopics: SectionTopicResponse[] = Array.isArray(assignedData)
    ? assignedData
    : (assignedData as any)?.data || [];
  const assignedTopicIds = assignedTopics.map((t) => t.topicId);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [weightages, setWeightages] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize checkboxes & weightages when modal opens or server data updates
  useEffect(() => {
    if (isOpen && !isLoadingAssigned) {
      const initialSet = new Set(assignedTopicIds);
      setSelectedIds(initialSet);

      const weightageMap: Record<string, number> = {};
      assignedTopics.forEach((st) => {
        const w = (st as any).topicWeightage?.weightagePercentage ?? (st as any).weightagePercentage ?? 0;
        weightageMap[st.topicId] = w;
      });

      // Fill in from weightagesData query as fallback
      weightagesData.forEach((w) => {
        if (weightageMap[w.topicId] === undefined || weightageMap[w.topicId] === 0) {
          weightageMap[w.topicId] = w.weightagePercentage;
        }
      });

      setWeightages(weightageMap);
      setSearchQuery('');
    }
  }, [isOpen, isLoadingAssigned, JSON.stringify(assignedTopicIds), weightagesData.length]);

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return allTopics;
    const q = searchQuery.toLowerCase();
    return allTopics.filter((t: any) => {
      const name = (t.topicName || t.topic || t.name || '').toLowerCase();
      const code = (t.code || t.topicCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [allTopics, searchQuery]);

  const handleToggle = (topicId: string) => {
    const next = new Set(selectedIds);
    const isAdding = !next.has(topicId);

    if (isAdding) {
      next.add(topicId);
    } else {
      next.delete(topicId);
    }

    setSelectedIds(next);

    // Auto-rebalance weightages across active topics on both check AND uncheck
    rebalanceWeightages(next);
  };

  const handleWeightageChange = (topicId: string, val: string) => {
    const parsed = Math.max(0, Math.min(100, parseInt(val) || 0));
    setWeightages((prev) => ({
      ...prev,
      [topicId]: parsed,
    }));
  };

  const rebalanceWeightages = (activeSet: Set<string> = selectedIds) => {
    const activeList = Array.from(activeSet);
    const count = activeList.length;
    if (count === 0) return;

    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;

    const newMap: Record<string, number> = { ...weightages };
    activeList.forEach((id, index) => {
      newMap[id] = base + (index < remainder ? 1 : 0);
    });

    setWeightages(newMap);
    toast.success(`Auto-balanced weightages across ${count} topics!`);
  };

  const totalWeightage = Array.from(selectedIds).reduce(
    (sum, id) => sum + (weightages[id] || 0),
    0,
  );
  const isTotal100 = totalWeightage === 100 || selectedIds.size === 0;

  const handleSave = async () => {
    if (!sectionId) return;

    if (selectedIds.size > 0 && totalWeightage !== 100) {
      toast.error('Invalid Weightage Total', {
        description: `Topic weightages must total exactly 100%. Current total: ${totalWeightage}%`,
      });
      return;
    }

    setIsSaving(true);
    try {
      const initialIds = new Set(assignedTopicIds);
      const toAdd = Array.from(selectedIds).filter((id) => !initialIds.has(id));
      const toRemove = Array.from(initialIds).filter((id) => !selectedIds.has(id));

      // 1. Assign / Remove Topics
      for (const id of toAdd) {
        try {
          await assignTopic.mutateAsync(id);
        } catch (e) {
          console.error(`Failed to assign topic ${id}:`, e);
        }
      }
      for (const id of toRemove) {
        try {
          await removeTopic.mutateAsync(id);
        } catch (e) {
          console.error(`Failed to remove topic ${id}:`, e);
        }
      }

      // 2. Update / Create Weightages for all currently selected topics
      for (const topicId of Array.from(selectedIds)) {
        const val = weightages[topicId] ?? 0;
        const existing = weightagesData.find((w) => w.topicId === topicId);
        try {
          if (existing) {
            await updateWeightage.mutateAsync({ id: existing.id, weightagePercentage: val });
          } else {
            await createWeightage.mutateAsync({ topicId, weightagePercentage: val });
          }
        } catch (e) {
          console.error(`Failed to save weightage for topic ${topicId}:`, e);
        }
      }

      toast.success('Topic mappings and weightages updated successfully!');

      // Invalidate queries to refresh UI state across all tabs
      await queryClient.invalidateQueries({ queryKey: ['section-topics', sectionId] });
      await queryClient.invalidateQueries({ queryKey: ['topic-weightages', sectionId] });
      await queryClient.invalidateQueries({ queryKey: ['config-validation'] });
      await queryClient.invalidateQueries({ queryKey: ['config-readiness'] });
      await queryClient.invalidateQueries({ queryKey: ['exam-configs'] });
      await refetch();

      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save topic mappings.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingAssigned || isLoadingAll;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold">Manage Topics & Weightages - {section?.name}</h2>
          <p className="text-sm text-muted-foreground">
            Select topics for this section and set their weightages (must sum to 100%).
          </p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => rebalanceWeightages()}
            className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 whitespace-nowrap shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> Auto-Balance (100%)
          </Button>
        )}
      </div>

      {sectionId && (
        <div className="space-y-4">
          {/* Search Box on Top */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search topics by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-3 max-h-[380px] overflow-y-auto space-y-2">
              <div className="grid grid-cols-1 gap-2.5">
                {filteredTopics.map((topic: any) => {
                  const id = topic.id || topic.topicId;
                  const name = topic.topicName || topic.topic || topic.name || 'Unnamed Topic';
                  const code = topic.code || topic.topicCode || '';
                  const isChecked = selectedIds.has(id);
                  const currentWeightage = weightages[id] ?? 0;

                  return (
                    <div
                      key={id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3 transition-all ${
                        isChecked
                          ? 'border-primary/60 bg-primary/5 shadow-sm'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <label className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(id)}
                          className="w-4.5 h-4.5 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <div className="flex flex-col truncate">
                          <span className="font-medium text-sm truncate">{name}</span>
                          {code && <span className="text-xs text-muted-foreground font-mono">{code}</span>}
                        </div>
                      </label>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        {isChecked && (
                          <div className="flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-md shadow-xs">
                            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Weight:</span>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={currentWeightage}
                              onChange={(e) => handleWeightageChange(id, e.target.value)}
                              className="w-20 h-7 text-center text-sm font-bold border-muted px-1"
                            />
                            <span className="text-xs font-bold text-primary">%</span>
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-yellow-600 border-yellow-200 hover:bg-yellow-50 whitespace-nowrap"
                          title="Generate Questions"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/admin/question-generation?topicId=${id}`;
                          }}
                        >
                          ⚡ Generate
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTopics.length === 0 && (
                <p className="text-muted-foreground text-center py-6 text-sm">
                  {searchQuery ? `No topics match "${searchQuery}".` : 'No topics found in the system.'}
                </p>
              )}
            </div>
          )}

          {/* Live Weightage Total Summary Bar */}
          {selectedIds.size > 0 && (
            <div
              className={`flex items-center justify-between p-3.5 rounded-lg border text-sm font-medium ${
                isTotal100
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/40 dark:text-green-400'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                {isTotal100 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
                <span>
                  Selected Topics ({selectedIds.size}) — Total Weightage:{' '}
                  <strong>{totalWeightage}%</strong>
                </span>
              </div>

              {!isTotal100 && (
                <span className="text-xs font-semibold">Total must equal 100%</span>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading || (selectedIds.size > 0 && !isTotal100)}
            >
              {isSaving ? 'Saving...' : 'Save Mappings & Weightages'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
