'use client';

import { useAttemptHistory } from '../hooks/useAttemptHistory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface AttemptItem {
  instanceId: string;
  assessmentName: string;
  date: string;
  status: string;
  score: number | null;
}

export function AttemptHistoryTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAttemptHistory(page, 5);

  if (isLoading) {
    return <div className='h-64 animate-pulse bg-muted rounded-xl' />;
  }

  if (!data?.attempts || data.attempts.length === 0) {
    return (
      <Card>
        <CardContent className='py-8 text-center text-muted-foreground'>
          No attempt history found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attempt History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted text-muted-foreground border-b'>
              <tr>
                <th className='px-4 py-3 font-medium'>Assessment</th>
                <th className='px-4 py-3 font-medium'>Date</th>
                <th className='px-4 py-3 font-medium'>Status</th>
                <th className='px-4 py-3 font-medium text-right'>Score</th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {data.attempts.map((attempt: AttemptItem) => (
                <tr key={attempt.instanceId} className='hover:bg-muted/50 transition-colors'>
                  <td className='px-4 py-3 font-medium'>{attempt.assessmentName}</td>
                  <td className='px-4 py-3'>{format(new Date(attempt.date), 'MMM d, yyyy')}</td>
                  <td className='px-4 py-3'>{attempt.status}</td>
                  <td className='px-4 py-3 text-right'>
                    {attempt.score !== null ? `${attempt.score}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.pagination.totalPages > 1 && (
          <div className='flex items-center justify-end space-x-2 py-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className='size-4' />
            </Button>
            <div className='text-sm text-muted-foreground'>
              Page {page} of {data.pagination.totalPages}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
