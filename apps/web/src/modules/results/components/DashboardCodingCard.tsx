import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Code2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  data: PerformanceDashboardResponse;
  attemptId?: string;
}

export const DashboardCodingCard: React.FC<Props> = ({ data, attemptId }) => {
  const codingSection = data.sectionAccuracy?.find(s => 
    s.sectionName.toLowerCase().includes('coding') || 
    s.sectionName.toLowerCase().includes('programming')
  );

  const hasCoding = Boolean(
    codingSection || 
    (data.codingMaxMarks !== undefined && data.codingMaxMarks > 0) ||
    (data as any).hasCodingSection
  );

  if (!hasCoding) return null;

  const score = data.codingScore ?? (codingSection ? Math.round(codingSection.accuracy) : 0);
  const maxMarks = data.codingMaxMarks || 100;
  const accuracy = codingSection ? Math.round(codingSection.accuracy) : Math.round((score / Math.max(1, maxMarks)) * 100);

  const totalCases = codingSection ? (codingSection.questionCount || (codingSection.correct + codingSection.wrong + (codingSection.skipped || 0)) || 10) : 10;
  const passedCases = codingSection ? codingSection.correct : Math.round((accuracy / 100) * totalCases);
  const failedCases = Math.max(0, totalCases - passedCases);

  const performanceRating = accuracy >= 80 ? 'Excellent' : accuracy >= 50 ? 'Average' : 'Needs Improvement';

  return (
    <Card className="rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xs overflow-hidden h-auto">
      <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Code2 className="w-4 h-4" />
          </div>
          <span>Coding Evaluation</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* 1. Circular Score Ring */}
          <div className="flex flex-col items-center justify-center p-4 border-r-0 lg:border-r border-border/60">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500 stroke-current"
                  strokeDasharray={`${accuracy}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-foreground">{score}</span>
                <span className="text-xs text-muted-foreground font-semibold">/{maxMarks}</span>
              </div>
            </div>
          </div>

          {/* 2. Key Metrics Table */}
          <div className="space-y-3 border-r-0 lg:border-r border-border/60 pr-0 lg:pr-6">
            <p className="text-xs font-semibold text-muted-foreground">Your performance in coding section</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground font-medium">Test Cases Passed</span>
                <span className="font-bold text-foreground">{passedCases} / {totalCases}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground font-medium">Correctness</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{accuracy}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground font-medium">Performance</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{performanceRating}</span>
              </div>
            </div>
          </div>

          {/* 3. Test Case Summary Box & Action Button */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Test Case Summary</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Passed
                </span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">{passedCases}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <span className="flex items-center gap-2 text-xs font-bold text-destructive">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Failed
                </span>
                <span className="text-base font-extrabold text-destructive">{failedCases}</span>
              </div>
            </div>


          </div>
        </div>
      </CardContent>
    </Card>
  );
};
