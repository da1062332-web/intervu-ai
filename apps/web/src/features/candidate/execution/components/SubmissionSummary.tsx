'use client';

import { useExecutionStore } from '../stores/execution.store';

export function SubmissionSummary() {
  const { questions, answers } = useExecutionStore();

  const total = questions.length;
  let answered = 0;
  let markedForReview = 0;

  Object.values(answers).forEach((ans) => {
    if (ans.status === 'MARKED_FOR_REVIEW') {
      markedForReview++;
    } else if (ans.selectedOptionId) {
      answered++;
    }
  });

  const unanswered = total - answered - markedForReview;

  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="bg-muted/50 p-4 rounded-xl border flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{total}</span>
        <span className="text-sm text-muted-foreground mt-1">Total Questions</span>
      </div>
      <div className="bg-primary/5 border-primary/20 p-4 rounded-xl border flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-primary">{answered}</span>
        <span className="text-sm text-primary/80 mt-1">Answered</span>
      </div>
      <div className="bg-orange-500/5 border-orange-500/20 p-4 rounded-xl border flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-orange-600">{markedForReview}</span>
        <span className="text-sm text-orange-600/80 mt-1 text-center leading-tight">Marked For Review</span>
      </div>
      <div className="bg-muted/50 p-4 rounded-xl border flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-muted-foreground">{unanswered}</span>
        <span className="text-sm text-muted-foreground mt-1">Unanswered</span>
      </div>
    </div>
  );
}
