import { AttemptHistory } from '../types/candidateDashboard.types';
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
            {history.slice(0, 5).map((attempt) => (
              <div 
                key={attempt.id} 
                className='flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors'
              >
                <div className='space-y-1'>
                  <p className='font-medium text-sm leading-none'>{attempt.assessmentName}</p>
                  <div className='flex items-center text-xs text-muted-foreground gap-2 mt-1'>
                    <span className='flex items-center gap-1'>
                      <CalendarDays className='size-3' />
                      {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(attempt.completedDate))}
                    </span>
                    <span>•</span>
                    <span className='text-green-600 dark:text-green-400 font-medium'>{attempt.status}</span>
                  </div>
                </div>
                <Badge variant='secondary' className='text-sm font-bold ml-4'>
                  {attempt.score}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
