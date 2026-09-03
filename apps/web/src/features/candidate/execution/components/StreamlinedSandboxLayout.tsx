'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronRight, ChevronLeft, Layout } from 'lucide-react';

export interface SandboxLayoutProps {
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function StreamlinedSandboxLayout({
  onSubmit,
  isSubmitting,
}: SandboxLayoutProps) {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  return (
    <div className='flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans'>
      {/* Top Navigation */}
      <header className='h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold'>
            <Layout className='w-5 h-5' />
          </div>
          <div>
            <h1 className='text-sm font-semibold text-slate-800 leading-none'>
              Intervu CBT Experience
            </h1>
            <span className='text-xs text-indigo-600 font-medium'>
              Streamlined Layout
            </span>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-md text-indigo-700 font-mono text-xs font-semibold'>
            <Clock className='w-4 h-4 text-indigo-600' />
            <span>59:42 remaining</span>
          </div>
          <Button
            size='sm'
            onClick={onSubmit}
            disabled={isSubmitting}
            className='bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4'
          >
            {isSubmitting ? 'Submitting...' : 'Finish Assessment'}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className='flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Section: Question Card */}
        <div className='md:col-span-2 space-y-6'>
          <div className='bg-white border border-slate-200 rounded-xl p-6 shadow-sm'>
            <div className='flex items-center justify-between pb-4 border-b border-slate-100 mb-4'>
              <Badge variant='outline' className='bg-indigo-50 text-indigo-700 border-indigo-200'>
                Section 1 • Quantitative Aptitude
              </Badge>
              <span className='text-xs font-medium text-slate-400'>Question 1 of 15</span>
            </div>

            <h2 className='text-lg font-semibold text-slate-900 mb-3'>
              A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train in meters?
            </h2>
            <p className='text-sm text-slate-600 mb-6'>
              Use standard speed-distance-time relationships. 1 km/hr = 5/18 m/s.
            </p>

            {/* Options */}
            <div className='space-y-3'>
              {[
                { id: 0, label: 'A', text: '120 metres' },
                { id: 1, label: 'B', text: '150 metres (Correct)' },
                { id: 2, label: 'C', text: '180 metres' },
                { id: 3, label: 'D', text: '324 metres' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOpt(opt.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-lg border text-left text-sm transition-all ${
                    selectedOpt === opt.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                      selectedOpt === opt.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>

            {/* Navigation Footer */}
            <div className='flex items-center justify-between pt-6 border-t border-slate-100 mt-6'>
              <Button variant='outline' size='sm' className='gap-1.5' disabled>
                <ChevronLeft className='w-4 h-4' /> Previous
              </Button>
              <Button size='sm' className='bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5'>
                Save & Next <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Section: Palette & Overview */}
        <div className='space-y-6'>
          <div className='bg-white border border-slate-200 rounded-xl p-5 shadow-sm'>
            <h3 className='text-xs font-bold uppercase tracking-wider text-slate-500 mb-3'>
              Question Matrix
            </h3>
            <div className='grid grid-cols-5 gap-2'>
              {Array.from({ length: 15 }).map((_, i) => (
                <button
                  key={i}
                  className={`h-9 rounded-md text-xs font-semibold flex items-center justify-center transition-all ${
                    i === 0
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1'
                      : i < 3
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className='mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500'>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-2'>
                  <span className='w-2.5 h-2.5 rounded-full bg-indigo-600' /> Current
                </span>
                <span className='font-semibold text-slate-700'>1</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-2'>
                  <span className='w-2.5 h-2.5 rounded-full bg-emerald-500' /> Answered
                </span>
                <span className='font-semibold text-slate-700'>2</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='flex items-center gap-2'>
                  <span className='w-2.5 h-2.5 rounded-full bg-slate-300' /> Unvisited
                </span>
                <span className='font-semibold text-slate-700'>12</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
