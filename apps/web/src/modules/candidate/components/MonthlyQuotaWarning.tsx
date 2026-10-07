'use client';

import React from 'react';
import { AlertTriangle, Sparkles, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionStore } from '@/store/subscription.store';

interface MonthlyQuotaWarningProps {
  monthlyRoundsRemaining?: number | null;
  monthlyRoundsLimit?: number | null;
  currentPeriodEnd?: string | null;
  hasActivePlan?: boolean | null;
  onUpgrade?: () => void;
  className?: string;
}

export function MonthlyQuotaWarning({
  monthlyRoundsRemaining: propRemaining,
  monthlyRoundsLimit: propLimit,
  currentPeriodEnd: propPeriodEnd,
  hasActivePlan: propHasActivePlan,
  onUpgrade,
  className = '',
}: MonthlyQuotaWarningProps) {
  const storeHasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const storeEntitlements = useSubscriptionStore((state) => state.entitlements);
  const storeCurrentPeriodEnd = useSubscriptionStore((state) => state.currentPeriodEnd);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  const effectiveHasActivePlan =
    propHasActivePlan !== undefined ? propHasActivePlan : storeHasActivePlan;
  const effectiveRemaining =
    propRemaining !== undefined
      ? propRemaining
      : storeEntitlements?.features?.monthlyRoundsRemaining;
  const effectiveLimit =
    propLimit !== undefined
      ? propLimit
      : storeEntitlements?.features?.monthlyRoundsLimit;
  const effectivePeriodEnd =
    propPeriodEnd !== undefined
      ? propPeriodEnd
      : storeCurrentPeriodEnd || storeEntitlements?.currentPeriodEnd;

  // Do not show warning if:
  // 1. User does not have an active plan (no active subscription has its own dedicated flow)
  // 2. remaining is null (unlimited rounds)
  // 3. remaining is positive (> 0)
  // 4. remaining is undefined (not loaded yet)
  const isQuotaExhausted = Boolean(
    effectiveHasActivePlan &&
      effectiveRemaining !== null &&
      effectiveRemaining !== undefined &&
      effectiveRemaining <= 0
  );

  if (!isQuotaExhausted) {
    return null;
  }

  const formatResetDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return null;
    }
  };

  const formattedResetDate = formatResetDate(effectivePeriodEnd);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      openPricingModal();
    }
  };

  return (
    <div
      role='alert'
      aria-live='polite'
      className={`rounded-2xl border border-amber-500/30 dark:border-amber-500/20 bg-amber-500/10 dark:bg-amber-950/30 p-5 sm:p-6 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${className}`}
    >
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex items-start gap-3.5'>
          <div className='w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5'>
            <AlertTriangle className='size-5' />
          </div>
          <div className='space-y-1.5'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h3 className='font-bold text-base text-foreground tracking-tight'>
                Monthly assessment quota exhausted
              </h3>
              <Badge
                variant='outline'
                className='bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider'
              >
                Quota Exhausted
              </Badge>
            </div>
            <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl'>
              You&apos;ve used all your available assessment rounds for this month. Upgrade your plan
              or purchase additional rounds to continue.
            </p>

            {/* Metadata Pills */}
            <div className='flex items-center gap-3 pt-1 flex-wrap text-xs text-muted-foreground'>
              <div className='flex items-center gap-1.5 font-medium'>
                <Zap className='size-3.5 text-amber-500 shrink-0' />
                <span>
                  Remaining rounds: <strong className='text-foreground'>{effectiveRemaining}</strong>
                  {effectiveLimit != null && ` / ${effectiveLimit}`}
                </span>
              </div>
              {formattedResetDate && (
                <>
                  <span className='text-border'>•</span>
                  <div className='flex items-center gap-1.5 font-medium'>
                    <Calendar className='size-3.5 text-amber-500 shrink-0' />
                    <span>
                      Resets on: <strong className='text-foreground'>{formattedResetDate}</strong>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className='shrink-0 w-full sm:w-auto pt-2 sm:pt-0'>
          <Button
            onClick={handleUpgrade}
            className='w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 px-4 shadow-sm transition-all flex items-center justify-center gap-1.5 rounded-xl'
          >
            <Sparkles className='size-3.5' />
            <span>Upgrade Plan</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
