'use client';

import React from 'react';
import { CandidateReferralCard } from '@/modules/candidate/components/CandidateReferralCard';
import { Gift } from 'lucide-react';

export default function CandidateReferralsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 md:px-8 py-8 space-y-6">
      <div className="border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Referral Program</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Share your unique referral link with fellow candidates to unlock assessment attempts and rewards.
            </p>
          </div>
        </div>
      </div>

      <CandidateReferralCard />
    </div>
  );
}
