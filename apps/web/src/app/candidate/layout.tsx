'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/admin/layout/navbar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { PricingModal } from '@/components/billing/pricing-modal';
import { useSubscriptionStore } from '@/store/subscription.store';
import { cn } from '@/lib/utils';

export default function CandidateDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const checkSubscription = useSubscriptionStore((state) => state.checkSubscription);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  useEffect(() => {
    const verifyPlan = async () => {
      const active = await checkSubscription();
      const hasDismissed =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('intervu_pricing_modal_dismissed') === 'true';

      if (!active && !hasDismissed) {
        openPricingModal();
      }
    };
    verifyPlan();
  }, [checkSubscription, openPricingModal]);

  if (
    pathname?.includes('/execution') ||
    pathname?.includes('/demo-sandbox') ||
    pathname?.includes('/sandbox') ||
    pathname?.includes('/mock-exam')
  ) {
    return (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <div className='min-h-screen bg-background'>
          {children}
          <PricingModal />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className='flex min-h-screen bg-background flex-col'>
        <div className='print:hidden'>
          <Navbar />
        </div>
        <main
          className={cn('flex-1 overflow-x-hidden w-full bg-background')}
          id='main-content'
          aria-label='Main content'
        >
          {children}
        </main>
        <PricingModal />
      </div>
    </ProtectedRoute>
  );
}

