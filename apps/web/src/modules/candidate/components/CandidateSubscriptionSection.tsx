'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Zap,
  ShieldCheck,
  Crown,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { PlanCard } from '@/components/billing/plan-card';
import { useSubscriptionStore } from '@/store/subscription.store';
import { useAuthStore } from '@/store/auth.store';
import { billingApi } from '@/services/api/billing.api';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PlanDto } from '@intervu-ai/contracts';

export function CandidateSubscriptionSection() {
  const hasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const currentPlan = useSubscriptionStore((state) => state.plan);
  const planName = useSubscriptionStore((state) => state.planName);
  const planSlug = useSubscriptionStore((state) => state.planSlug);
  const status = useSubscriptionStore((state) => state.status);
  const currentPeriodEnd = useSubscriptionStore((state) => state.currentPeriodEnd);
  const entitlements = useSubscriptionStore((state) => state.entitlements);
  const loadEntitlements = useSubscriptionStore((state) => state.loadEntitlements);
  const setHasActivePlan = useSubscriptionStore((state) => state.setHasActivePlan);
  const user = useAuthStore((state) => state.user);

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [dynamicPlans, setDynamicPlans] = useState<PlanDto[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    loadDynamicPlans();
  }, []);

  const loadDynamicPlans = async () => {
    try {
      setIsLoadingPlans(true);
      const plans = await billingApi.getPublicPlans();
      if (plans && plans.length > 0) {
        setDynamicPlans(plans);
      } else {
        setDynamicPlans([]);
      }
    } catch {
      // Fallback silently if offline or initial load
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Format expiration date
  const formatExpirationDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formattedExpiry = formatExpirationDate(currentPeriodEnd || entitlements?.currentPeriodEnd);

  const handleSelectFree = async () => {
    try {
      setLoadingPlan('free');
      await billingApi.subscribeFree();
      setHasActivePlan(true);
      await loadEntitlements();
      notifySuccess('Free plan activated successfully!');
    } catch (err: any) {
      notifyApiError(err, 'Failed to activate Free plan');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSelectPaid = async (selectedSlug: string, amountPaise: number) => {
    try {
      setLoadingPlan(selectedSlug);
      
      // Step 1: Create Order
      const order = await billingApi.createOrder({
        plan: selectedSlug.toUpperCase(),
        amount: amountPaise,
        currency: 'INR',
      });

      // Step 2: Load Razorpay Checkout Script
      const loadScript = () => {
        return new Promise<boolean>((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const loaded = await loadScript();
      if (!loaded) {
        notifyApiError('Failed to load Razorpay checkout gateway. Please check your network connection.');
        setLoadingPlan(null);
        return;
      }

      // Step 3: Open Razorpay Modal
      const options = {
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillitriX InterVu AI',
        description: `${selectedSlug.toUpperCase()} Plan Subscription`,
        order_id: order.order_id || order.orderId,
        prefill: {
          name: user?.fullName || 'Candidate',
          email: user?.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await billingApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedSlug.toUpperCase(),
            });

            if (verifyRes.success) {
              setHasActivePlan(true);
              await loadEntitlements();
              notifySuccess(`Payment verified successfully! Welcome to InterVu ${selectedSlug.toUpperCase()}.`);
            }
          } catch (err: any) {
            notifyApiError(err, 'Payment verification failed. Please contact support.');
          } finally {
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        notifyApiError(
          response.error?.description || 'Payment was declined or failed. Please try again.',
          'Payment Failed',
        );
        setLoadingPlan(null);
      });

      rzp.open();
    } catch (err: any) {
      notifyApiError(err, 'Failed to initiate checkout');
      setLoadingPlan(null);
    }
  };

  const handleSelectTeams = () => {
    window.open('mailto:sales@skillitrix.com?subject=InterVu%20Teams%20Inquiry', '_blank');
  };

  // Active Tier Name from dynamic database plan
  const activePlanName =
    (entitlements as any)?.planName ||
    planName ||
    (currentPlan ? `${currentPlan} Plan` : null);

  const effectiveSlug =
    (entitlements as any)?.planSlug ||
    planSlug ||
    (currentPlan ? String(currentPlan).toLowerCase() : null);

  // Quota and attempts calculation
  const allowedAssessmentsVal =
    (entitlements?.features as any)?.allowedAssessments ||
    (entitlements?.features as any)?.allowed_assessments;

  const overallQuota =
    typeof allowedAssessmentsVal === 'object' && allowedAssessmentsVal !== null
      ? allowedAssessmentsVal.overallAttempts ?? allowedAssessmentsVal.attemptsPerExam ?? null
      : null;

  const roundsUsed = entitlements?.features?.monthlyRoundsUsed ?? 0;
  const rawRoundsLimit = entitlements?.features?.monthlyRoundsLimit ?? null;
  const effectiveLimit = overallQuota !== null ? overallQuota : rawRoundsLimit;
  const quotaLabel = overallQuota !== null ? 'Exam Attempts Used' : 'Monthly Tests Used';
  const percentUsed = effectiveLimit ? Math.min(100, Math.round((roundsUsed / effectiveLimit) * 100)) : 0;

  return (
    <div className='space-y-6 pt-4'>
      {/* 1. Section Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5'>
            <Crown className='size-6 text-indigo-600' />
            Subscription & Plans
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Your active tier status, monthly usage quota, and available plan upgrades.
          </p>
        </div>

        {hasActivePlan && (
          <Badge className='self-start sm:self-auto bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 text-xs font-semibold gap-1.5'>
            <Sparkles className='size-3.5' />
            {activePlanName || 'Active Member'}
          </Badge>
        )}
      </div>

      {/* 2. Side-by-Side Row: Active Subscription Card (Left) & Plans Cards (Right) */}
      <div className='grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch'>
        {/* Left Column: Active Subscription Overview Card */}
        <Card className='xl:col-span-4 rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between shadow-xs'>
          <div className='space-y-5'>
            {/* Header */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400'>
                  <Crown className='size-5' />
                </div>
                <div>
                  <h3 className='font-bold text-foreground text-sm'>Current Subscription</h3>
                  <p className='text-[11px] text-muted-foreground'>Account Entitlements</p>
                </div>
              </div>

              {hasActivePlan && status === 'ACTIVE' ? (
                <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60'>
                  <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                  Active
                </span>
              ) : (
                <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/60'>
                  <span className='size-1.5 rounded-full bg-amber-500' />
                  No Active Plan
                </span>
              )}
            </div>

            {/* Plan Tier Badge & Expiry Info */}
            <div className='p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-muted-foreground'>Active Tier</span>
                {hasActivePlan ? (
                  <Badge
                    variant='outline'
                    className='bg-indigo-600 text-white border-indigo-600 font-bold px-2.5 py-0.5 text-xs uppercase'
                  >
                    {activePlanName || `${currentPlan} PLAN`}
                  </Badge>
                ) : (
                  <Badge
                    variant='outline'
                    className='bg-slate-100 text-slate-600 border-slate-200 font-bold px-2.5 py-0.5 text-xs'
                  >
                    NO ACTIVE PLAN
                  </Badge>
                )}
              </div>

              <div className='flex items-center justify-between text-xs'>
                <span className='text-muted-foreground flex items-center gap-1.5'>
                  <Calendar className='size-3.5 text-indigo-600' /> Expiry Date
                </span>
                <strong className='text-foreground'>
                  {hasActivePlan ? formattedExpiry || 'Monthly Cycle' : 'No Active Subscription'}
                </strong>
              </div>
            </div>

            {/* Monthly Practice Tests Usage Meter */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <span className='font-medium text-muted-foreground flex items-center gap-1.5'>
                  <Zap className='size-3.5 text-amber-500' /> {quotaLabel}
                </span>
                <span className='font-bold text-foreground'>
                  {!hasActivePlan
                    ? '0 / 0'
                    : effectiveLimit === null
                    ? 'Unlimited'
                    : `${roundsUsed} / ${effectiveLimit} attempts`}
                </span>
              </div>

              {effectiveLimit !== null && (
                <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentUsed >= 100
                        ? 'bg-rose-500'
                        : percentUsed >= 70
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Right Column: Plans Cards in a Row */}
        <div className='xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch'>
          {dynamicPlans.length > 0 ? (
            dynamicPlans.map((plan) => {
              const isCurrent =
                Boolean(hasActivePlan) &&
                (plan.slug.toLowerCase() === (effectiveSlug || '').toLowerCase() ||
                 plan.slug.toLowerCase() === (currentPlan || '').toLowerCase() ||
                 plan.name.toLowerCase() === (activePlanName || '').toLowerCase() ||
                 (currentPlan?.toUpperCase() === 'PRO' && (plan.slug.toLowerCase() === 'starter' || plan.slug.toLowerCase() === 'pro')));

              const priceFormatted =
                plan.priceMonthly === 0
                  ? 'Free'
                  : `₹${(plan.priceMonthly / 100).toLocaleString('en-IN')}`;

              const handlePlanSelect = () => {
                if (plan.slug === 'free') {
                  handleSelectFree();
                } else if (plan.slug === 'teams') {
                  handleSelectTeams();
                } else {
                  handleSelectPaid(plan.slug, plan.priceMonthly);
                }
              };

              const hasDiscount = plan.priceMonthly > 0 && plan.originalPrice && plan.originalPrice > plan.priceMonthly;
              const originalPriceFormatted = hasDiscount
                ? `₹${(plan.originalPrice! / 100).toLocaleString('en-IN')}`
                : undefined;
              const discountPercentFormatted = hasDiscount
                ? `${Math.round(((plan.originalPrice! - plan.priceMonthly) / plan.originalPrice!) * 100)}%`
                : undefined;

              const displayFeatures = plan.features.map((f) => {
                if (f.featureKey === 'allowed_assessments' && typeof f.valueJson === 'object' && f.valueJson !== null) {
                  const list = f.valueJson.assessments;
                  const attempts = f.valueJson.overallAttempts ?? f.valueJson.attemptsPerExam;
                  const attemptsSuffix = attempts ? ` (${attempts} Attempts Overall)` : ' (Unlimited Attempts)';
                  if (Array.isArray(list)) {
                    if (list.includes('all')) return `All System Assessments Access${attemptsSuffix}`;
                    return `${list.length} Specific Assigned Assessment${list.length > 1 ? 's' : ''}${attemptsSuffix}`;
                  }
                }
                return f.featureName;
              });

              return (
                <PlanCard
                  key={plan.id}
                  title={plan.name}
                  price={priceFormatted}
                  originalPrice={originalPriceFormatted}
                  discountPercent={discountPercentFormatted}
                  period={plan.priceMonthly > 0 ? '/ month' : undefined}
                  badge={plan.badge || undefined}
                  highlighted={plan.isHighlighted && !isCurrent}
                  description={plan.description || ''}
                  features={displayFeatures}
                  buttonText={isCurrent ? 'Current Plan' : plan.buttonText}
                  disabled={isCurrent}
                  isLoading={loadingPlan === plan.slug}
                  onSelect={handlePlanSelect}
                />
              );
            })
          ) : isLoadingPlans ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className='h-80 w-full rounded-2xl border border-border/60 bg-muted/30 p-6 animate-pulse flex flex-col justify-between'
              >
                <div className='space-y-3'>
                  <div className='h-5 w-24 bg-muted rounded' />
                  <div className='h-8 w-32 bg-muted rounded' />
                  <div className='h-4 w-full bg-muted rounded' />
                </div>
                <div className='h-10 w-full bg-muted rounded-xl' />
              </div>
            ))
          ) : (
            <div className='col-span-full py-10 text-center text-muted-foreground font-medium text-sm'>
              No active subscription plans available at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
