import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { CheckCircle2, Zap, Target, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  data: PerformanceDashboardResponse;
}

export const DashboardPerformanceSummary: React.FC<Props> = ({ data }) => {
  const { correct, wrong, skipped } = data.accuracyDetails;
  const totalQuestions = correct + wrong + skipped;
  const attemptedQuestions = correct + wrong;
  const completionRate =
    totalQuestions > 0 ? Math.round((attemptedQuestions / totalQuestions) * 100) : 100;

  const totalSecs = (data.totalTimeSpent || 0) * 60;
  const avgSecsPerQ = totalQuestions > 0 ? Math.round(totalSecs / totalQuestions) : 0;
  const formattedAvgSpeed =
    avgSecsPerQ >= 60 ? `${(avgSecsPerQ / 60).toFixed(1)}m` : `${avgSecsPerQ}s`;

  const ratio = wrong > 0 ? (correct / wrong).toFixed(1) : correct > 0 ? `${correct}:0` : '0';

  let executiveInsight =
    'Good overall attempt rate. Review flagged questions to boost overall accuracy.';
  if (completionRate >= 90 && data.overallAccuracy >= 70) {
    executiveInsight =
      'Outstanding performance! High completion rate combined with strong accuracy.';
  } else if (completionRate >= 90 && data.overallAccuracy < 50) {
    executiveInsight =
      '100% attempt rate with fast pacing. Focus on double-checking answers before submitting to reduce errors.';
  } else if (data.overallAccuracy >= 70) {
    executiveInsight =
      'Strong accuracy on attempted questions. Work on speed to complete more questions in future tests.';
  }

  return (
    <Card className='h-full bg-slate-900 text-white border-slate-800 flex flex-col justify-between shadow-md'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-white text-xl font-bold flex items-center gap-2'>
          <Sparkles className='w-5 h-5 text-amber-400' />
          Execution Highlights
        </CardTitle>
        <CardDescription className='text-slate-400 text-xs mt-0.5'>
          Key test execution metrics, pacing efficiency, and accuracy ratio
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 pt-1 flex-1 flex flex-col justify-between'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {/* Completion Rate */}
          <div className='p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5'>
            <div className='flex justify-between items-center text-xs'>
              <span className='text-slate-400 flex items-center gap-1.5 font-medium'>
                <Target className='w-3.5 h-3.5 text-indigo-400' />
                Completion Rate
              </span>
              <span className='text-emerald-400 font-bold text-xs bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50'>
                {completionRate}%
              </span>
            </div>
            <div className='text-lg font-bold text-white'>
              {attemptedQuestions}/{totalQuestions}{' '}
              <span className='text-xs font-normal text-slate-400'>Attempted</span>
            </div>
            <Progress value={completionRate} className='h-1.5 bg-slate-700' />
          </div>

          {/* Average Pace */}
          <div className='p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5'>
            <div className='flex justify-between items-center text-xs'>
              <span className='text-slate-400 flex items-center gap-1.5 font-medium'>
                <Zap className='w-3.5 h-3.5 text-amber-400' />
                Average Pace
              </span>
              <span className='text-amber-400 font-bold text-xs bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/50'>
                Speed
              </span>
            </div>
            <div className='text-lg font-bold text-white'>
              {formattedAvgSpeed}{' '}
              <span className='text-xs font-normal text-slate-400'>/ question</span>
            </div>
            <div className='text-[11px] text-slate-400'>Total {data.totalTimeSpent} mins spent</div>
          </div>
        </div>

        {/* Correct-to-Wrong Ratio */}
        <div className='p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <TrendingUp className='w-4 h-4 text-emerald-400 shrink-0' />
            <div>
              <div className='text-xs text-slate-400 font-medium'>Correct-to-Wrong Ratio</div>
              <div className='text-xs text-slate-500'>
                {correct} correct vs {wrong} wrong
              </div>
            </div>
          </div>
          <div className='text-base font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-lg'>
            {ratio} : 1
          </div>
        </div>

        {/* Executive Takeaway */}
        <div className='p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/60 text-xs text-indigo-200 flex items-start gap-2.5'>
          <Sparkles className='w-4 h-4 text-indigo-400 shrink-0 mt-0.5' />
          <p className='leading-snug'>{executiveInsight}</p>
        </div>
      </CardContent>
    </Card>
  );
};
