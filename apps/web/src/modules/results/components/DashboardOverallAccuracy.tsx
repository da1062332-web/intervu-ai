import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { RadarChart } from './RadarChart';
import { Calculator, Brain, BookOpen, Code2 } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardOverallAccuracy: React.FC<Props> = ({ data }) => {
  const radarData: Record<string, number> = {};
  (data.sectionAccuracy || []).forEach((sec) => {
    radarData[sec.sectionName] = Math.round(sec.accuracy || 0);
  });

  const getSectionIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('numerical') || lower.includes('quant') || lower.includes('math')) {
      return (
        <div className='p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0'>
          <Calculator className='w-4 h-4' />
        </div>
      );
    }
    if (lower.includes('reasoning') || lower.includes('logic')) {
      return (
        <div className='p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
          <Brain className='w-4 h-4' />
        </div>
      );
    }
    if (lower.includes('verbal') || lower.includes('english')) {
      return (
        <div className='p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0'>
          <BookOpen className='w-4 h-4' />
        </div>
      );
    }
    return (
      <div className='p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0'>
        <Code2 className='w-4 h-4' />
      </div>
    );
  };

  const getProgressColor = (acc: number) => {
    if (acc >= 75) return 'bg-emerald-500';
    if (acc >= 50) return 'bg-primary';
    return 'bg-amber-500';
  };

  return (
    <Card className='rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xs overflow-hidden h-auto'>
      <CardHeader className='pb-3.5 pt-5 px-6 border-b border-border/60'>
        <CardTitle className='text-base font-extrabold text-foreground tracking-tight flex items-center gap-2'>
          <span>Performance & Accuracy Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 items-center'>
          {/* Left Column: Radar Chart */}
          <div className='flex justify-center items-center py-2 bg-muted/20 rounded-2xl border border-border/40 p-4'>
            <RadarChart data={radarData} />
          </div>

          {/* Right Column: Section Accuracy Bars */}
          <div className='space-y-5 py-1'>
            {(data.sectionAccuracy || []).map((sec, idx) => {
              const matchedSecTime = (data.sectionTime || []).find(
                (st) => st.sectionName.toLowerCase() === sec.sectionName.toLowerCase(),
              );
              const totalQ =
                sec.questionCount ??
                matchedSecTime?.questionCount ??
                sec.correct + sec.wrong + (sec.skipped || 0);

              const acc =
                totalQ > 0
                  ? Math.round((sec.correct / totalQ) * 100)
                  : Math.round(sec.accuracy || 0);

              return (
                <div key={idx} className='space-y-2'>
                  <div className='flex justify-between items-center text-xs font-semibold'>
                    <div className='flex items-center gap-2.5'>
                      {getSectionIcon(sec.sectionName)}
                      <span className='text-foreground font-bold text-sm'>{sec.sectionName}</span>
                    </div>
                    <div className='text-right'>
                      <span className='font-extrabold text-foreground text-sm'>{sec.correct}</span>
                      <span className='text-muted-foreground font-medium'>
                        {' '}
                        / {totalQ} correct ({acc}%)
                      </span>
                    </div>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2.5 overflow-hidden'>
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ease-out ${getProgressColor(
                        acc,
                      )}`}
                      style={{ width: `${Math.min(100, Math.max(0, acc))}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {(!data.sectionAccuracy || data.sectionAccuracy.length === 0) && (
              <div className='text-center text-muted-foreground text-sm py-8'>
                No section-wise accuracy breakdown available.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
