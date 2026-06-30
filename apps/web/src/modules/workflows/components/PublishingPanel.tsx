import React, { useState } from 'react';
import { StepStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Send, Archive, RotateCcw, FileCheck, Globe, Link as LinkIcon, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PublishingPanelProps {
  status: StepStatus;
  onPublish: () => void;
}

export const PublishingPanel: React.FC<PublishingPanelProps> = ({ status, onPublish }) => {
  const [environment, setEnvironment] = useState<'staging' | 'production'>('production');

  const handleArchive = () => {
    toast.success('Workflow Draft Archived', {
      description: 'The test draft has been moved to the archive.',
    });
  };

  const handleRollback = () => {
    toast.error('Publishing Rolled Back', {
      description: 'The test has been unpublished and returned to draft state.',
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold'>Publishing Center</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Make the final test available for candidates by publishing it to the selected
            environment.
          </p>
        </div>
        <div className='flex gap-3'>
          <Button variant='outline' onClick={handleArchive}>
            <Archive className='w-4 h-4 mr-2' />
            Archive Draft
          </Button>
          <Button
            onClick={onPublish}
            disabled={status.status === 'IN_PROGRESS' || status.status === 'COMPLETED'}
          >
            <Send className='w-4 h-4 mr-2' />
            {status.status === 'IN_PROGRESS'
              ? 'Publishing...'
              : status.status === 'COMPLETED'
                ? 'Published'
                : 'Publish Test'}
          </Button>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        <div className='rounded-lg border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center'>
          <div
            className={`p-4 rounded-full mb-3 ${status.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}
          >
            <Globe className='w-8 h-8' />
          </div>
          <div className='text-sm font-medium text-muted-foreground'>Test Status</div>
          <div
            className={`text-xl font-bold capitalize mt-1 ${status.status === 'COMPLETED' ? 'text-emerald-600' : 'text-primary'}`}
          >
            {status.status === 'COMPLETED' ? 'Live (Published)' : 'Ready to Publish'}
          </div>
        </div>

        <div className='md:col-span-2 rounded-lg border bg-card p-6 shadow-sm'>
          <h4 className='font-semibold mb-4 border-b pb-2 flex items-center gap-2'>
            <FileCheck className='w-5 h-5 text-primary' />
            Publishing Configuration & Details
          </h4>
          <div className='space-y-4'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>Target Environment</span>
              <div className='flex gap-2'>
                <Button
                  variant={environment === 'staging' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setEnvironment('staging')}
                  disabled={status.status === 'COMPLETED'}
                >
                  Staging
                </Button>
                <Button
                  variant={environment === 'production' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setEnvironment('production')}
                  disabled={status.status === 'COMPLETED'}
                >
                  Production
                </Button>
              </div>
            </div>

            <div className='flex justify-between text-sm items-center'>
              <span className='text-muted-foreground'>Published At</span>
              <span className='font-medium'>
                {status.finishedAt
                  ? new Date(status.finishedAt).toLocaleString()
                  : 'Not published yet'}
              </span>
            </div>
            <div className='flex justify-between text-sm items-center'>
              <span className='text-muted-foreground'>Published By</span>
              <span className='font-medium'>Admin</span>
            </div>
            <div className='flex justify-between text-sm items-center'>
              <span className='text-muted-foreground'>Version</span>
              <span className='font-medium bg-muted px-2 py-0.5 rounded-md'>v1.0.0</span>
            </div>

            {status.status === 'COMPLETED' && (
              <div className='mt-4 pt-4 border-t bg-muted/30 p-4 rounded-md'>
                <div className='text-sm font-medium mb-2 flex items-center gap-2'>
                  <LinkIcon className='w-4 h-4' /> Candidate Access Links
                </div>
                <div className='flex gap-2 items-center bg-background border p-2 rounded text-sm font-mono text-muted-foreground'>
                  <span className='truncate flex-1'>https://app.intervu.ai/take/test_29f8a84b</span>
                  <Button variant='ghost' size='icon' className='h-6 w-6'>
                    <Copy className='w-3 h-3' />
                  </Button>
                </div>
              </div>
            )}

            {status.status === 'IN_PROGRESS' && (
              <div className='flex justify-between text-sm pt-2 border-t'>
                <span className='text-muted-foreground'>Progress</span>
                <div className='w-48 flex items-center gap-2'>
                  <Progress value={status.progress} className='flex-1' />
                  <span className='text-xs font-bold'>{status.progress}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {status.status === 'COMPLETED' && (
        <div className='flex justify-end'>
          <Button
            variant='ghost'
            className='text-red-600 hover:text-red-700 hover:bg-red-50'
            onClick={handleRollback}
          >
            <RotateCcw className='w-4 h-4 mr-2' />
            Unpublish & Rollback
          </Button>
        </div>
      )}
    </div>
  );
};
