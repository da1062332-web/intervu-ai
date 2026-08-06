'use client';

import React from 'react';
import { CandidateProgressSection } from '../components/CandidateProgressSection';

export function ProgressDashboard() {
  return (
    <div className='mx-auto w-full max-w-[1440px] px-6 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 animate-fade-in-up'>
      <CandidateProgressSection compact={false} />
    </div>
  );
}

