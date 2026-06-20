import { create } from 'zustand';
import type { Topic } from '@/services/topics/types';
import type { ConceptMapping } from '@/services/concept-mapping/types';

interface TopicRegistryState {
  selectedTopic: Topic | null;
  selectedConcept: ConceptMapping | null;
  isDirty: boolean;

  setSelectedTopic: (topic: Topic | null) => void;
  setSelectedConcept: (concept: ConceptMapping | null) => void;
  setDirty: (isDirty: boolean) => void;
  resetStore: () => void;
}

const initialState = {
  selectedTopic: null,
  selectedConcept: null,
  isDirty: false,
};

export const useTopicRegistryStore = create<TopicRegistryState>((set) => ({
  ...initialState,

  setSelectedTopic: (selectedTopic) => set({ selectedTopic }),
  setSelectedConcept: (selectedConcept) => set({ selectedConcept }),
  setDirty: (isDirty) => set({ isDirty }),
  resetStore: () => set(initialState),
}));
