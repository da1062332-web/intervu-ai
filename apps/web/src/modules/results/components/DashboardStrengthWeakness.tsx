import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { CheckCircle2, AlertTriangle, XCircle, Award, Target, TrendingUp, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  data: PerformanceDashboardResponse;
}

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const DashboardStrengthWeakness: React.FC<Props> = ({ data }) => {
  const sectionNames = new Set(data.sectionAccuracy.map(s => s.sectionName));

  const detailed = (data.detailedStrengthsWeaknesses || []).filter(
    d => sectionNames.has(d.name) && !isUUID(d.name)
  );

  // Build items by category
  const strengthItems = detailed.filter(d => d.category === 'STRENGTH');
  const needsImprovementItems = detailed.filter(d => d.category === 'NEEDS_IMPROVEMENT');
  const weaknessItems = detailed.filter(d => d.category === 'WEAKNESS');

  // Fallbacks if detailed list not present
  const simpleStrengths = data.strengths.filter(s => sectionNames.has(s) && !isUUID(s));
  const simpleWeaknesses = data.weaknesses.filter(w => sectionNames.has(w) && !isUUID(w));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-500" />
          Detailed Strengths & Weaknesses Analysis
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Categorized assessment of your section performance, accuracy scores, and specific improvement focus areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 💪 STRENGTHS COLUMN */}
          <div className="border rounded-xl p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200/60 dark:border-emerald-900/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">Key Strengths</h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                  {strengthItems.length || simpleStrengths.length} Areas
                </span>
              </div>

              {strengthItems.length > 0 ? (
                <div className="space-y-3">
                  {strengthItems.map((item, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900/50 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.name}</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          {item.score}% Acc
                        </span>
                      </div>
                      <Progress value={item.score} className="h-1.5 bg-emerald-100 dark:bg-emerald-950" />
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{item.feedback}</p>
                    </div>
                  ))}
                </div>
              ) : simpleStrengths.length > 0 ? (
                <ul className="space-y-2">
                  {simpleStrengths.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 text-xs font-medium text-emerald-900 dark:text-emerald-200">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-600/80 italic p-3 text-center">Keep practicing to build your core strengths.</p>
              )}
            </div>
          </div>

          {/* ⚠️ NEEDS IMPROVEMENT COLUMN */}
          <div className="border rounded-xl p-4 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200/60 dark:border-amber-900/60">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-600 dark:text-amber-400 w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-amber-900 dark:text-amber-200 text-base">Needs Improvement</h3>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                  {needsImprovementItems.length} Areas
                </span>
              </div>

              {needsImprovementItems.length > 0 ? (
                <div className="space-y-3">
                  {needsImprovementItems.map((item, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.name}</span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          {item.score}% Acc
                        </span>
                      </div>
                      <Progress value={item.score} className="h-1.5 bg-amber-100 dark:bg-amber-950" />
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{item.feedback}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-600/80 italic p-3 text-center">No moderate areas detected.</p>
              )}
            </div>
          </div>

          {/* ❌ WEAK AREAS COLUMN */}
          <div className="border rounded-xl p-4 bg-red-50/40 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-200/60 dark:border-red-900/60">
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-600 dark:text-red-400 w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-red-900 dark:text-red-200 text-base">Weak Areas</h3>
                </div>
                <span className="text-xs font-bold text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded-full">
                  {weaknessItems.length || simpleWeaknesses.length} Areas
                </span>
              </div>

              {weaknessItems.length > 0 ? (
                <div className="space-y-3">
                  {weaknessItems.map((item, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-red-100 dark:border-red-900/50 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.name}</span>
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                          {item.score}% Acc
                        </span>
                      </div>
                      <Progress value={item.score} className="h-1.5 bg-red-100 dark:bg-red-950" />
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{item.feedback}</p>
                    </div>
                  ))}
                </div>
              ) : simpleWeaknesses.length > 0 ? (
                <ul className="space-y-2">
                  {simpleWeaknesses.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-red-100 text-xs font-medium text-red-900 dark:text-red-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-600/80 italic p-3 text-center">Great job! No major weak areas found.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
