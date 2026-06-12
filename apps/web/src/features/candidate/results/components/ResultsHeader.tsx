import { EvaluationResult } from '../types/results.types';

interface ResultsHeaderProps {
  evaluation: EvaluationResult;
}

export function ResultsHeader({ evaluation }: ResultsHeaderProps) {
  const formattedDate = new Date(evaluation.submittedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className='flex flex-col md:flex-row md:items-end justify-between border-b pb-6 mb-8 gap-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-foreground'>{evaluation.testName}</h1>
        <p className='text-muted-foreground mt-1'>
          Candidate: <span className='font-medium text-foreground'>{evaluation.candidateName}</span>
        </p>
      </div>
      <div className='text-sm text-muted-foreground md:text-right bg-muted/30 px-3 py-1.5 rounded-md inline-flex w-fit'>
        Submitted on {formattedDate}
      </div>
    </div>
  );
}
