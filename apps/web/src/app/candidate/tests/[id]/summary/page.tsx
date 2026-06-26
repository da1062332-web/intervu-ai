'use client';

import { useExecutionStore } from '@/features/candidate/execution/stores/execution.store';
import { SubmissionSummary } from '@/features/candidate/execution/components/SubmissionSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestSummaryPage() {
  const { testInstance, questions, answers, remainingTime } = useExecutionStore();
  const router = useRouter();

  useEffect(() => {
    // Basic redirect if we don't have a test instance loaded (e.g. direct refresh without recovery)
    if (!testInstance) {
      // router.push('/candidate/dashboard');
    }
  }, [testInstance, router]);

  if (!testInstance) {
    return <div className='p-8 text-center'>Loading Summary...</div>;
  }

  const total = questions.length;
  let answered = 0;

  Object.values(answers).forEach((ans) => {
    if (
      ans.status !== 'MARKED_FOR_REVIEW' &&
      (ans.selectedOptionId ||
        (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
        ans.textResponse)
    ) {
      answered++;
    }
  });

  const completionPercentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  const timeSpentSeconds = testInstance.durationSeconds - remainingTime;
  const timeSpentMins = Math.floor(timeSpentSeconds / 60);
  const timeSpentSecs = timeSpentSeconds % 60;

  return (
    <div className='container max-w-4xl mx-auto py-12 px-4'>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold'>Test Summary</h1>
        <Button onClick={() => router.push('/candidate/dashboard')} variant='outline'>
          Back to Dashboard
        </Button>
      </div>

      <div className='grid gap-8'>
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress - {completionPercentage}% Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionSummary />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Section Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {testInstance.sections.map((section) => {
                let secAnswered = 0;
                section.questions.forEach((q) => {
                  const ans = answers[q.id];
                  if (
                    ans &&
                    ans.status !== 'MARKED_FOR_REVIEW' &&
                    (ans.selectedOptionId ||
                      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                      ans.textResponse)
                  ) {
                    secAnswered++;
                  }
                });
                const secTotal = section.questions.length;
                const secPct = secTotal > 0 ? Math.round((secAnswered / secTotal) * 100) : 0;

                return (
                  <div
                    key={section.id}
                    className='flex items-center justify-between border-b pb-4 last:border-0 last:pb-0'
                  >
                    <div className='font-medium'>{section.title}</div>
                    <div className='flex items-center gap-4 text-sm'>
                      <span className='text-muted-foreground'>
                        {secAnswered} / {secTotal} answered
                      </span>
                      <div className='w-32 h-2 bg-muted rounded-full overflow-hidden hidden sm:block'>
                        <div
                          className='h-full bg-primary transition-all duration-300'
                          style={{ width: `${secPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-mono'>
              {timeSpentMins}m {timeSpentSecs}s
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
