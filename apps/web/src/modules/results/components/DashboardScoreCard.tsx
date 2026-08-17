import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PerformanceDashboardResponse } from '../types/results.types';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, Target, TrendingUp } from 'lucide-react';

interface Props {
  data: PerformanceDashboardResponse;
  resultDetails?: any;
}

export const DashboardScoreCard: React.FC<Props> = ({ data, resultDetails }) => {
  const score = data.overallScore ?? resultDetails?.score ?? 0;
  const maxMarks = data.maxMarks ?? resultDetails?.maxMarks ?? (score > 0 ? 100 : 0);
  const percentage =
    maxMarks > 0
      ? Math.round((score / maxMarks) * 1000) / 10
      : data.percentage !== undefined && data.percentage !== null
        ? Math.round(data.percentage * 10) / 10
        : 0;

  const percentile =
    data.percentile ?? resultDetails?.percentile ?? 100;
  const rank = data.rank ?? resultDetails?.rank ?? 1;
  const totalCandidates = data.totalCandidates ?? resultDetails?.totalCandidates ?? 1;

  const totalSeconds =
    (data as any).totalTimeSpentSeconds ??
    (data.totalTimeSpent ? data.totalTimeSpent * 60 : 0);
  const minutesSpent = Math.floor(totalSeconds / 60);
  const secondsSpent = totalSeconds % 60;
  const hoursSpent = Math.floor(minutesSpent / 60);
  const remMinutes = minutesSpent % 60;

  const formattedTimeTaken =
    hoursSpent > 0
      ? `${hoursSpent}h ${remMinutes}m`
      : minutesSpent > 0
        ? secondsSpent > 0
          ? `${minutesSpent}m ${secondsSpent}s`
          : `${minutesSpent}m`
        : totalSeconds > 0
          ? `${secondsSpent}s`
          : '< 1m';

  // Calculate total allowed duration dynamically from section time expectations or assessment config
  const totalAllowedMinutes = (data.sectionTime || []).reduce(
    (sum, sec) => sum + (sec.expectedTime || 0),
    0,
  );
  const allowedHours = Math.floor(totalAllowedMinutes / 60);
  const allowedRemMinutes = totalAllowedMinutes % 60;
  const formattedTotalAllowed =
    totalAllowedMinutes > 0
      ? allowedHours > 0
        ? `${allowedHours}h ${allowedRemMinutes}m`
        : `${allowedRemMinutes}m`
      : resultDetails?.testConfig?.durationSeconds
        ? `${Math.round(resultDetails.testConfig.durationSeconds / 60)}m`
        : 'N/A';

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      {/* 1. Overall Score Card */}
      <Card className='rounded-2xl border-border/60 bg-gradient-to-b from-card to-card/95 text-card-foreground p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between'>
        <CardContent className='p-0 space-y-3.5'>
          <div className='flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider'>
            <span>Overall Score</span>
            <div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
              <Trophy className='w-4 h-4' />
            </div>
          </div>
          <div>
            <div className='flex items-baseline gap-1.5'>
              <span className='text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight'>
                {score}
              </span>
              <span className='text-base font-semibold text-muted-foreground'>/ {maxMarks}</span>
            </div>
          </div>
          <div className='space-y-1.5 pt-1'>
            <Progress value={Math.min(100, Math.max(0, percentage))} className='h-2 bg-muted/80' />
            <div className='flex justify-between text-xs font-semibold text-muted-foreground'>
              <span>Score Ratio</span>
              <span className='font-extrabold text-foreground'>{percentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Percentile Card */}
      <Card className='rounded-2xl border-border/60 bg-gradient-to-b from-card to-card/95 text-card-foreground p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between'>
        <CardContent className='p-0 space-y-3.5'>
          <div className='flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider'>
            <span>Percentile</span>
            <div className='p-2 rounded-xl bg-primary/10 text-primary'>
              <TrendingUp className='w-4 h-4' />
            </div>
          </div>
          <div>
            <span className='text-3xl font-extrabold text-primary tracking-tight'>
              {percentile}%
            </span>
          </div>
          <p className='text-xs text-muted-foreground leading-relaxed font-medium pt-1'>
            You performed better than{' '}
            <strong className='text-foreground font-bold'>{percentile}%</strong> of peer test takers
          </p>
        </CardContent>
      </Card>

      {/* 3. Rank Card */}
      <Card className='rounded-2xl border-border/60 bg-gradient-to-b from-card to-card/95 text-card-foreground p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between'>
        <CardContent className='p-0 space-y-3.5'>
          <div className='flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider'>
            <span>Cohort Rank</span>
            <div className='p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400'>
              <Target className='w-4 h-4' />
            </div>
          </div>
          <div>
            <div className='flex items-baseline gap-1.5'>
              <span className='text-3xl font-extrabold text-foreground tracking-tight'>
                #{rank}
              </span>
              <span className='text-sm font-semibold text-muted-foreground'>
                of {totalCandidates.toLocaleString()}
              </span>
            </div>
          </div>
          <p className='text-xs text-muted-foreground font-medium pt-1'>
            Total Cohort Size:{' '}
            <strong className='text-foreground font-bold'>
              {totalCandidates.toLocaleString()}{' '}
              {totalCandidates === 1 ? 'candidate' : 'candidates'}
            </strong>
          </p>
        </CardContent>
      </Card>

      {/* 4. Time Taken Card */}
      <Card className='rounded-2xl border-border/60 bg-gradient-to-b from-card to-card/95 text-card-foreground p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between'>
        <CardContent className='p-0 space-y-3.5'>
          <div className='flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider'>
            <span>Time Taken</span>
            <div className='p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400'>
              <Clock className='w-4 h-4' />
            </div>
          </div>
          <div>
            <span className='text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight'>
              {formattedTimeTaken}
            </span>
          </div>
          <p className='text-xs text-muted-foreground font-medium pt-1'>
            Total Allowed Duration:{' '}
            <strong className='text-foreground font-bold'>{formattedTotalAllowed}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
