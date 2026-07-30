import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Progress } from '@/components/ui/progress';
import { Target, Sparkles, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
}

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const DashboardSectionAccuracy: React.FC<Props> = ({ data }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Section & Topic Accuracy Breakdown
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Comprehensive accuracy statistics per section and sub-topic
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.sectionAccuracy.map((section, idx) => {
            // Find topics belonging to this section
            const sectionTopics = (section.topics || (data.topicAccuracy || []).filter(
              t => t.sectionName === section.sectionName
            )).filter(t => !isUUID(t.topicName));

            return (
              <div key={idx} className="p-4 border rounded-xl bg-card space-y-3.5 shadow-2xs">
                {/* Section Header */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{section.sectionName}</span>
                  <span className={`text-base font-extrabold px-2.5 py-0.5 rounded-full ${section.accuracy >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : section.accuracy >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                    {Math.round(section.accuracy)}%
                  </span>
                </div>
                
                <Progress value={section.accuracy} className="h-2.5" />
                
                <div className="flex justify-between text-xs text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><strong className="text-emerald-600 dark:text-emerald-400 font-bold">{section.correct}</strong> Correct</span>
                  <span className="flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5 text-slate-400" /><strong className="text-slate-500 font-bold">{section.skipped || 0}</strong> Skipped</span>
                  <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /><strong className="text-red-600 dark:text-red-400 font-bold">{section.wrong}</strong> Wrong</span>
                </div>

                {/* Topic Breakdown nested section */}
                {sectionTopics.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Topic-level Accuracy</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {sectionTopics.map((topic, tIdx) => (
                        <div key={tIdx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{topic.topicName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">{topic.correct}/{topic.total} correct</span>
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${topic.accuracy >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : topic.accuracy >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                                {topic.accuracy}%
                              </span>
                            </div>
                          </div>
                          <Progress value={topic.accuracy} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {data.sectionAccuracy.length === 0 && (
            <div className="text-center text-slate-500 py-6">No section data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
