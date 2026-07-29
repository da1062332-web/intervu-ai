import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Clock, Clock4, TimerReset, Zap, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardSectionTime: React.FC<Props> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'Good': return 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300';
      case 'Slightly Slow': return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300';
      case 'Needs Improvement': return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/50 dark:text-red-300';
      default: return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Section-wise Time & Pacing Analysis
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Detailed breakdown of duration spent, speed per question, and efficiency per section
          </CardDescription>
        </div>
        {data.timeEfficiency !== undefined && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-indigo-500" />
            {data.timeEfficiency}% Time Efficiency
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-5">
          {data.sectionTime.map((section, idx) => {
            const timeUsedPct = section.timeUsedPercentage ?? (section.expectedTime > 0 ? Math.round((section.spentTime / section.expectedTime) * 100) : 0);
            const progressColor = section.status === 'Needs Improvement' ? 'bg-red-500' : section.status === 'Excellent' ? 'bg-emerald-500' : 'bg-indigo-500';

            return (
              <div key={idx} className="p-4 border rounded-xl bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all space-y-3.5 shadow-2xs">
                {/* Section Header & Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{section.sectionName}</h4>
                    {section.accuracy !== undefined && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${section.accuracy >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : section.accuracy >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                        {section.accuracy}% Accuracy
                      </span>
                    )}
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColor(section.status)}`}>
                    {section.status}
                  </div>
                </div>

                {/* Progress bar of Time Used */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Time Spent: <strong className="text-slate-800 dark:text-slate-200">{section.spentTime}m</strong> of {section.expectedTime}m expected</span>
                    <span>{timeUsedPct}% used</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(100, timeUsedPct)}%` }} />
                  </div>
                </div>

                {/* Metric Chips Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">Spent: <strong className="text-slate-800 dark:text-slate-200">{section.spentTime}m</strong></span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Clock4 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">Expected: <strong className="text-slate-800 dark:text-slate-200">{section.expectedTime}m</strong></span>
                  </div>

                  {section.avgTimePerQuestion && (
                    <div className="bg-slate-50 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2 col-span-2 sm:col-span-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">Avg Speed: <strong className="text-slate-800 dark:text-slate-200">{section.avgTimePerQuestion}/q</strong></span>
                    </div>
                  )}
                </div>

                {/* Detailed Pacing Feedback note */}
                {section.pacingFeedback && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    {section.status === 'Needs Improvement' ? (
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : section.status === 'Excellent' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                    )}
                    <span>{section.pacingFeedback}</span>
                  </div>
                )}
              </div>
            );
          })}

          {data.sectionTime.length === 0 && (
            <div className="text-center text-slate-500 py-6">No time tracking data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
