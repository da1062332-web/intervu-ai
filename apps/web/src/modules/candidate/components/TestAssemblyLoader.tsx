'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, Cpu, Lock } from 'lucide-react';

const STORAGE_KEY = 'intervu_assembly_progress';

interface TestAssemblyLoaderProps {
  isResume?: boolean;
}

export function TestAssemblyLoader({ isResume = false }: TestAssemblyLoaderProps) {
  const [progress, setProgress] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 95) {
          return parsed;
        }
      }
    }
    return 5;
  });

  const [stageText, setStageText] = useState(() => {
    if (progress < 25) {
      return isResume ? 'Re-verifying session token...' : 'Initializing secure test environment...';
    } else if (progress < 55) {
      return isResume ? 'Restoring saved candidate state...' : 'Assembling section questions & variants...';
    } else if (progress < 80) {
      return 'Verifying camera & AI proctoring channel...';
    } else {
      return 'Finalizing exam sandbox & randomizing options...';
    }
  });

  useEffect(() => {
    // Smooth simulated progress timer for assembly
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95; // Hold at 95% until navigation and execution render finishes
        }
        // Accelerate early, then slow down near completion
        const increment = prev < 40 ? 6 : prev < 75 ? 4 : 2;
        const next = Math.min(prev + increment, 95);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(STORAGE_KEY, next.toString());
        }

        if (next < 25) {
          setStageText(isResume ? 'Re-verifying session token...' : 'Initializing secure test environment...');
        } else if (next < 55) {
          setStageText(isResume ? 'Restoring saved candidate state...' : 'Assembling section questions & variants...');
        } else if (next < 80) {
          setStageText('Verifying camera & AI proctoring channel...');
        } else {
          setStageText('Finalizing exam sandbox & randomizing options...');
        }

        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isResume]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative max-w-md w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 text-center text-slate-100 shadow-2xl overflow-hidden flex flex-col items-center space-y-6">
        {/* Background ambient lighting */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
          <Lock className="w-3.5 h-3.5 animate-pulse" />
          {isResume ? 'Session Recovery In Progress' : 'Assessment Assembly'}
        </div>

        {/* Center Icon */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 shadow-inner group">
          <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/40 border-t-transparent animate-spin" />
          <Cpu className="w-9 h-9 text-indigo-400 animate-pulse" />
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            {isResume ? 'Resuming Your Session' : 'Assembling Assessment'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isResume
              ? 'Restoring your state and securing your connection...'
              : 'Generating questions and preparing secure test sandbox...'}
          </p>
        </div>

        {/* Centered Loading Bar Container */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              {stageText}
            </span>
            <span className="text-indigo-400 font-mono text-sm font-bold">
              {progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/90 border border-slate-700/60 h-3.5 rounded-full p-0.5 relative overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-200 ease-out shadow-sm relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect inside progress bar */}
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>
        </div>

        {/* Bottom security assurance */}
        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 border-t border-slate-800/80 w-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Proctoring Active & Environment Protected</span>
        </div>
      </div>
    </div>
  );
}
