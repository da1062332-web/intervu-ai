import React from 'react';
import { Card } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import {
  Trophy,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  data: PerformanceDashboardResponse;
  attemptId?: string;
}

export const DashboardStrengthWeakness: React.FC<Props> = ({ data, attemptId }) => {
  const strongSections = (data.sectionAccuracy || []).filter((s) => s.accuracy >= 70);
  const weakSections = (data.sectionAccuracy || []).filter((s) => s.accuracy < 70);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
      {/* 1. STRENGTHS */}
      <Card className='rounded-2xl border-border/60 bg-card text-card-foreground p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between'>
        <div>
          <div className='flex items-center gap-2 pb-3 mb-3 border-b border-border/60'>
            <div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
              <Trophy className='w-4 h-4' />
            </div>
            <h3 className='font-bold text-foreground text-base'>Strengths</h3>
          </div>

          <div className='space-y-3.5 pt-1'>
            {strongSections.length > 0 ? (
              strongSections.map((sec, idx) => {
                const acc = Math.round(sec.accuracy || 0);
                const perc = data.percentile ?? Math.min(100, acc);

                return (
                  <div key={idx} className='flex items-start gap-2.5'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-500 shrink-0 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-foreground text-xs'>{sec.sectionName}</h4>
                      <p className='text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5'>
                        High Concept Mastery
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='flex items-start gap-2.5'>
                <CheckCircle2 className='w-4 h-4 text-emerald-500 shrink-0 mt-0.5' />
                <div>
                  <h4 className='font-bold text-foreground text-xs'>General Proficiency</h4>
                  <p className='text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5'>
                    Strong Overall Foundation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 2. NEEDS IMPROVEMENT */}
      <Card className='rounded-2xl border-border/60 bg-card text-card-foreground p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between'>
        <div>
          <div className='flex items-center gap-2 pb-3 mb-3 border-b border-border/60'>
            <div className='p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400'>
              <TrendingDown className='w-4 h-4' />
            </div>
            <h3 className='font-bold text-foreground text-base'>Needs Improvement</h3>
          </div>

          <div className='space-y-3.5 pt-1'>
            {weakSections.length > 0 ? (
              weakSections.map((sec, idx) => {
                const acc = Math.round(sec.accuracy || 0);
                const perc = data.percentile ?? Math.min(100, acc);

                return (
                  <div key={idx} className='flex items-start gap-2.5'>
                    <AlertCircle className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-foreground text-xs'>{sec.sectionName}</h4>
                      <p className='text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5'>
                        Focus Area • Needs Practice
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='flex items-start gap-2.5'>
                <AlertCircle className='w-4 h-4 text-amber-500 shrink-0 mt-0.5' />
                <div>
                  <h4 className='font-bold text-foreground text-xs'>Pacing & Speed</h4>
                  <p className='text-[11px] text-muted-foreground font-medium mt-0.5'>
                    Focus on question response timing to maximize attempt count.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
