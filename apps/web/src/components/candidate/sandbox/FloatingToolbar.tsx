'use client';

import React, { useEffect } from 'react';
import { useScratchPad } from './useScratchPad';
import { useCalculator } from './useCalculator';
import { useSandboxZIndex } from './useSandboxZIndex';

interface FloatingToolbarProps {
  assessmentId: string;
}

export function FloatingToolbar({ assessmentId }: FloatingToolbarProps) {
  const {
    initialize: initScratchPad,
    toggleOpen: toggleScratchPad,
    isOpen: isScratchOpen,
  } = useScratchPad();
  const { initialize: initCalc, toggleOpen: toggleCalc, isOpen: isCalcOpen } = useCalculator();
  const { bringToFront } = useSandboxZIndex();

  // Initialize persistent states cleanly when assessment component mounts
  useEffect(() => {
    if (assessmentId) {
      initScratchPad(assessmentId);
      initCalc(assessmentId);
    }
  }, [assessmentId, initScratchPad, initCalc]);

  const handleOpenScratchPad = () => {
    toggleScratchPad();
    if (!isScratchOpen) {
      bringToFront('scratchpad');
    }
  };

  const handleOpenCalc = () => {
    toggleCalc();
    if (!isCalcOpen) {
      bringToFront('calculator');
    }
  };

  return (
    <div className='p-3 bg-[#e3f2fb] border-b border-[#b7d5ec] shrink-0 select-none'>
      <div className='flex items-center justify-between text-[11px] font-bold text-[#1c3e66] uppercase tracking-wider mb-2'>
        <span>Productivity Tools</span>
        <span className='text-[10px] font-medium text-gray-600 lowercase'>scratch & calc</span>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <button
          onClick={handleOpenScratchPad}
          className={`py-2 px-2 rounded-sm border font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
            isScratchOpen
              ? 'bg-[#1c3e66] text-white border-[#11263e] shadow-inner ring-1 ring-blue-400'
              : 'bg-white hover:bg-[#d6eafb] text-[#1c3e66] border-[#96bae0]'
          }`}
          title='Toggle Rough Paper (Scratch Pad)'
          aria-pressed={isScratchOpen}
        >
          <span>📝</span>
          <span className='truncate'>Rough Paper</span>
        </button>

        <button
          onClick={handleOpenCalc}
          className={`py-2 px-2 rounded-sm border font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
            isCalcOpen
              ? 'bg-[#059669] text-white border-[#047451] shadow-inner ring-1 ring-emerald-400'
              : 'bg-white hover:bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]'
          }`}
          title='Toggle Basic Calculator'
          aria-pressed={isCalcOpen}
        >
          <span>🧮</span>
          <span className='truncate'>Calculator</span>
        </button>
      </div>
    </div>
  );
}
