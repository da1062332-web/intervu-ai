import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Code2, Terminal, CheckCircle2, AlertCircle, Sparkles, XCircle, FileCode, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardCodingCard: React.FC<Props> = ({ data }) => {
  // Find the coding section if present
  const codingSection = data.sectionAccuracy.find(s => 
    s.sectionName.toLowerCase().includes('coding') || 
    s.sectionName.toLowerCase().includes('programming')
  );

  // If no coding score and no coding section, don't render
  if (data.codingScore === undefined && !codingSection) return null;

  const score = data.codingScore ?? (codingSection ? Math.round(codingSection.accuracy) : 0);
  const maxMarks = data.codingMaxMarks || 100;
  const accuracy = codingSection ? Math.round(codingSection.accuracy) : Math.round(data.overallAccuracy);

  const isPassed = accuracy >= 50 || score > 0;

  let feedbackNote = "Code submissions evaluated for syntax, logic, and test cases.";
  if (accuracy === 0) {
    feedbackNote = "0 test cases passed in the coding section. Ensure function signatures, input handling, and return values match exact problem requirements.";
  } else if (accuracy >= 80) {
    feedbackNote = "Exceptional coding performance! Code passed functional test cases with optimal execution.";
  } else {
    feedbackNote = "Code compiled and passed core test cases. Double-check edge cases and constraint handling to maximize score.";
  }

  return (
    <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 overflow-hidden relative">
      <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none text-indigo-500">
        <Code2 className="size-48" />
      </div>

      <CardHeader className="pb-3 border-b border-indigo-100/60 dark:border-indigo-900/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg">
            <Terminal className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Coding Evaluation Summary</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Automated AI evaluation of code compilation, test cases, and functional correctness
            </CardDescription>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shrink-0 ${isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300'}`}>
          {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {isPassed ? 'Evaluation Completed' : 'Action Required'}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Score & Progress */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-500" />
                Technical Score & Accuracy
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-extrabold ${score > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {score}
                </span>
                <span className="text-xl font-semibold text-slate-400">/ {maxMarks} pts</span>
              </div>
            </div>

            {codingSection && (
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Coding Section Accuracy</span>
                  <span className={`font-bold ${codingSection.accuracy >= 70 ? 'text-emerald-600' : codingSection.accuracy >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {Math.round(codingSection.accuracy)}%
                  </span>
                </div>
                <Progress value={codingSection.accuracy} className="h-2" />
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><strong className="text-slate-700 dark:text-slate-300 font-semibold">{codingSection.correct}</strong> Passed</span>
                  <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /><strong className="text-slate-700 dark:text-slate-300 font-semibold">{codingSection.wrong}</strong> Failed</span>
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Criteria & AI Feedback */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 border border-slate-800 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Automated Evaluation Criteria
              </h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/80">
                  <span className="text-slate-300">Functional Correctness</span>
                  <span className={`font-bold ${accuracy > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{accuracy}%</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/80">
                  <span className="text-slate-300">Test Case Suite</span>
                  <span className={`font-bold ${codingSection && codingSection.correct > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {codingSection ? `${codingSection.correct}/${codingSection.correct + codingSection.wrong} Passed` : 'Evaluated'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/80">
                  <span className="text-slate-300">Compilation & Constraints</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* AI Feedback note */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{feedbackNote}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
