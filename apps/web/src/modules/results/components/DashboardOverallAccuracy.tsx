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
  data.sectionAccuracy.forEach((sec) => {
    radarData[sec.sectionName] = Math.round(sec.accuracy || 0);
  });

  const getSectionIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('numerical') || lower.includes('quant') || lower.includes('math')) {
      return (
        <div className='p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'>
          <Calculator className='w-3.5 h-3.5' />
        </div>
      );
    }
    if (lower.includes('reasoning') || lower.includes('logic')) {
      return (
        <div className='p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
          <Brain className='w-3.5 h-3.5' />
        </div>
      );
    }
    if (lower.includes('verbal') || lower.includes('english')) {
      return (
        <div className='p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400'>
          <BookOpen className='w-3.5 h-3.5' />
        </div>
      );
    }
    return (
      <div className='p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400'>
        <Code2 className='w-3.5 h-3.5' />
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
      <CardHeader className='pb-3 pt-4 px-5 border-b border-border/60'>
        <CardTitle className='text-base font-bold text-foreground'>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent className='p-5'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-center'>
          {/* Left Column: Compact Radar Chart */}
          <div className='flex justify-center items-center py-1'>
            <RadarChart data={radarData} />
          </div>

          {/* Right Column: Dynamic Horizontal Progress Bars */}
          <div className='space-y-4 py-1'>
            {data.sectionAccuracy.map((sec, idx) => {
              const acc = Math.round(sec.accuracy || 0);
              const totalQ = sec.questionCount || sec.correct + sec.wrong + sec.skipped || 1;

              return (
                <div key={idx} className='space-y-1.5'>
                  <div className='flex justify-between items-center text-xs font-semibold'>
                    <div className='flex items-center gap-2'>
                      {getSectionIcon(sec.sectionName)}
                      <span className='text-foreground'>{sec.sectionName}</span>
                    </div>
                    <span className='font-bold text-foreground'>
                      {sec.correct} / {totalQ}
                    </span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(acc)}`}
                      style={{ width: `${Math.min(100, acc)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
