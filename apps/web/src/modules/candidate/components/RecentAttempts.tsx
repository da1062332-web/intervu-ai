'use client';

import { AttemptHistory } from '../types/Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Trophy } from 'lucide-react';

import { useCandidateDashboard } from '../hooks/useCandidateDashboard';

export function RecentAttempts() {
  const { data, isLoading, error } = useCandidateDashboard();

  if (isLoading) {
    return (
      <Card className='h-full flex flex-col glass-card'>
        <CardHeader>
          <CardTitle className='text-xl font-semibold'>Previous Attempts</CardTitle>
          <CardDescription>Your latest assessment results</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 space-y-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-16 bg-muted animate-pulse rounded-md'></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className='h-full flex flex-col glass-card'>
        <CardContent className='flex-1 flex items-center justify-center text-destructive'>
          Failed to load previous attempts.
        </CardContent>
      </Card>
    );
  }

  const history = data.completedAttempts || [];

  return (
    <Card className='h-full flex flex-col glass-card'>
      <CardHeader>
        <CardTitle className='text-xl font-semibold'>Previous Attempts</CardTitle>
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
              const resultId = attempt.instanceId || attempt.id;
              const configId = attempt.testId;
              return (
                <div
                  key={attempt.id || attempt.instanceId}
                  className='flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl hover:bg-muted/50 transition-colors border border-border/40 bg-card/40 gap-3'
                >
                  <div className='space-y-1 min-w-0 flex-1'>
                    <p className='font-bold text-sm leading-snug text-foreground truncate'>
                      {attempt.assessmentName}
                    </p>
                    <div className='flex items-center text-xs text-muted-foreground gap-2 mt-1'>
                      <span className='flex items-center gap-1 font-medium'>
                        <CalendarDays className='size-3 text-muted-foreground/70' />
                        {new Intl.DateTimeFormat('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(attempt.completedDate))}
                      </span>
                      <span>•</span>
                      <span className='text-emerald-600 dark:text-emerald-400 font-bold'>
                        {attempt.status}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 shrink-0 self-end sm:self-center'>
                    {attempt.score !== null && (
                      <Badge
                        variant='secondary'
                        className='text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg'
                      >
                        {attempt.score}%
                      </Badge>
                    )}
                    {resultId && (
                      <a
                        href={`/candidate/results/${resultId}`}
                        className='text-xs font-bold bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1 rounded-lg border border-border/60 transition-all'
                      >
                        Result
                      </a>
                    )}
                    {configId && (
                      <a
                        href={`/candidate/tests/${configId}`}
                        className='text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-lg transition-all'
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
