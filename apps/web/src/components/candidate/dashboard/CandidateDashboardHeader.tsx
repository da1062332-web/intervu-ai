'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { ShieldCheck } from 'lucide-react';

export function CandidateDashboardHeader() {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.name || user?.fullName || 'Candidate';

  return (
    <div className='space-y-3 max-w-4xl'>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes wave-hand {
          0% { transform: rotate(0.0deg); }
          15% { transform: rotate(16.0deg); }
          30% { transform: rotate(-10.0deg); }
          45% { transform: rotate(14.0deg); }
          60% { transform: rotate(-6.0deg); }
          75% { transform: rotate(10.0deg); }
          100% { transform: rotate(0.0deg); }
        }
        .animate-wave-once {
          animation-name: wave-hand;
          animation-duration: 1.8s;
          animation-iteration-count: 1;
          transform-origin: 70% 70%;
          display: inline-block;
        }
      `,
        }}
      />

      <div className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#eff1fe] dark:bg-indigo-950/50 text-[#6366f1] dark:text-indigo-400 text-[11px] font-bold tracking-wider uppercase border border-indigo-200/40 dark:border-indigo-800/40'>
        <ShieldCheck className='size-3.5' />
        <span>CANDIDATE PORTAL</span>
      </div>

      <div className='space-y-1.5'>
        <h1 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight flex flex-wrap items-center gap-x-3'>
          <span>Welcome back, {displayName}</span>
          <span className='animate-wave-once text-3xl sm:text-4xl select-none'>👋</span>
        </h1>
        <p className='text-sm sm:text-base text-muted-foreground font-normal leading-relaxed max-w-2xl'>
          Here is an overview of your active evaluations, performance analytics, and recommended
          assessments to help you advance your career.
        </p>
      </div>
    </div>
  );
}
