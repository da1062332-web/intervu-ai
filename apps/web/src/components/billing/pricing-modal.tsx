'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { PlanCard } from './plan-card';
import { useSubscriptionStore } from '@/store/subscription.store';
import { useAuthStore } from '@/store/auth.store';
import { billingApi } from '@/services/api/billing.api';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';
import type { PlanDto } from '@intervu-ai/contracts';

export function PricingModal() {
  const isPricingModalOpen = useSubscriptionStore((state) => state.isPricingModalOpen);
  const hasActivePlan = useSubscriptionStore((state) => state.hasActivePlan);
  const currentPlan = useSubscriptionStore((state) => state.plan);
  const closePricingModal = useSubscriptionStore((state) => state.closePricingModal);
  const loadEntitlements = useSubscriptionStore((state) => state.loadEntitlements);
  const setHasActivePlan = useSubscriptionStore((state) => state.setHasActivePlan);
  const user = useAuthStore((state) => state.user);

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [dynamicPlans, setDynamicPlans] = useState<PlanDto[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('intervu_pricing_modal_dismissed', 'true');
    }
    closePricingModal();
  };

  useEffect(() => {
    if (isPricingModalOpen) {
      loadDynamicPlans();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPricingModalOpen]);

  const loadDynamicPlans = async () => {
    try {
      setIsLoadingPlans(true);
      const plans = await billingApi.getPublicPlans();
      if (plans && plans.length > 0) {
        setDynamicPlans(plans);
      }
    } catch {
      // Fallback silently if offline or initial load
    } finally {
      setIsLoadingPlans(false);
    }
  };

  if (!isPricingModalOpen || (user && user.role !== 'CANDIDATE')) return null;

  const handleSelectFree = async () => {
    try {
      setLoadingPlan('free');
      await billingApi.subscribeFree();
      setHasActivePlan(true);
      await loadEntitlements();
      notifySuccess('Free plan activated successfully! Welcome to InterVu.');
      handleClose();
    } catch (err: any) {
      notifyApiError(err, 'Failed to activate Free plan');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSelectPaid = async (planSlug: string, amountPaise: number) => {
    try {
      setLoadingPlan(planSlug);
      
      // Step 1: Call Backend to Create Order
      const order = await billingApi.createOrder({
        plan: planSlug.toUpperCase(),
        amount: amountPaise,
        currency: 'INR',
      });

      // Step 2: Load Razorpay Checkout SDK Script
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
        notifyApiError('Failed to load payment gateway. Please check your internet connection.');
        setLoadingPlan(null);
        return;
      }

      // Step 3: Open Razorpay Modal with order_id
      const options = {
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillitriX InterVu AI',
        description: `${planSlug.toUpperCase()} Plan Subscription`,
        order_id: order.order_id || order.orderId,
        prefill: {
          name: user?.fullName || 'Candidate',
          email: user?.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
        // Step 4: On Payment Success -> Verify Signature on Backend
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
              plan: planSlug.toUpperCase(),
            });

            if (verifyRes.success) {
              setHasActivePlan(true);
              await loadEntitlements();
              notifySuccess(`Payment verified successfully! Welcome to InterVu ${planSlug.toUpperCase()}.`);
              closePricingModal();
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

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6 animate-in fade-in duration-200 overflow-y-auto'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity'
        onClick={handleClose}
      />

      {/* Modal Container - Solid Opaque White */}
      <div className='relative w-full max-w-4xl lg:max-w-5xl rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl z-10 my-auto flex flex-col max-h-[94vh]'>
        {/* Close Button - Always available to candidates */}
        <button
          onClick={handleClose}
          className='absolute right-4 top-4 sm:right-6 sm:top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors z-20'
          aria-label='Close pricing modal'
          title='Close'
        >
          <X className='size-5' />
        </button>

        {/* Scrollable Content Container */}
        <div className='overflow-y-auto pr-1 -mr-1'>
          {/* Header */}
          <div className='text-center max-w-xl mx-auto mb-6'>
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2.5'>
              <Sparkles className='size-3.5' />
              Transparent Pricing
            </div>
            <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900'>
              {hasActivePlan ? 'Upgrade Your Plan' : 'Select a Plan to Get Started'}
            </h2>
            <p className='text-slate-600 mt-1.5 text-xs sm:text-sm leading-relaxed'>
              Choose the tier that matches your preparation journey. Managed dynamically by Plan Manager.
            </p>
          </div>

          {/* Pricing Cards Grid - Rendered Dynamically from Database */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch'>
            {dynamicPlans.length > 0 ? (
              dynamicPlans.map((plan) => {
                const isCurrent = currentPlan?.toUpperCase() === plan.slug.toUpperCase();
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

                return (
                  <PlanCard
                    key={plan.id}
                    title={plan.name}
                    price={priceFormatted}
                    originalPrice={originalPriceFormatted}
                    discountPercent={discountPercentFormatted}
                    period={plan.priceMonthly > 0 ? '/ month' : undefined}
                    badge={plan.badge || undefined}
                    highlighted={plan.isHighlighted}
                    description={plan.description || ''}
                    features={plan.features.map((f) => f.featureName)}
                    buttonText={isCurrent ? 'Current Plan' : plan.buttonText}
                    disabled={isCurrent}
                    isLoading={loadingPlan === plan.slug}
                    onSelect={handlePlanSelect}
                  />
                );
              })
            ) : isLoadingPlans ? (
              // Clean Skeleton Placeholders while fetching live database plans
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className='h-80 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-6 animate-pulse flex flex-col justify-between'
                >
                  <div className='space-y-3'>
                    <div className='h-5 w-24 bg-slate-200 rounded' />
                    <div className='h-8 w-32 bg-slate-200 rounded' />
                    <div className='h-4 w-full bg-slate-200 rounded' />
                  </div>
                  <div className='h-10 w-full bg-slate-200 rounded-xl' />
                </div>
              ))
            ) : (
              <div className='col-span-full py-10 text-center text-slate-500 font-medium text-sm'>
                No active subscription plans available at the moment.
              </div>
            )}
          </div>

          {/* Footer Guarantee */}
          <div className='mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium text-center'>
            <ShieldCheck className='size-4 text-emerald-600' />
            <span>Encrypted Razorpay Checkout • Dynamic Plan Rules • Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
