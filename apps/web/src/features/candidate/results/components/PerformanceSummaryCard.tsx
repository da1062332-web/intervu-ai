import { PerformanceSummary } from '../types/results.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, History, TrendingUp, Award } from 'lucide-react';

interface PerformanceSummaryCardProps {
  summary: PerformanceSummary;
}

export function PerformanceSummaryCard({ summary }: PerformanceSummaryCardProps) {
  if (!summary) return null;

  const formattedDate = new Date(summary.lastAssessmentDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-muted-foreground" />
          Historical Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center text-center">
            <History className="w-5 h-5 text-muted-foreground mb-2" />
            <span className="text-2xl font-bold">{summary.testsCompleted}</span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Tests Completed</span>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center text-center">
            <TrendingUp className="w-5 h-5 text-primary mb-2" />
            <span className="text-2xl font-bold text-primary">{summary.averageScore}%</span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Average Score</span>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center text-center">
            <Award className="w-5 h-5 text-amber-500 mb-2" />
            <span className="text-2xl font-bold text-amber-500">{summary.bestScore}%</span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Best Score</span>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center text-center justify-center">
            <span className="text-sm font-semibold">{formattedDate}</span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Last Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
