import { AttemptHistory } from '@/features/candidate/dashboard/types/candidateDashboard.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Trophy } from 'lucide-react';

interface AttemptHistoryCardProps {
  history: AttemptHistory[];
}

export function AttemptHistoryCard({ history }: AttemptHistoryCardProps) {
  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <CardTitle>Previous Attempts</CardTitle>
        <CardDescription>Your latest assessment results</CardDescription>
      </CardHeader>
      <CardContent className='flex-1'>
        {history.length === 0 ? (
          <div className='flex flex-col items-center justify-center text-muted-foreground p-6 text-center h-full'>
            <Trophy className='size-8 opacity-50 mb-3' />
            <p className='font-medium'>No previous attempts</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {history.slice(0, 5).map((attempt) => {
              const resultId = (attempt as any).instanceId || attempt.id;
              const configId = (attempt as any).testId || (attempt as any).configId;
              return (
                <div
                  key={attempt.id}
                  className='flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors gap-2'
                >
                  <div className='space-y-1 min-w-0 flex-1'>
                    <p className='font-bold text-sm leading-none truncate'>{attempt.assessmentName}</p>
                    <div className='flex items-center text-xs text-muted-foreground gap-2 mt-1'>
                      <span className='flex items-center gap-1'>
                        <CalendarDays className='size-3' />
                        {new Intl.DateTimeFormat('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(attempt.completedDate))}
                      </span>
                      <span>•</span>
                      <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>
                        {attempt.status}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 shrink-0 self-end sm:self-center'>
                    <Badge variant='secondary' className='text-xs font-bold'>
                      {attempt.score}/100
                    </Badge>
                    {resultId && (
                      <a
                        href={`/candidate/results/${resultId}`}
                        className='text-xs font-bold text-indigo-600 hover:underline px-2 py-0.5'
                      >
                        Result
                      </a>
                    )}
                    {configId && (
                      <a
                        href={`/candidate/tests/${configId}`}
                        className='text-xs font-bold text-emerald-600 hover:underline px-2 py-0.5'
                      >
                        Re-Exam
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
