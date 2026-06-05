import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardState {
  activeTab: string;
  timeRange: '7d' | '30d' | 'all';
  statusFilter: 'all' | 'active' | 'completed';
  setActiveTab: (tab: string) => void;
  setTimeRange: (range: '7d' | '30d' | 'all') => void;
  setStatusFilter: (filter: 'all' | 'active' | 'completed') => void;
  reset: () => void;
}

const initialState = {
  activeTab: 'overview',
  timeRange: '7d' as const,
  statusFilter: 'all' as const,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      ...initialState,
      setActiveTab: (tab) => set({ activeTab: tab }),
      setTimeRange: (range) => set({ timeRange: range }),
      setStatusFilter: (filter) => set({ statusFilter: filter }),
      reset: () => set(initialState),
    }),
    {
      name: 'intervu-dashboard-store',
    }
  )
);
