import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export interface BatchProgressWidgetProps {
  status: 'idle' | 'generating' | 'success' | 'error';
  progress: number;
  total: number;
  successCount?: number;
  failureCount?: number;
}

export function BatchProgressWidget({
  status,
  progress,
  total,
  successCount = 0,
  failureCount = 0,
}: BatchProgressWidgetProps) {
  if (status === 'idle') return null;

  return (
    <Card className='border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-900/10'>
      <CardHeader className='pb-2'>
        <div className='flex items-center gap-2'>
          {status === 'generating' && <AnimatedLoader variant="button" className="text-blue-500" />}
          {status === 'success' && <CheckCircle2 className='h-5 w-5 text-green-500' />}
          {status === 'error' && <XCircle className='h-5 w-5 text-red-500' />}
          <CardTitle className='text-lg'>
            {status === 'generating'
              ? 'Generating Batch...'
              : status === 'success'
                ? 'Batch Generation Complete'
                : 'Generation Failed'}
          </CardTitle>
        </div>
        <CardDescription>
          {status === 'generating'
            ? `Processing ${total} questions. This may take a few moments.`
            : `Completed ${total} questions.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className='h-2 mb-4' />

        {status !== 'generating' && (
          <div className='flex gap-4 text-sm'>
            <span className='flex items-center gap-1 text-green-600 dark:text-green-400'>
              <CheckCircle2 className='h-4 w-4' /> {successCount} Successful
            </span>
            {failureCount > 0 && (
              <span className='flex items-center gap-1 text-red-600 dark:text-red-400'>
                <XCircle className='h-4 w-4' /> {failureCount} Failed
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
