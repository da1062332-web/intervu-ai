import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Calculator, Brain, BookOpen, Code2, ArrowRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  data: PerformanceDashboardResponse;
  attemptId?: string;
}

export const DashboardSectionAccuracy: React.FC<Props> = ({ data, attemptId }) => {
  const getSectionIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('numerical') || lower.includes('quant') || lower.includes('math')) {
      return <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><Calculator className="w-4 h-4" /></div>;
    }
    if (lower.includes('reasoning') || lower.includes('logic')) {
      return <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Brain className="w-4 h-4" /></div>;
    }
    if (lower.includes('verbal') || lower.includes('english')) {
      return <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><BookOpen className="w-4 h-4" /></div>;
    }
    return <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400"><Code2 className="w-4 h-4" /></div>;
  };

  const getStatusBadge = (acc: number) => {
    if (acc >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Excellent
        </span>
      );
    }
    if (acc >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
          <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          Good
        </span>
      );
    }
    if (acc >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Average
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
        <XCircle className="w-3 h-3 text-destructive" />
        Not Cleared
      </span>
    );
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xs overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-6 border-b border-border/60">
        <CardTitle className="text-lg font-bold text-foreground">
          Section Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-6">Section</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Accuracy</th>

                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.sectionAccuracy.map((sec, idx) => {
                const acc = Math.round(sec.accuracy || 0);
                const totalQ = sec.questionCount || (sec.correct + sec.wrong + sec.skipped) || 1;
                const percentile = data.percentile ?? Math.min(100, acc);

                return (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-foreground flex items-center gap-3">
                      {getSectionIcon(sec.sectionName)}
                      <span>{sec.sectionName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={sec.correct > 0 ? 'text-foreground' : 'text-destructive'}>
                        {sec.correct}
                      </span>
                      <span className="text-muted-foreground font-normal"> / {totalQ}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={acc >= 70 ? 'text-emerald-600 dark:text-emerald-400' : acc >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'}>
                        {acc}%
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      {getStatusBadge(acc)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  );
};
