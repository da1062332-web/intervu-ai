'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Code2 } from 'lucide-react';
import { SandboxLayoutProps } from './StreamlinedSandboxLayout';

export function TerminalSandboxLayout({
  onSubmit,
  isSubmitting,
}: SandboxLayoutProps) {
  const [activeTab, setActiveTab] = useState<'problem' | 'output'>('problem');

  return (
    <div className='flex flex-col min-h-screen bg-[#0d1117] text-slate-200 font-mono'>
      {/* Top Navigation */}
      <header className='h-14 bg-[#161b22] border-b border-slate-800 px-6 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold'>
            <Code2 className='w-4 h-4' />
          </div>
          <div>
            <h1 className='text-xs font-bold text-slate-200 tracking-wider uppercase'>
              Intervu Terminal CBT
            </h1>
            <span className='text-[11px] text-emerald-400'>
              Terminal IDE Layout
            </span>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 bg-slate-900 border border-slate-700/60 px-3 py-1 rounded text-xs text-emerald-400'>
            <Clock className='w-3.5 h-3.5' />
            <span>00:58:30</span>
          </div>
          <Button
            size='sm'
            onClick={onSubmit}
            disabled={isSubmitting}
            className='bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-8 px-4'
          >
            {isSubmitting ? 'Evaluating...' : 'Submit & Exit'}
          </Button>
        </div>
      </header>

      {/* Main IDE Layout */}
      <main className='flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800'>
        {/* Left Pane: Problem Description */}
        <div className='p-6 overflow-y-auto space-y-4'>
          <div className='flex items-center gap-2'>
            <Badge className='bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs'>
              Problem 01 • Algorithms
            </Badge>
            <Badge className='bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs'>
              Medium
            </Badge>
          </div>

          <h2 className='text-base font-bold text-white'>Rotate Array by K Positions</h2>
          <p className='text-xs text-slate-400 leading-relaxed font-sans'>
            Given an integer array <code className='text-emerald-400 bg-slate-900 px-1 py-0.5 rounded'>nums</code> and an integer <code className='text-emerald-400 bg-slate-900 px-1 py-0.5 rounded'>k</code>, rotate the array to the right by <code className='text-emerald-400 bg-slate-900 px-1 py-0.5 rounded'>k</code> steps, where <code className='text-emerald-400 bg-slate-900 px-1 py-0.5 rounded'>k</code> is non-negative.
          </p>

          <div className='bg-slate-900/80 border border-slate-800 rounded-md p-3 text-xs space-y-2'>
            <div className='text-slate-500'>// Example 1:</div>
            <div><span className='text-slate-400'>Input:</span> nums = [1,2,3,4,5,6,7], k = 3</div>
            <div><span className='text-slate-400'>Output:</span> [5,6,7,1,2,3,4]</div>
          </div>
        </div>

        {/* Right Pane: Code Editor Mock */}
        <div className='flex flex-col bg-[#090d13]'>
          <div className='h-9 bg-[#161b22] border-b border-slate-800 px-4 flex items-center justify-between text-xs'>
            <div className='flex items-center gap-2 text-slate-400'>
              <span className='text-emerald-400 font-bold'>solution.ts</span>
              <span className='text-slate-600'>• TypeScript 5.4</span>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setActiveTab('problem')}
                className={`px-2 py-0.5 rounded ${activeTab === 'problem' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
              >
                Code
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`px-2 py-0.5 rounded ${activeTab === 'output' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
              >
                Test Cases
              </button>
            </div>
          </div>

          <div className='flex-1 p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto'>
            <div><span className='text-purple-400'>function</span> <span className='text-blue-400'>rotate</span>(nums: <span className='text-emerald-400'>number[]</span>, k: <span className='text-emerald-400'>number</span>): <span className='text-emerald-400'>void</span> {'{'}</div>
            <div className='pl-4 text-slate-500'>// Write your optimal in-place algorithm here</div>
            <div className='pl-4'>k = k % nums.length;</div>
            <div className='pl-4'>nums.unshift(...nums.splice(-k));</div>
            <div>{'}'}</div>
          </div>

          <div className='h-12 bg-[#161b22] border-t border-slate-800 px-4 flex items-center justify-between'>
            <span className='text-[11px] text-emerald-400 flex items-center gap-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5' /> All 12 Test Cases Passing
            </span>
            <Button size='sm' className='bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-7 px-3'>
              Run Tests
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
