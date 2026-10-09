'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Calendar,
  Zap,
  ShieldCheck,
  Crown,
  CheckCircle2,
  ArrowUpRight,
  Gift,
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
  const queryClient = useQueryClient();
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

  const handleSelectFree = async (selectedSlug: string = 'free') => {
    try {
      setLoadingPlan(selectedSlug);
      await billingApi.subscribeFree(selectedSlug);
      setHasActivePlan(true);
      await loadEntitlements();
      queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-modular'] });
      queryClient.invalidateQueries({ queryKey: ['public-tests'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-metrics'] });
      notifySuccess('Plan activated successfully!');
    } catch (err: any) {
      notifyApiError(err, 'Failed to activate plan');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSelectPaid = async (selectedSlug: string, amountPaise: number) => {
    if (amountPaise === 0 || selectedSlug === 'free' || selectedSlug === 'starter') {
      return handleSelectFree(selectedSlug);
    }

    try {
      setLoadingPlan(selectedSlug);
      
      // Step 1: Create Order
      const order = await billingApi.createOrder({
        plan: selectedSlug.toUpperCase(),
        amount: amountPaise,
        currency: 'INR',
      });

      if (order.amount === 0 || (order as any).isFree) {
        setHasActivePlan(true);
        await loadEntitlements();
        queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-modular'] });
        queryClient.invalidateQueries({ queryKey: ['public-tests'] });
        queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-metrics'] });
        notifySuccess('Plan activated successfully!');
        setLoadingPlan(null);
        return;
      }

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
      const razorpayKey =
        order.keyId ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        '';

      if (!razorpayKey) {
        notifyApiError('Payment gateway key is not configured. Please contact support.');
        setLoadingPlan(null);
        return;
      }

      const orderId = order.order_id || order.orderId;
      if (!orderId) {
        notifyApiError('Failed to generate a valid checkout order. Please try again.');
        setLoadingPlan(null);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillitriX InterVu AI',
        description: `${selectedSlug.toUpperCase()} Plan Subscription`,
        order_id: orderId,
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
          setLoadingPlan(selectedSlug);
          notifySuccess('Payment received! Activating your subscription...');
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
              queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-modular'] });
              queryClient.invalidateQueries({ queryKey: ['public-tests'] });
              queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-metrics'] });
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

  const rawUnlocked = allowedAssessmentsVal?.unlockedRewards;
  const attemptsByExam = allowedAssessmentsVal?.attemptsByExam || {};
  const assessmentList: string[] = Array.isArray(allowedAssessmentsVal?.assessments)
    ? allowedAssessmentsVal.assessments
    : Array.isArray(allowedAssessmentsVal)
    ? allowedAssessmentsVal
    : Object.keys(attemptsByExam);

  const examFriendlyNames: Record<string, string> = {
    TCS_NQT_PLACEMENT_ASSESSMENT: 'TCS NQT Placement Assessment – Full Length Mock Test',
    ASM_TCS_NQT_SHORT_001: 'TCS NQT Short — Free Readiness Check',
  };

  const unlockedRewards: Array<{ code: string; name: string; attempts: number }> =
    Array.isArray(rawUnlocked) && rawUnlocked.length > 0
      ? rawUnlocked
      : assessmentList.map((code: string) => ({
          code,
          name: examFriendlyNames[code] || code,
          attempts:
            typeof attemptsByExam[code] === 'number'
              ? attemptsByExam[code]
              : (allowedAssessmentsVal?.attemptsPerExam ?? 1),
        }));

  const totalReferralAttempts =
    unlockedRewards.length > 0
      ? unlockedRewards.reduce((sum, r) => sum + r.attempts, 0)
      : null;

  const roundsUsed = entitlements?.features?.monthlyRoundsUsed ?? 0;
  const rawRoundsLimit = entitlements?.features?.monthlyRoundsLimit ?? null;
  const effectiveLimit =
    totalReferralAttempts !== null
      ? totalReferralAttempts
      : rawRoundsLimit;

  const quotaLabel = totalReferralAttempts !== null ? 'Exam Attempts Used' : 'Monthly Tests Used';
  const percentUsed = effectiveLimit ? Math.min(100, Math.round((roundsUsed / effectiveLimit) * 100)) : 0;

  return (
    <div className='space-y-8 pt-2'>
      {/* 1. Full-Width Active Tier Overview Card */}
      <div className='rounded-[24px] border border-border/60 bg-card p-6 sm:p-7 shadow-2xs'>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6'>
          {/* Left: Active Plan Title & Badge */}
          <div className='flex items-start sm:items-center gap-3.5'>
            <div className='w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-2xs'>
              <CheckCircle2 className='size-5' />
            </div>
            <div>
              <div className='flex items-center gap-2.5 flex-wrap'>
                <h3 className='text-lg sm:text-xl font-bold text-foreground tracking-tight'>
                  {activePlanName || 'TCS NQT FREE'}
                </h3>
                <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'>
                  ACTIVE
                </span>
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Every Free, Never Expired Evaluation Tier • Billing cycle: Monthly Sync
              </p>
            </div>
          </div>

          {/* Right: Usage Meter */}
          <div className='w-full lg:w-72 space-y-1.5'>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-muted-foreground font-medium'>{quotaLabel}</span>
              <span className='font-bold text-foreground'>
                {roundsUsed} / {effectiveLimit ?? 2}
              </span>
            </div>
            <div className='w-full bg-muted/60 rounded-full h-2 overflow-hidden border border-border/40'>
              <div
                className='h-full rounded-full bg-sky-500 transition-all'
                style={{ width: `${effectiveLimit ? Math.min(100, Math.round((roundsUsed / effectiveLimit) * 100)) : 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3-Column Stats Row */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/40'>
          <div>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1'>
              Unlocked Referral Rewards
            </span>
            <span className='text-sm sm:text-base font-extrabold text-foreground'>
              {unlockedRewards.length > 0 ? `${unlockedRewards.length} Assessment` : '1 Assessment'}
            </span>
          </div>

          <div>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1'>
              Reward Assessment
            </span>
            <span className='text-sm sm:text-base font-extrabold text-foreground truncate block font-mono text-xs sm:text-sm pt-0.5'>
              {unlockedRewards[0]?.code || 'TCS_NQT_SHORT_ASSESSMENT'}
            </span>
          </div>

          <div>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1'>
              Reward Allowance
            </span>
            <span className='text-sm sm:text-base font-extrabold text-emerald-400'>
              {totalReferralAttempts ? `${totalReferralAttempts} Attempts` : '2 Attempts'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Upgrade Assessment Tier Section */}
      <div className='space-y-4'>
        <div>
          <h3 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
            Upgrade Assessment Tier
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Select an intensive preparation tier with expanded attempts and in-depth interview mocks.
          </p>
        </div>

        {/* 3-Column Plans Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch'>
          {dynamicPlans.length > 0 ? (
            dynamicPlans.map((plan: PlanDto) => {
              const isCurrent =
                hasActivePlan &&
                (entitlements?.planSlug === plan.slug ||
                 entitlements?.plan?.toLowerCase() === plan.slug.toLowerCase());

              const priceFormatted =
                plan.priceMonthly === 0
                  ? 'Free'
                  : `₹${(plan.priceMonthly / 100).toLocaleString('en-IN')}`;

              const handlePlanSelect = () => {
                if (plan.priceMonthly === 0 || plan.slug === 'free' || plan.slug === 'starter') {
                  handleSelectFree(plan.slug);
                } else if (plan.slug === 'teams') {
                  window.open('mailto:sales@skillitrix.com?subject=InterVu%20Enterprise%20Inquiry', '_blank');
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

              const displayFeatures = plan.features.map((f: any) => {
                if (f.featureKey === 'allowed_assessments' && typeof f.valueJson === 'object' && f.valueJson !== null) {
                  const list = f.valueJson.assessments;
                  const attempts = f.valueJson.overallAttempts ?? f.valueJson.attemptsPerExam;
                  const attemptsSuffix = attempts ? ` (${attempts} Attempts Overall)` : ' (Unlimited Attempts)';
                  if (Array.isArray(list)) {
                    if (list.includes('all')) return `All System Assessments Access${attemptsSuffix}`;
                    return `${list.length} Specific Assigned Assessment${list.length > 1 ? 's' : ''}${attemptsSuffix}`;
                  }
                }
                if (f.featureKey === 'monthly_rounds_limit' || f.featureKey === 'rounds_limit') {
                  if (typeof f.valueJson === 'number') {
                    return `${f.valueJson} Assessment Practice Tests`;
                  }
                  if (f.valueJson === null) {
                    return 'Unlimited Assessment Practice Tests';
                  }
                }
                return f.featureName ? f.featureName.replace(/^Monthly\s+/i, '') : '';
              });

              return (
                <PlanCard
                  key={plan.id}
                  title={plan.name}
                  price={priceFormatted}
                  originalPrice={originalPriceFormatted}
                  discountPercent={discountPercentFormatted}
                  badge={plan.badge || undefined}
                  highlighted={Boolean(plan.isHighlighted && !isCurrent)}
                  description={plan.description || ''}
                  features={displayFeatures}
                  buttonText={isCurrent ? 'Current Plan' : plan.buttonText}
                  disabled={Boolean(isCurrent)}
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
