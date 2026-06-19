import { create } from 'zustand';
import type { SectionTopicResponse } from '@intervu-ai/contracts';

interface TopicMappingState {
  selectedSectionId: string | null;
  assignedTopics: SectionTopicResponse[];
  weightages: Record<string, number>; // topicId -> weightage
  isDirty: boolean;
  
  setSelectedSection: (sectionId: string | null) => void;
  setAssignedTopics: (topics: SectionTopicResponse[]) => void;
  setWeightages: (weightages: Record<string, number>) => void;
  updateWeightage: (topicId: string, value: number) => void;
  setIsDirty: (dirty: boolean) => void;
  resetState: () => void;
}

export const useTopicMappingStore = create<TopicMappingState>((set) => ({
  selectedSectionId: null,
  assignedTopics: [],
  weightages: {},
  isDirty: false,
  
  setSelectedSection: (sectionId) => set({ selectedSectionId: sectionId }),
  setAssignedTopics: (topics) => set({ assignedTopics: topics }),
  setWeightages: (weightages) => set({ weightages }),
  updateWeightage: (topicId, value) => set((state) => ({ 
    weightages: { ...state.weightages, [topicId]: value },
    isDirty: true 
  })),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  resetState: () => set({ selectedSectionId: null, assignedTopics: [], weightages: {}, isDirty: false }),
}));
