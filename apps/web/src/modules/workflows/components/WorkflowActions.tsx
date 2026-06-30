import React, { useState } from 'react';
import { WorkflowStatusDetails, WorkflowStep, WorkflowStatus } from '../types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ArrowRight, RotateCcw, Check, RefreshCw } from 'lucide-react';

interface WorkflowActionsProps {
  details: WorkflowStatusDetails;
  onAdvance: () => Promise<void>;
  onRollback: (reason?: string) => Promise<void>;
  onRetry: (step: WorkflowStep) => Promise<void>;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  details,
  onAdvance,
  onRollback,
  onRetry,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'advance' | 'rollback' | 'retry', step?: WorkflowStep) => {
    setLoading(action);
    try {
      if (action === 'advance') {
        await onAdvance();
        toast.success('Workflow advanced successfully');
      } else if (action === 'rollback') {
        await onRollback();
        toast.success('Workflow rolled back');
      } else if (action === 'retry' && step) {
        await onRetry(step);
        toast.success(`Retry initiated for ${step}`);
      }
    } catch (error: any) {
      console.error('Action failed', error);
      toast.error(`Action failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const { status, currentStep, nextAction } = details;
  const isFailed = status === WorkflowStatus.FAILED;
  const isCompleted = status === WorkflowStatus.COMPLETED;

  return (
    <div className='flex flex-col gap-3'>
      {isFailed ? (
        <div className='rounded-lg bg-red-50 p-4 border border-red-100 flex flex-col items-start gap-3'>
          <div className='flex items-center gap-2 text-red-800'>
            <AlertTriangle className='h-5 w-5' />
            <span className='font-semibold text-sm'>Workflow Failed at {currentStep}</span>
          </div>
          <p className='text-sm text-red-700'>
            You can retry the current step or rollback to the previous one.
          </p>
          <div className='flex items-center gap-2 mt-2 w-full'>
            <Button
              variant='default'
              className='bg-red-600 hover:bg-red-700 text-white flex-1'
              disabled={!!loading}
              onClick={() => handleAction('retry', currentStep)}
            >
              {loading === 'retry' ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <RefreshCw className='mr-2 h-4 w-4' />
              )}
              Retry {currentStep}
            </Button>
            <Button
              variant='outline'
              className='flex-1'
              disabled={!!loading}
              onClick={() => handleAction('rollback')}
            >
              {loading === 'rollback' ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <RotateCcw className='mr-2 h-4 w-4' />
              )}
              Rollback
            </Button>
          </div>
        </div>
      ) : isCompleted ? (
        <div className='rounded-lg bg-green-50 p-6 border border-green-100 flex flex-col items-center justify-center text-center gap-2 text-green-800'>
          <Check className='h-8 w-8 text-green-600 mb-2' />
          <h3 className='font-semibold text-lg'>Workflow Completed</h3>
          <p className='text-sm'>The test has been successfully published.</p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          <Button
            variant='default'
            size='lg'
            className='w-full'
            disabled={!!loading || status === WorkflowStatus.BLOCKED}
            onClick={() => handleAction('advance')}
          >
            {loading === 'advance' ? (
              <Loader2 className='mr-2 h-5 w-5 animate-spin' />
            ) : (
              <ArrowRight className='mr-2 h-5 w-5' />
            )}
            {nextAction?.label || 'Advance Workflow'}
          </Button>

          {currentStep !== WorkflowStep.CONFIGURATION && (
            <Button
              variant='outline'
              className='w-full text-muted-foreground'
              disabled={!!loading}
              onClick={() => handleAction('rollback')}
            >
              {loading === 'rollback' ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <RotateCcw className='mr-2 h-4 w-4' />
              )}
              Rollback to Previous Step
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
