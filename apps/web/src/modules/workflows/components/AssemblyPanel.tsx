import React from 'react';
import { StepStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Layers, Play, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

import { toast } from 'sonner';

import { AssemblyHealthDashboard } from './AssemblyHealthDashboard';

interface AssemblyPanelProps {
  examId: string;
  status: StepStatus;
  onAssemble: () => void;
}

export const AssemblyPanel: React.FC<AssemblyPanelProps> = ({ examId, status, onAssemble }) => {
  const handlePreview = () => {
    toast.info('Generating live preview...', {
      description: 'The test draft is being assembled in memory.',
    });
    setTimeout(() => {
      toast.success('Preview ready!', {
        description: 'Test draft opened in a new window.',
      });
    }, 1500);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold'>Test Assembly Workflow</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Assemble the final test paper according to the blueprint constraints and selected
            questions.
          </p>
        </div>
        <div className='flex gap-3'>
          <Button variant='outline' onClick={handlePreview}>
            <Eye className='w-4 h-4 mr-2' />
            Preview Draft
          </Button>
          <Button onClick={onAssemble} disabled={status.status === 'IN_PROGRESS'}>
            <Play className='w-4 h-4 mr-2' />
            {status.status === 'IN_PROGRESS' ? 'Assembling...' : 'Generate Test'}
          </Button>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <div className='rounded-lg border bg-card p-6 shadow-sm'>
          <h4 className='font-semibold mb-4 flex items-center gap-2 border-b pb-2'>
            <Layers className='w-5 h-5 text-primary' />
            Blueprint Configuration
          </h4>
          <div className='space-y-4 mt-4'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>Total Sections</span>
              <span className='font-bold text-lg'>3</span>
            </div>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>Total Questions Required</span>
              <span className='font-bold text-lg'>25</span>
            </div>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>Target Duration</span>
              <span className='font-medium bg-muted px-2 py-1 rounded-md'>60 Minutes</span>
            </div>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>Passing Score</span>
              <span className='font-medium bg-muted px-2 py-1 rounded-md'>70%</span>
            </div>
          </div>
        </div>

        <div className='rounded-lg border bg-card p-6 shadow-sm flex flex-col'>
          <h4 className='font-semibold mb-4 flex items-center gap-2 border-b pb-2'>
            Pre-Assembly Validation
          </h4>
          <div className='space-y-3 flex-1 mt-2'>
            <div className='flex items-center gap-3 text-sm'>
              <CheckCircle2 className='w-5 h-5 text-green-500' />
              <span>Sufficient approved questions in pool (42/25)</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <CheckCircle2 className='w-5 h-5 text-green-500' />
              <span>Difficulty distribution matches blueprint</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <AlertCircle className='w-5 h-5 text-amber-500' />
              <span>React section slightly short on 'Hard' questions (fallback applied)</span>
            </div>
          </div>
          <div className='mt-6 pt-4 border-t flex flex-col gap-2 text-center'>
            <div className='text-sm font-medium text-muted-foreground'>Assembly Progress</div>
            <div className='mt-1 flex items-center gap-2 px-8'>
              <Progress value={status.progress} className='flex-1' />
              <span className='text-sm font-bold'>{status.progress}%</span>
            </div>
            <div className='text-xs text-muted-foreground mt-1'>
              Status:{' '}
              <span className='font-semibold capitalize'>
                {status.status.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {status.status === 'COMPLETED' && (
        <div className='mt-8'>
          <AssemblyHealthDashboard assemblyId={examId} />
        </div>
      )}
    </div>
  );
};
