'use client';

import React, { useEffect } from 'react';
import { useSubscriptionStore } from '@/store/subscription.store';
import { cn } from '@/lib/utils';

interface SubscriptionPlanBadgeProps {
  className?: string;
}

export function SubscriptionPlanBadge({ className }: SubscriptionPlanBadgeProps) {
  const hasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const plan = useSubscriptionStore((state) => state.plan);
  const planName = useSubscriptionStore((state) => state.planName);
  const planSlug = useSubscriptionStore((state) => state.planSlug);
  const status = useSubscriptionStore((state) => state.status);
  const entitlements = useSubscriptionStore((state) => state.entitlements);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const checkSubscription = useSubscriptionStore((state) => state.checkSubscription);
  const loadEntitlements = useSubscriptionStore((state) => state.loadEntitlements);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  useEffect(() => {
    if (hasActivePlan === null) {
      checkSubscription().then((active) => {
        if (active) {
          loadEntitlements();
        }
      });
    }
  }, [hasActivePlan, checkSubscription, loadEntitlements]);

  if (isLoading && hasActivePlan === null) {
    return <div data-testid="plan-badge-skeleton" className='h-5 w-12 rounded-full bg-muted animate-pulse shrink-0' />;
  }

  // Determine active plan tier/label
  const isExpired = status === 'EXPIRED';
  const isActive = hasActivePlan === true && !isExpired;

  let planLabel = 'FREE';
  let badgeStyle =
    'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20';

  if (isActive) {
    const rawPlan = (entitlements?.plan || plan || '').toUpperCase();
    const rawSlug = (entitlements?.planSlug || planSlug || '').toLowerCase();
    const rawName = (entitlements?.planName || planName || '').toLowerCase();

    if (rawPlan.includes('VIP') || rawSlug.includes('vip')) {
      planLabel = 'VIP';
      badgeStyle =
        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20';
    } else if (rawPlan === 'PRO' || rawSlug === 'pro') {
      planLabel = 'PRO';
      badgeStyle =
        'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20';
    } else if (rawPlan === 'TEAMS' || rawSlug === 'teams') {
      planLabel = 'TEAMS';
      badgeStyle =
        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20';
    } else if (rawPlan === 'STARTER' || rawSlug === 'starter') {
      planLabel = 'STARTER';
      badgeStyle =
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
    } else if (rawSlug.includes('referral') || rawName.includes('referral')) {
      planLabel = 'REFERRAL';
      badgeStyle =
        'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30 hover:bg-pink-500/20';
    } else if (rawPlan === 'FREE' || rawSlug === 'free') {
      planLabel = 'FREE';
      badgeStyle =
        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20';
    } else if (rawPlan) {
      planLabel = rawPlan;
      badgeStyle =
        'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20';
    }
  }

  return (
    <button
      type='button'
      onClick={openPricingModal}
      className={cn(
        'inline-flex items-center justify-center font-bold font-mono tracking-wider',
        'text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full border shadow-2xs',
        'transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer select-none shrink-0',
        badgeStyle,
        className,
      )}
      title='Click to view subscription plans'
      aria-label={`Subscription plan: ${planLabel}. Click to view plans.`}
    >
      <span>{planLabel}</span>
    </button>
  );
}
