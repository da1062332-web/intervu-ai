'use client';

import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscription.store';
import type { PlanFeatures } from '@intervu-ai/contracts';
import { Button } from '@/components/ui/button';

export interface EntitlementGateProps {
  feature: keyof PlanFeatures | string;
  requiredValue?: any;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function EntitlementGate({
  feature,
  requiredValue,
  fallback,
  children,
}: EntitlementGateProps) {
  const entitlements = useSubscriptionStore((state) => state.entitlements);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  if (!entitlements || !entitlements.hasActivePlan) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <DefaultUpgradeFallback feature={String(feature)} onUpgrade={openPricingModal} />
    );
  }

  const featureVal = entitlements.features[feature as any];
  let hasAccess = false;

  if (typeof featureVal === 'boolean') {
    hasAccess = featureVal;
  } else if (Array.isArray(featureVal)) {
    hasAccess = requiredValue
      ? featureVal.includes('all') || featureVal.includes(requiredValue)
      : featureVal.length > 0;
  } else if (typeof featureVal === 'string' && requiredValue) {
    hasAccess = featureVal === requiredValue;
  } else {
    hasAccess = Boolean(featureVal);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback ? (
    <>{fallback}</>
  ) : (
    <DefaultUpgradeFallback feature={String(feature)} onUpgrade={openPricingModal} />
  );
}

function DefaultUpgradeFallback({
  feature,
  onUpgrade,
}: {
  feature: string;
  onUpgrade: () => void;
}) {
  const formattedFeature = feature
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();

  return (
    <div className='flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border bg-card/50'>
      <div className='size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3'>
        <Lock className='size-6' />
      </div>
      <h4 className='text-lg font-bold text-foreground capitalize'>
        Unlock {formattedFeature}
      </h4>
      <p className='text-sm text-muted-foreground max-w-sm mt-1 mb-4'>
        This feature is available on Pro and Teams subscriptions. Upgrade your plan to get instant access.
      </p>
      <Button
        onClick={onUpgrade}
        className='bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20'
      >
        <Sparkles className='size-4 mr-2' />
        Upgrade Plan
      </Button>
    </div>
  );
}
