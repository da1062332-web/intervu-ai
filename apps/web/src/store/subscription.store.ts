import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserEntitlements, PlanTier, SubscriptionStatus } from '@intervu-ai/contracts';
import { billingApi } from '@/services/api/billing.api';

interface SubscriptionState {
  hasActivePlan: boolean | null;
  plan: PlanTier | null;
  planName: string | null;
  planSlug: string | null;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  entitlements: UserEntitlements | null;
  isPricingModalOpen: boolean;
  isLoading: boolean;
  
  checkSubscription: () => Promise<boolean>;
  loadEntitlements: () => Promise<UserEntitlements | null>;
  openPricingModal: () => void;
  closePricingModal: () => void;
  setHasActivePlan: (hasActive: boolean) => void;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      hasActivePlan: null,
      plan: null,
      planName: null,
      planSlug: null,
      status: null,
      currentPeriodEnd: null,
      entitlements: null,
      isPricingModalOpen: false,
      isLoading: false,

      lastCheckedAt: 0,

      checkSubscription: async (force = false) => {
        const now = Date.now();
        const current = get() as any;
        if (!force && current.hasActivePlan !== null && now - (current.lastCheckedAt || 0) < 2 * 60 * 1000) {
          return current.hasActivePlan;
        }

        set({ isLoading: true });
        try {
          const status = await billingApi.getStatus();
          set({
            hasActivePlan: status.hasActivePlan,
            plan: status.plan,
            planName: (status as any).planName || status.plan,
            planSlug: (status as any).planSlug || (status.plan ? String(status.plan).toLowerCase() : null),
            status: status.status,
            currentPeriodEnd: status.currentPeriodEnd,
            isLoading: false,
            lastCheckedAt: Date.now(),
          } as any);

          if (status.hasActivePlan) {
            get().loadEntitlements();
          }

          return status.hasActivePlan;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      loadEntitlements: async () => {
        try {
          const entitlements = await billingApi.getEntitlements();
          set({
            entitlements,
            hasActivePlan: entitlements.hasActivePlan,
            plan: entitlements.plan,
            planName: entitlements.planName || entitlements.plan,
            planSlug: entitlements.planSlug || (entitlements.plan ? String(entitlements.plan).toLowerCase() : null),
            status: entitlements.status,
            currentPeriodEnd: entitlements.currentPeriodEnd,
          });
          return entitlements;
        } catch {
          return null;
        }
      },

      openPricingModal: () => {
        set({ isPricingModalOpen: true });
      },

      closePricingModal: () => {
        set({ isPricingModalOpen: false });
      },

      setHasActivePlan: (hasActive: boolean) => {
        set({ hasActivePlan: hasActive });
      },

      clearSubscription: () => {
        set({
          hasActivePlan: null,
          plan: null,
          status: null,
          currentPeriodEnd: null,
          entitlements: null,
          isPricingModalOpen: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'intervu_subscription_storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        hasActivePlan: state.hasActivePlan,
        plan: state.plan,
        status: state.status,
        currentPeriodEnd: state.currentPeriodEnd,
      }),
    },
  ),
);
