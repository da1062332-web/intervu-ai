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
  const score = data.overallScore || resultDetails?.score || 492;
  const maxMarks = data.maxMarks || resultDetails?.maxMarks || 1000;
  const percentage = data.percentage !== undefined ? Math.round(data.percentage * 10) / 10 : Math.round((score / maxMarks) * 100);
  
  const percentile = data.percentile ?? resultDetails?.percentile ?? Math.min(100, Math.round(percentage * 10) / 10);
  const rank = data.rank ?? resultDetails?.rank ?? 1;
  const totalCandidates = data.totalCandidates ?? resultDetails?.totalCandidates ?? 1;
  
  const minutesSpent = data.totalTimeSpent || 79;
  const hoursSpent = Math.floor(minutesSpent / 60);
  const remMinutes = minutesSpent % 60;
  const formattedTimeTaken = hoursSpent > 0 ? `${hoursSpent}h ${remMinutes}m` : `${minutesSpent}m`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Score Card */}
      <Card className="rounded-2xl border-border/60 bg-card text-card-foreground p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <CardContent className="p-0 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Overall Score</span>
            <Trophy className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{score}</span>
              <span className="text-base font-semibold text-muted-foreground">/ {maxMarks}</span>
            </div>
          </div>
          <div className="space-y-1 pt-1">
            <Progress value={percentage} className="h-2 bg-muted" />
            <div className="flex justify-between text-xs font-semibold text-muted-foreground pt-0.5">
              <span>{percentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Percentile Card */}
      <Card className="rounded-2xl border-border/60 bg-card text-card-foreground p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <CardContent className="p-0 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Percentile</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-primary">{percentile}%</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            You performed better than <strong className="text-foreground font-bold">{percentile}%</strong> of candidates
          </p>
        </CardContent>
      </Card>

      {/* 3. Rank Card */}
      <Card className="rounded-2xl border-border/60 bg-card text-card-foreground p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <CardContent className="p-0 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Rank</span>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-foreground">{rank}</span>
              <span className="text-sm font-semibold text-muted-foreground">/ {totalCandidates.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Total Candidates <strong className="text-foreground font-bold">{totalCandidates.toLocaleString()}</strong>
          </p>
        </CardContent>
      </Card>

      {/* 4. Time Taken Card */}
      <Card className="rounded-2xl border-border/60 bg-card text-card-foreground p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <CardContent className="p-0 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Time Taken</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{formattedTimeTaken}</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Total Allowed <strong className="text-foreground font-bold">2h 00m</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
