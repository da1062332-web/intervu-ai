'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, History, X } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscription.store';

export function QuotaExhaustedModal() {
  const router = useRouter();
  const isQuotaExhaustedModalOpen = useSubscriptionStore((state) => state.isQuotaExhaustedModalOpen);
  const closeQuotaExhaustedModal = useSubscriptionStore((state) => state.closeQuotaExhaustedModal);
  const openPricingModal = useSubscriptionStore((state) => state.openPricingModal);

  if (!isQuotaExhaustedModalOpen) return null;

  const handleViewPlans = () => {
    closeQuotaExhaustedModal();
    // Support direct navigation to /plans while keeping modal fallback
    if (window.location.pathname.includes('/candidate/')) {
      openPricingModal();
    } else {
      router.push('/plans');
    }
  };

  const handleViewResults = () => {
    closeQuotaExhaustedModal();
    router.push('/candidate/history');
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity'
        onClick={closeQuotaExhaustedModal}
      />

      {/* Modal Card */}
      <div className='relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl z-10 my-auto text-center'>
        {/* Close Button */}
        <button
          onClick={closeQuotaExhaustedModal}
          className='absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors'
          aria-label='Close modal'
        >
          <X className='size-5' />
        </button>

        {/* Warning Icon Badge */}
        <div className='mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-sm'>
          <AlertCircle className='size-7' />
        </div>

        {/* Title & User Message */}
        <h3 className='text-xl font-extrabold text-slate-900 tracking-tight'>
          Assessment Quota Exhausted
        </h3>
        <p className='mt-2.5 text-sm text-slate-600 leading-relaxed font-medium'>
          Your assessment quota has been exhausted. Purchase a new plan to continue.
        </p>

        {/* Actions */}
        <div className='mt-6 space-y-2.5'>
          <button
            onClick={handleViewPlans}
            className='w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-[0.99]'
          >
            <span>View Plans</span>
            <ArrowRight className='size-4' />
          </button>

          <button
            onClick={handleViewResults}
            className='w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors'
          >
            <History className='size-4 text-slate-500' />
            <span>View Past Results</span>
          </button>
        </div>

        {/* Reassurance Footer */}
        <p className='mt-4 text-xs text-slate-500'>
          Your completed assessments and report history remain fully accessible.
        </p>
      </div>
    </div>
  );
}
