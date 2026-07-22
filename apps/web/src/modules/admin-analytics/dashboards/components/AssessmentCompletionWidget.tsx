import { useAssessmentCompletion } from '../../hooks/useAssessmentCompletion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';

export function AssessmentCompletionWidget() {
  const { data, isLoading, isError, refetch } = useAssessmentCompletion();

  if (isLoading) {
    return (
      <Card className="h-full min-h-[300px] flex items-center justify-center rounded-xl shadow-sm">
        <AnimatedLoader variant="section" className="border-none bg-transparent" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full min-h-[300px] flex items-center justify-center rounded-xl shadow-sm">
        <EmptyState
          variant="error"
          title="Failed to load completion rate"
          description="There was an error loading the assessment completion rate."
          actionLabel="Try again"
          onAction={refetch}
        />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-full min-h-[300px] flex items-center justify-center rounded-xl shadow-sm">
        <EmptyState variant="no-data" title="No completion data available" />
      </Card>
    );
  }

  const { completionRate, completed, pending } = data;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <Card className="h-full flex flex-col shadow-sm rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Assessment Completion</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center gap-6 pt-2 pb-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-muted"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="64"
              cy="64"
            />
            {/* Progress Circle */}
            <circle
              className="text-primary transition-all duration-1000 ease-in-out"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="64"
              cy="64"
            />
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{completionRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex w-full justify-center gap-8 px-4 mt-2">
          <div className="flex items-center gap-3">
            <span className="size-3 rounded-full bg-emerald-500 shadow-sm"></span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground leading-none">{completed}</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Completed</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="size-3 rounded-full bg-amber-500 shadow-sm"></span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground leading-none">{pending}</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Pending</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
