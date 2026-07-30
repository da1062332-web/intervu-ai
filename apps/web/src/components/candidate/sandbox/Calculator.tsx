'use client';

import React, { useEffect, useState } from 'react';
import { useCalculator } from './useCalculator';
import { Delete, History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export function Calculator() {
  const {
    display,
    expression,
    history,
    isOpen,
    isMinimized,
    inputDigit,
    inputDecimal,
    performOperation,
    calculatePercentage,
    calculateSquareRoot,
    toggleSign,
    backspace,
    clear,
    equals,
    clearCalculator,
  } = useCalculator();

  const [showHistory, setShowHistory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Keyboard support for fast calculation during tests
  useEffect(() => {
    if (!isOpen || isMinimized || showResetConfirm) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if candidate is typing notes in textarea or input
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input' || activeTag === 'select') return;

      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        inputDigit(key);
      } else if (key === '.') {
        e.preventDefault();
        inputDecimal();
      } else if (key === '+' || key === '-') {
        e.preventDefault();
        performOperation(key);
      } else if (key === '*' || key === 'x' || key === 'X') {
        e.preventDefault();
        performOperation('×');
      } else if (key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (key === '%') {
        e.preventDefault();
        calculatePercentage();
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        equals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        if (key === 'Escape') {
          if (showHistory) {
            e.preventDefault();
            setShowHistory(false);
          } else if (display !== '0' || expression !== '') {
            e.preventDefault();
            clear();
          }
        } else {
          e.preventDefault();
          clear();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, showHistory, showResetConfirm, display, expression, inputDigit, inputDecimal, performOperation, calculatePercentage, equals, backspace, clear]);

  return (
    <div className='flex flex-col h-full w-full bg-slate-900 text-white rounded-b-lg font-mono select-none overflow-hidden border-t border-slate-800 shadow-inner relative'>
      {/* Upper Display & Expression Preview */}
      <div className='flex flex-col p-3 bg-slate-950 text-right h-[96px] justify-between shrink-0 border-b border-slate-800 relative z-10'>
        <div className='flex items-center justify-between text-xs text-slate-400 mb-1'>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className='flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors text-[11px] font-sans border border-slate-700 cursor-pointer shadow-xs'
            title='Toggle Calculation History'
            aria-expanded={showHistory}
          >
            <History className='size-3 text-emerald-400' />
            <span className='font-semibold'>History ({history.length})</span>
            {showHistory ? <ChevronUp className='size-3' /> : <ChevronDown className='size-3' />}
          </button>
          <span className='truncate ml-2 text-slate-400 font-medium tracking-wide text-xs' title={expression || ''}>
            {expression || '\u00A0'}
          </span>
        </div>

        <div
          className='text-3xl font-bold text-white tracking-wider truncate overflow-x-auto pb-0.5 text-right w-full font-sans'
          title={display}
        >
          {display}
        </div>
      </div>

      {/* Full Slide-Over History Drawer Overlay (Fixes layout squishing & displays properly) */}
      {showHistory && (
        <div className='absolute top-[96px] inset-x-0 bottom-0 z-40 bg-slate-900/98 backdrop-blur-md overflow-hidden flex flex-col p-3.5 text-xs border-t border-slate-700 shadow-xl font-sans animate-in fade-in duration-150'>
          <div className='flex items-center justify-between text-slate-300 mb-2 border-b border-slate-800 pb-2 font-bold tracking-wider text-[11px] shrink-0'>
            <div className='flex items-center gap-1.5'>
              <History className='size-3.5 text-emerald-400' />
              <span className='uppercase'>Calculation History</span>
            </div>
            <div className='flex items-center gap-2'>
              {history.length > 0 && (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className='text-red-400 hover:text-red-300 font-semibold lowercase hover:underline cursor-pointer px-1.5 py-0.5 rounded hover:bg-red-950/40 transition-colors'
                >
                  clear [×]
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className='text-slate-400 hover:text-white font-medium lowercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700 cursor-pointer'
              >
                close
              </button>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto custom-scrollbar py-1 space-y-2'>
            {history.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-slate-500 space-y-2 py-10'>
                <History className='size-8 opacity-40 text-slate-600' />
                <span className='italic text-xs text-slate-400'>No calculations in memory</span>
                <span className='text-[10px] text-slate-600 text-center max-w-[200px]'>
                  Completed operations (=) will appear here automatically.
                </span>
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  className='p-2.5 bg-slate-800/80 hover:bg-slate-750 rounded text-right transition-colors border border-slate-700/60 font-mono tracking-tight text-[13px] break-all shadow-2xs select-text'
                >
                  <span className='text-slate-200 font-semibold'>{item}</span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowHistory(false)}
            className='w-full py-2 mt-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700 text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-xs'
          >
            Back to Calculator
          </button>
        </div>
      )}

      {/* Calculator Button Pad */}
      <div className='p-2 bg-slate-900 grid grid-cols-4 gap-1.5 flex-1 text-sm font-semibold font-sans'>
        <button
          onClick={clear}
          className='py-2 rounded bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-all font-bold active:scale-95 cursor-pointer'
          title='Clear Display (C)'
        >
          C
        </button>
        <button
          onClick={calculateSquareRoot}
          className='py-2 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 transition-all active:scale-95 cursor-pointer'
          title='Square Root'
        >
          √
        </button>
        <button
          onClick={calculatePercentage}
          className='py-2 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 transition-all active:scale-95 cursor-pointer'
          title='Percentage (%)'
        >
          %
        </button>
        <button
          onClick={() => performOperation('÷')}
          className='py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-xs transition-all active:scale-95 text-base cursor-pointer'
          title='Divide (÷)'
        >
          ÷
        </button>

        <button
          onClick={() => inputDigit('7')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          7
        </button>
        <button
          onClick={() => inputDigit('8')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          8
        </button>
        <button
          onClick={() => inputDigit('9')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          9
        </button>
        <button
          onClick={() => performOperation('×')}
          className='py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-xs transition-all active:scale-95 text-base cursor-pointer'
          title='Multiply (×)'
        >
          ×
        </button>

        <button
          onClick={() => inputDigit('4')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          4
        </button>
        <button
          onClick={() => inputDigit('5')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          5
        </button>
        <button
          onClick={() => inputDigit('6')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          6
        </button>
        <button
          onClick={() => performOperation('-')}
          className='py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-xs transition-all active:scale-95 text-base cursor-pointer'
          title='Subtract (-)'
        >
          −
        </button>

        <button
          onClick={() => inputDigit('1')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          1
        </button>
        <button
          onClick={() => inputDigit('2')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          2
        </button>
        <button
          onClick={() => inputDigit('3')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base cursor-pointer'
        >
          3
        </button>
        <button
          onClick={() => performOperation('+')}
          className='py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-xs transition-all active:scale-95 text-base cursor-pointer'
          title='Add (+)'
        >
          +
        </button>

        <button
          onClick={toggleSign}
          className='py-2 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 transition-all active:scale-95 cursor-pointer'
          title='Toggle Sign (+/-)'
        >
          +/-
        </button>
        <button
          onClick={() => inputDigit('0')}
          className='py-2 rounded bg-slate-800/80 text-white hover:bg-slate-750 border border-slate-700/60 transition-all active:scale-95 text-base font-semibold cursor-pointer'
        >
          0
        </button>
        <button
          onClick={inputDecimal}
          className='py-2 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 transition-all active:scale-95 font-bold text-base cursor-pointer'
          title='Decimal (.)'
        >
          .
        </button>
        <button
          onClick={equals}
          className='py-2 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md transition-all active:scale-95 text-base cursor-pointer'
          title='Equals (=)'
        >
          =
        </button>
      </div>

      {/* Bottom Quick Bar: Backspace and Reset All */}
      <div className='px-2 pb-2 bg-slate-900 flex items-center gap-1.5 shrink-0 z-10'>
        <button
          onClick={backspace}
          className='flex-1 py-2 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs'
          title='Backspace (⌫)'
        >
          <Delete className='size-4 text-slate-400' />
          <span>Backspace</span>
        </button>
        <button
          onClick={() => setShowResetConfirm(true)}
          className='flex-1 py-2 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs'
          title='Reset Calculator & Clear History'
        >
          <Trash2 className='size-3.5 text-red-400' />
          <span>Reset</span>
        </button>
      </div>

      {/* In-App Confirmation Modal (No native browser alert/confirm to preserve Fullscreen Mode) */}
      {showResetConfirm && (
        <div 
          className='absolute inset-0 z-[200] bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans'
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className='bg-slate-950 rounded-lg p-4 max-w-[260px] w-full shadow-2xl border border-slate-700 text-slate-200 flex flex-col space-y-3 animate-in zoom-in-95 duration-150'>
            <div className='flex items-center gap-2 text-amber-400 font-bold text-sm'>
              <span className='text-base'>⚠️</span>
              <span>Reset Calculator?</span>
            </div>
            <p className='text-xs text-slate-300 leading-relaxed font-normal'>
              This will reset current display and clear all calculation history in memory.
            </p>
            <div className='flex items-center justify-end gap-2 pt-2 border-t border-slate-800'>
              <button
                onClick={() => setShowResetConfirm(false)}
                className='px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCalculator();
                  setShowResetConfirm(false);
                  setShowHistory(false);
                }}
                className='px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer'
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
