import { useAssessmentCompletion } from '../../hooks/useAssessmentCompletion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';

export function AssessmentCompletionWidget() {
  const { data, isLoading, isError, refetch } = useAssessmentCompletion();

  if (isLoading) {
    return <WidgetSkeleton className='h-full min-h-[300px]' />;
  }

  if (isError) {
    return (
      <Card className='h-full min-h-[300px] flex items-center justify-center rounded-xl shadow-sm'>
        <EmptyState
          variant='error'
          title='Failed to load completion rate'
          description='There was an error loading the assessment completion rate.'
          actionLabel='Try again'
          onAction={refetch}
        />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className='h-full min-h-[300px] flex items-center justify-center rounded-xl shadow-sm'>
        <EmptyState variant='no-data' title='No completion data available' />
      </Card>
    );
  }

  const { completionRate, completed, pending } = data;
  const radius = 72;
  const cx = 96;
  const cy = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <Card className='h-full flex flex-col shadow-sm rounded-xl'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-base font-semibold'>Assessment Completion</CardTitle>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col items-center justify-center gap-8 pt-6 pb-8'>
        <div className='relative w-48 h-48 flex items-center justify-center'>
          {/* Background Circle */}
          <svg className='w-full h-full transform -rotate-90'>
            <circle
              className='text-muted'
              strokeWidth='14'
              stroke='currentColor'
              fill='transparent'
              r={radius}
              cx={cx}
              cy={cy}
            />
            {/* Progress Circle */}
            <circle
              className='text-primary transition-all duration-1000 ease-in-out'
              strokeWidth='14'
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap='round'
              stroke='currentColor'
              fill='transparent'
              r={radius}
              cx={cx}
              cy={cy}
            />
          </svg>
          {/* Center Text */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-4xl font-bold tracking-tight'>{completionRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className='flex w-full justify-center gap-12 px-4 mt-2'>
          <div className='flex items-center gap-3'>
            <span className='size-3.5 rounded-full bg-emerald-500 shadow-sm'></span>
            <div className='flex flex-col'>
              <span className='text-2xl font-bold text-foreground leading-none'>{completed}</span>
              <span className='text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-1.5'>
                Completed
              </span>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <span className='size-3.5 rounded-full bg-amber-500 shadow-sm'></span>
            <div className='flex flex-col'>
              <span className='text-2xl font-bold text-foreground leading-none'>{pending}</span>
              <span className='text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-1.5'>
                Pending
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
