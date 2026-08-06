import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Clock, Clock4, Zap, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardSectionTime: React.FC<Props> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-300';
      case 'Good':
        return 'text-blue-700 bg-blue-500/10 border-blue-500/20 dark:text-blue-300';
      case 'Slightly Slow':
        return 'text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-300';
      case 'Needs Improvement':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted border-border/80';
    }
  };

  return (
    <Card className='rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xs overflow-hidden h-auto'>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 pt-5 px-6 border-b border-border/60'>
        <div>
          <CardTitle className='text-base font-extrabold flex items-center gap-2 tracking-tight'>
            <Clock className='w-4 h-4 text-indigo-500 shrink-0' />
            <span>Section-wise Time & Pacing Analysis</span>
          </CardTitle>
          <CardDescription className='text-xs text-muted-foreground mt-1'>
            Detailed breakdown of duration spent, average speed per question, and overall efficiency
          </CardDescription>
        </div>
        {data.timeEfficiency !== undefined && data.timeEfficiency !== null && (
          <div className='bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-2xs'>
            <Zap className='w-3.5 h-3.5 text-indigo-500' />
            <span>{data.timeEfficiency}% Time Efficiency</span>
          </div>
        )}
      </CardHeader>
      <CardContent className='p-6'>
        <div className='grid grid-cols-1 gap-5'>
          {(data.sectionTime || []).map((section, idx) => {
            const timeUsedPct =
              section.timeUsedPercentage ??
              (section.expectedTime > 0
                ? Math.round((section.spentTime / section.expectedTime) * 100)
                : 0);
            const progressColor =
              section.status === 'Needs Improvement'
                ? 'bg-destructive'
                : section.status === 'Excellent'
                ? 'bg-emerald-500'
                : 'bg-indigo-500';

            return (
              <div
                key={idx}
                className='p-5 border border-border/60 rounded-xl bg-card hover:bg-muted/30 transition-all space-y-4 shadow-2xs'
              >
                {/* Section Header & Status */}
                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'>
                  <div className='flex items-center gap-2.5 flex-wrap'>
                    <h4 className='font-bold text-foreground text-base'>{section.sectionName}</h4>
                    {section.accuracy !== undefined && (
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                          section.accuracy >= 70
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                            : section.accuracy >= 50
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}
                      >
                        {Math.round(section.accuracy)}% Accuracy
                      </span>
                    )}
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border whitespace-nowrap ${getStatusColor(
                      section.status,
                    )}`}
                  >
                    {section.status}
                  </div>
                </div>

                {/* Progress bar of Time Used */}
                <div className='space-y-2'>
                  <div className='flex justify-between text-xs font-semibold text-muted-foreground'>
                    <span>
                      Time Spent:{' '}
                      <strong className='text-foreground font-extrabold'>
                        {section.spentTime}m
                      </strong>{' '}
                      of {section.expectedTime}m expected
                    </span>
                    <span className='font-bold text-foreground'>{timeUsedPct}% used</span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2.5 overflow-hidden'>
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ease-out ${progressColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, timeUsedPct))}%` }}
                    />
                  </div>
                </div>

                {/* Metric Chips Grid */}
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs'>
                  <div className='bg-muted/40 p-2.5 rounded-xl border border-border/60 flex items-center gap-2'>
                    <Clock className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                    <span className='text-muted-foreground font-medium'>
                      Spent: <strong className='text-foreground font-bold'>{section.spentTime}m</strong>
                    </span>
                  </div>

                  <div className='bg-muted/40 p-2.5 rounded-xl border border-border/60 flex items-center gap-2'>
                    <Clock4 className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                    <span className='text-muted-foreground font-medium'>
                      Expected:{' '}
                      <strong className='text-foreground font-bold'>{section.expectedTime}m</strong>
                    </span>
                  </div>

                  {section.avgTimePerQuestion && (
                    <div className='bg-muted/40 p-2.5 rounded-xl border border-border/60 flex items-center gap-2 col-span-2 sm:col-span-1'>
                      <Zap className='w-3.5 h-3.5 text-amber-500 shrink-0' />
                      <span className='text-muted-foreground font-medium'>
                        Avg Speed:{' '}
                        <strong className='text-foreground font-bold'>
                          {section.avgTimePerQuestion}/q
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed Pacing Feedback note */}
                {section.pacingFeedback && (
                  <div className='flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground font-medium'>
                    {section.status === 'Needs Improvement' ? (
                      <AlertCircle className='w-4 h-4 text-destructive shrink-0' />
                    ) : section.status === 'Excellent' ? (
                      <CheckCircle2 className='w-4 h-4 text-emerald-500 shrink-0' />
                    ) : (
                      <Target className='w-4 h-4 text-indigo-500 shrink-0' />
                    )}
                    <span>{section.pacingFeedback}</span>
                  </div>
                )}
              </div>
            );
          })}

          {(!data.sectionTime || data.sectionTime.length === 0) && (
            <div className='text-center text-muted-foreground text-sm py-8'>
              No time tracking data available for this attempt.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
