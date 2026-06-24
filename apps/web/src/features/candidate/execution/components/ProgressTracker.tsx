'use client';

import { useExecutionStore } from '../stores/execution.store';

export function ProgressTracker() {
  const { questions, answers, testInstance } = useExecutionStore();

  const total = questions.length;
  let answered = 0;
  let marked = 0;

  Object.values(answers).forEach((ans) => {
    if (ans.status === 'MARKED_FOR_REVIEW') {
      marked++;
    } else if (
      ans.selectedOptionId ||
      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
      ans.textResponse
    ) {
      answered++;
    }
  });

  const remaining = total - answered - marked;
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className='flex flex-col gap-4 w-full max-w-xs'>
      <div className='flex items-center justify-between text-sm font-medium'>
        <span className='text-muted-foreground'>Overall Progress</span>
        <span>{percentage}%</span>
      </div>
      <div className='h-2 w-full bg-muted rounded-full overflow-hidden'>
        <div
          className='h-full bg-primary transition-all duration-300 ease-in-out'
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className='grid grid-cols-3 gap-2 mt-2 text-center text-xs'>
        <div className='bg-primary/10 text-primary p-2 rounded'>
          <div className='font-bold text-sm'>{answered}</div>
          <div>Attempted</div>
        </div>
        <div className='bg-orange-500/10 text-orange-600 p-2 rounded'>
          <div className='font-bold text-sm'>{marked}</div>
          <div>Marked</div>
        </div>
        <div className='bg-muted p-2 rounded text-muted-foreground'>
          <div className='font-bold text-sm'>{remaining}</div>
          <div>Remaining</div>
        </div>
      </div>

      {testInstance?.sections && testInstance.sections.length > 0 && (
        <div className='mt-4 flex flex-col gap-3'>
          <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
            Section Progress
          </span>
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
              <div key={section.id} className='flex flex-col gap-1'>
                <div className='flex justify-between text-xs'>
                  <span>{section.title}</span>
                  <span>
                    {secAnswered}/{secTotal}
                  </span>
                </div>
                <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-primary/80 transition-all duration-300 ease-in-out'
                    style={{ width: `${secPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
