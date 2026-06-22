import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface TestCatalogState {
  searchQuery: string;
  difficultyFilter: 'All' | 'Easy' | 'Medium' | 'Hard';
  bookmarkedIds: string[];
  selectedTestId: string | null;
  currentPage: number;
  itemsPerPage: number;

  setSearchQuery: (query: string) => void;
  setDifficultyFilter: (difficulty: 'All' | 'Easy' | 'Medium' | 'Hard') => void;
  toggleBookmark: (id: string) => void;
  setSelectedTestId: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
}

export const useTestCatalogStore = create<TestCatalogState>()(
  persist(
    (set) => ({
      searchQuery: '',
      difficultyFilter: 'All',
      bookmarkedIds: [],
      selectedTestId: null,
      currentPage: 1,
      itemsPerPage: 6,

      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
      setDifficultyFilter: (difficulty) => set({ difficultyFilter: difficulty, currentPage: 1 }),
      toggleBookmark: (id) =>
        set((state) => {
          const isBookmarked = state.bookmarkedIds.includes(id);
          const newBookmarks = isBookmarked
            ? state.bookmarkedIds.filter((bId) => bId !== id)
            : [...state.bookmarkedIds, id];
          return { bookmarkedIds: newBookmarks };
        }),
      setSelectedTestId: (id) => set({ selectedTestId: id }),
      setCurrentPage: (page) => set({ currentPage: page }),
      resetFilters: () => set({ searchQuery: '', difficultyFilter: 'All', currentPage: 1 }),
    }),
    {
      name: 'intervu-candidate-catalog-store',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      skipHydration: true,
      partialize: (state) => ({
        bookmarkedIds: state.bookmarkedIds,
        selectedTestId: state.selectedTestId,
      }),
    },
  ),
);
