import React, { useEffect } from 'react';
import { useResultStatus } from '../hooks/results.hooks';

interface ResultStatusTrackerProps {
  attemptId: string;
  onComplete?: () => void;
}

export const ResultStatusTracker: React.FC<ResultStatusTrackerProps> = ({
  attemptId,
  onComplete,
}) => {
  const { data, isError, isLoading } = useResultStatus(attemptId);

  const status = data?.status;

  // Stop polling logic: react query useQuery refetchInterval can accept a function to conditionally poll,
  // but we can also use useEffect to notify parent when complete
  useEffect(() => {
    if (status === 'COMPLETED' || status === 'FAILED') {
      if (onComplete) onComplete();
    }
  }, [status, onComplete]);

  if (isLoading)
    return <div className='text-gray-500 dark:text-slate-400 animate-pulse text-sm'>Checking status...</div>;
  if (isError) return <div className='text-red-500 dark:text-red-400 text-sm'>Failed to check status</div>;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 dark:border dark:border-green-800/40';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border dark:border-red-800/40';
      case 'EVALUATING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border dark:border-yellow-800/40 animate-pulse';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border dark:border-blue-800/40';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700';
    }
  };

  return (
    <div className='flex items-center space-x-2'>
      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>Evaluation Status:</span>
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(status || '')}`}
      >
        {status || 'UNKNOWN'}
      </span>
    </div>
  );
};
