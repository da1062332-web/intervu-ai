'use client';

import React from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { CandidateHistorySection } from '@/modules/candidate/components/CandidateHistorySection';

export default function CandidateResultsRoute() {
  return (
    <div className='mx-auto w-full max-w-[1440px] px-6 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 space-y-8 animate-fade-in-up'>
      <SectionHeader
        title='Assessment Results & History'
        description='View and track all your completed assessment results, attempt history, and evaluation reports.'
        breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Results & History' }]}
      />
      <CandidateHistorySection compact={false} />
    </div>
  );
}
