'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Lightbulb,
  Compass,
  Briefcase,
  Brain,
  Code2,
  ShieldAlert,
  Timer,
  CheckCircle2,
  BookOpen,
  Target,
} from 'lucide-react';
import { CANDIDATE_TIPS, CandidateTip } from '../data/candidateTipsData';

interface TestAssemblyLoaderProps {
  isResume?: boolean;
}

export function TestAssemblyLoader({ isResume = false }: TestAssemblyLoaderProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(() =>
    Math.floor(Math.random() * CANDIDATE_TIPS.length)
  );
  const [isFading, setIsFading] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  const getNextRandomTip = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentTipIndex((prevIndex) => {
        let nextIndex = Math.floor(Math.random() * CANDIDATE_TIPS.length);
        if (CANDIDATE_TIPS.length > 1 && nextIndex === prevIndex) {
          nextIndex = (nextIndex + 1) % CANDIDATE_TIPS.length;
        }
        return nextIndex;
      });
      setProgressWidth(0);
      setIsFading(false);
    }, 200);
  }, []);

  useEffect(() => {
    // 50ms tick interval to smoothly drive the 5-second progress indicator bar
    const stepTimeMs = 50;
    const totalDurationMs = 5000;
    const increment = (stepTimeMs / totalDurationMs) * 100;

    const interval = setInterval(() => {
      setProgressWidth((prev) => {
        if (prev >= 100) {
          getNextRandomTip();
          return 0;
        }
        return prev + increment;
      });
    }, stepTimeMs);

    return () => clearInterval(interval);
  }, [getNextRandomTip]);

  const currentTip: CandidateTip = CANDIDATE_TIPS[currentTipIndex] || CANDIDATE_TIPS[0];

  const renderIcon = (type: CandidateTip['iconType']) => {
    switch (type) {
      case 'general':
        return <Lightbulb className="w-6 h-6 text-blue-400" />;
      case 'numerical':
        return <Target className="w-6 h-6 text-emerald-400" />;
      case 'logical':
        return <Brain className="w-6 h-6 text-cyan-400" />;
      case 'verbal':
        return <BookOpen className="w-6 h-6 text-violet-400" />;
      case 'coding':
        return <Code2 className="w-6 h-6 text-indigo-400" />;
      case 'company':
        return <Briefcase className="w-6 h-6 text-purple-400" />;
      case 'difficulty':
        return <Compass className="w-6 h-6 text-blue-400" />;
      case 'time':
        return <Timer className="w-6 h-6 text-rose-400" />;
      case 'antitrap':
        return <ShieldAlert className="w-6 h-6 text-amber-400" />;
      case 'pretest':
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      default:
        return <Lightbulb className="w-6 h-6 text-indigo-400" />;
    }
  };

  const getColorClasses = (color: CandidateTip['color']) => {
    switch (color) {
      case 'emerald':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          glow: 'from-emerald-500/15 via-teal-500/10 to-transparent',
          border: 'border-emerald-500/30',
        };
      case 'amber':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          glow: 'from-amber-500/15 via-orange-500/10 to-transparent',
          border: 'border-amber-500/30',
        };
      case 'purple':
        return {
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          glow: 'from-purple-500/15 via-pink-500/10 to-transparent',
          border: 'border-purple-500/30',
        };
      case 'cyan':
        return {
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          glow: 'from-cyan-500/15 via-sky-500/10 to-transparent',
          border: 'border-cyan-500/30',
        };
      case 'violet':
        return {
          badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          glow: 'from-violet-500/15 via-purple-500/10 to-transparent',
          border: 'border-violet-500/30',
        };
      case 'rose':
        return {
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          glow: 'from-rose-500/15 via-pink-500/10 to-transparent',
          border: 'border-rose-500/30',
        };
      case 'blue':
        return {
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          glow: 'from-blue-500/15 via-indigo-500/10 to-transparent',
          border: 'border-blue-500/30',
        };
      case 'indigo':
      default:
        return {
          badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          glow: 'from-indigo-500/15 via-purple-500/10 to-transparent',
          border: 'border-indigo-500/30',
        };
    }
  };

  const styleConfig = getColorClasses(currentTip.color);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative max-w-xl w-full bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl overflow-hidden flex flex-col space-y-6">
        {/* Dynamic Glow Ambient Lighting */}
        <div
          className={`absolute -top-28 -left-28 w-60 h-60 bg-gradient-to-br ${styleConfig.glow} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
        />
        <div className="absolute -bottom-28 -right-28 w-60 h-60 bg-gradient-to-tl from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header bar with test loading status */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/40 border-t-indigo-400 animate-spin" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-300">
              {isResume ? 'Preparing exam session...' : 'Preparing assessment environment...'}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className={`transition-all duration-300 ${
            isFading ? 'opacity-0 translate-y-2 scale-98' : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          {/* Category & Topic Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${styleConfig.badge}`}
            >
              {currentTip.badge}
            </span>

            {currentTip.topic && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {currentTip.topic}
              </span>
            )}
          </div>

          {/* Tip Card Body */}
          <div
            className={`relative p-5 sm:p-6 rounded-2xl bg-slate-950/60 border ${styleConfig.border} shadow-inner space-y-3`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm shrink-0">
                {renderIcon(currentTip.iconType)}
              </div>

              <div className="space-y-1 flex-1">
                <h3 className="text-lg sm:text-xl font-bold font-heading tracking-tight text-slate-100">
                  {currentTip.title}
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                  {currentTip.content}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5-second interval visual progress line */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-75 ease-linear"
            style={{
              width: `${Math.min(progressWidth, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

