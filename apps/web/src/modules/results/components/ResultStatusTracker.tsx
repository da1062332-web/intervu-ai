import React, { useEffect } from 'react';
import { useResultStatus } from '../hooks/results.hooks';

interface ResultStatusTrackerProps {
  attemptId: string;
  onComplete?: () => void;
}

export const ResultStatusTracker: React.FC<ResultStatusTrackerProps> = ({ attemptId, onComplete }) => {
  const { data, isError, isLoading } = useResultStatus(attemptId);

  const status = data?.status;
  
  // Stop polling logic: react query useQuery refetchInterval can accept a function to conditionally poll,
  // but we can also use useEffect to notify parent when complete
  useEffect(() => {
    if (status === 'COMPLETED' || status === 'FAILED') {
      if (onComplete) onComplete();
    }
  }, [status, onComplete]);

  if (isLoading) return <div className="text-gray-500 animate-pulse text-sm">Checking status...</div>;
  if (isError) return <div className="text-red-500 text-sm">Failed to check status</div>;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'EVALUATING': return 'bg-yellow-100 text-yellow-800 animate-pulse';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Evaluation Status:</span>
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status || '')}`}>
        {status || 'UNKNOWN'}
      </span>
    </div>
  );
};
