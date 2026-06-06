import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── State Shape ─────────────────────────────────────────────────────────────

interface LayoutState {
  /** Whether the sidebar is in collapsed (icon-only) mode */
  sidebarCollapsed: boolean;
  /** The last visited route — used for navigation memory */
  lastVisitedRoute: string;
  /** Whether the mobile navigation drawer is open */
  mobileNavOpen: boolean;

  // ─── Actions ─────────────────────────────────────────────────────────────

  /** Toggle sidebar between collapsed and expanded */
  toggleSidebarCollapsed: () => void;
  /** Explicitly set sidebar collapsed state */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Remember the last visited route */
  setLastVisitedRoute: (route: string) => void;
  /** Open/close the mobile nav drawer */
  setMobileNavOpen: (open: boolean) => void;
  /** Toggle mobile nav drawer */
  toggleMobileNav: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      lastVisitedRoute: '/dashboard',
      mobileNavOpen: false,

      toggleSidebarCollapsed: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setLastVisitedRoute: (route) => set({ lastVisitedRoute: route }),

      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

      toggleMobileNav: () =>
        set((state) => ({
          mobileNavOpen: !state.mobileNavOpen,
        })),
    }),
    {
      name: 'intervu-layout-store',
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
      // Only persist UI preferences — not transient state like mobile nav open
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        lastVisitedRoute: state.lastVisitedRoute,
      }),
    },
  ),
);
