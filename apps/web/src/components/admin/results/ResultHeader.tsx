import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

export interface ResultHeaderProps {
  candidateName: string;
  testTitle: string;
  submittedAt: string;
}

export function ResultHeader({ candidateName, testTitle, submittedAt }: ResultHeaderProps) {
  const formattedDate = format(new Date(submittedAt), 'MMMM do, yyyy - h:mm a');

  return (
    <Card className='mb-6'>
      <CardContent className='p-6'>
        <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>{candidateName}</h1>
            <h2 className='text-lg text-muted-foreground mt-1'>{testTitle}</h2>
          </div>
          <div className='text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md'>
            Submitted: <time dateTime={submittedAt}>{formattedDate}</time>
          </div>
        </header>
      </CardContent>
    </Card>
  );
}
