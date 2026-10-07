'use client';

import React, { useState } from 'react';
import { StepStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Archive,
  RotateCcw,
  FileCheck,
  Globe,
  Link as LinkIcon,
  Copy,
  ShieldCheck,
  Hash,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useConfig, usePublishedVersions } from '@/services/exam-configs';
import { TestPackagePreview } from './TestPackagePreview';
import Link from 'next/link';

interface PublishingPanelProps {
  examId: string;
  status: StepStatus;
  onPublish: () => void;
}

export const PublishingPanel: React.FC<PublishingPanelProps> = ({
  examId,
  status,
  onPublish,
}) => {
  const [environment, setEnvironment] = useState<'staging' | 'production'>('production');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const { data: config } = useConfig(examId);
  const { data: publishedVersions } = usePublishedVersions(examId);

  const activePublishedVersion = publishedVersions?.find((v) => v.status === 'ACTIVE');
  const latestPublishedVersion = publishedVersions?.[0];
  const nextVersionNumber = (latestPublishedVersion?.versionNumber || config?.currentVersionNumber || 0) + 1;

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

  const handleConfirmPublish = () => {
    setShowPublishConfirm(false);
    onPublish();
  };

  const isPublishing = status.status === 'IN_PROGRESS';
  const isPublished = status.status === 'COMPLETED' || config?.status === 'PUBLISHED';

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h3 className='text-xl font-bold text-foreground'>Publishing Center</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Release and publish immutable assessment versions for candidate evaluations.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/admin/configurations/${examId}/versions`} className='gap-1.5'>
              <History className='w-4 h-4 text-muted-foreground' />
              <span>Version History ({publishedVersions?.length || 0})</span>
            </Link>
          </Button>
          <Button
            onClick={() => setShowPublishConfirm(true)}
            disabled={isPublishing}
            className='gap-2'
          >
            <Send className='w-4 h-4' />
            {isPublishing
              ? 'Publishing...'
              : isPublished
                ? `Publish Update (V${nextVersionNumber})`
                : 'Publish Test (V1)'}
          </Button>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        <div className='rounded-2xl border border-border/60 bg-card p-6 shadow-2xs flex flex-col justify-center items-center text-center'>
          <div
            className={`p-4 rounded-2xl mb-3 ${
              isPublished
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            {isPublished ? <ShieldCheck className='w-8 h-8' /> : <Globe className='w-8 h-8' />}
          </div>
          <div className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
            Publication Status
          </div>
          <div
            className={`text-xl font-extrabold capitalize mt-1 ${
              isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
            }`}
          >
            {isPublished ? 'Live & Versioned' : 'Ready to Publish'}
          </div>
          {activePublishedVersion && (
            <Badge variant='secondary' className='mt-2 font-mono text-xs px-2.5 py-0.5'>
              {activePublishedVersion.versionName || `V${activePublishedVersion.versionNumber}`} (Active)
            </Badge>
          )}
        </div>

        <div className='md:col-span-2 rounded-2xl border border-border/60 bg-card p-6 shadow-2xs'>
          <h4 className='font-bold text-base text-foreground mb-4 border-b border-border/40 pb-3 flex items-center gap-2'>
            <FileCheck className='w-5 h-5 text-primary' />
            Version & Publishing Metadata
          </h4>
          <div className='space-y-3.5'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-muted-foreground'>Target Environment</span>
              <div className='flex gap-2'>
                <Button
                  variant={environment === 'staging' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setEnvironment('staging')}
                  className='h-8 text-xs font-semibold rounded-lg'
                >
                  Staging
                </Button>
                <Button
                  variant={environment === 'production' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setEnvironment('production')}
                  className='h-8 text-xs font-semibold rounded-lg'
                >
                  Production
                </Button>
              </div>
            </div>

            <div className='flex justify-between text-sm items-center'>
              <span className='text-muted-foreground'>Current Active Version</span>
              <span className='font-mono font-bold text-foreground'>
                {activePublishedVersion
                  ? activePublishedVersion.versionName
                  : isPublished
                    ? `V${config?.currentVersionNumber || 1}`
                    : 'Not published (Draft)'}
              </span>
            </div>

            {activePublishedVersion?.versionHash && (
              <div className='flex justify-between text-sm items-center'>
                <span className='text-muted-foreground'>Version SHA-256 Hash</span>
                <span className='font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md flex items-center gap-1'>
                  <Hash className='size-3 text-muted-foreground/70' />
                  {activePublishedVersion.versionHash.slice(0, 16)}...
                </span>
              </div>
            )}

            <div className='flex justify-between text-sm items-center'>
              <span className='text-muted-foreground'>Last Published At</span>
              <span className='font-medium text-foreground'>
                {activePublishedVersion?.publishedAt
                  ? new Date(activePublishedVersion.publishedAt).toLocaleString()
                  : status.finishedAt
                    ? new Date(status.finishedAt).toLocaleString()
                    : '—'}
              </span>
            </div>

            {isPublished && (
              <div className='mt-4 pt-4 border-t border-border/40 bg-muted/20 p-4 rounded-xl space-y-2'>
                <div className='text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2'>
                  <LinkIcon className='w-4 h-4 text-primary' /> Candidate Assessment Link
                </div>
                <div className='flex gap-2 items-center bg-background border border-border/70 p-2 rounded-lg text-xs font-mono text-muted-foreground'>
                  <span className='truncate flex-1'>
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/candidate/tests/${examId}`
                      : `/candidate/tests/${examId}`}
                  </span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/candidate/tests/${examId}`,
                        );
                        toast.success('Assessment link copied to clipboard');
                      }
                    }}
                  >
                    <Copy className='w-3 h-3' />
                  </Button>
                </div>
              </div>
            )}

            {status.status === 'IN_PROGRESS' && (
              <div className='flex justify-between text-sm pt-2 border-t'>
                <span className='text-muted-foreground'>Publishing Progress</span>
                <div className='w-48 flex items-center gap-2'>
                  <Progress value={status.progress} className='flex-1' />
                  <span className='text-xs font-bold'>{status.progress}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isPublished && (
        <div className='mt-8 border-t border-border/40 pt-8'>
          <TestPackagePreview assemblyId={examId} />
        </div>
      )}

      {/* Confirmation Dialog for Atomic Version Publishing */}
      <ConfirmationDialog
        isOpen={showPublishConfirm}
        onOpenChange={(open) => !open && setShowPublishConfirm(false)}
        title={isPublished ? `Publish New Version (V${nextVersionNumber})?` : 'Publish Assessment (V1)?'}
        description={
          isPublished
            ? `Publishing will freeze the current configuration into immutable Version ${nextVersionNumber}. All future candidate attempts will use V${nextVersionNumber}. Existing attempts and historical results remain safely pinned to their original version.`
            : `Publishing will create the initial immutable Version 1 snapshot and make this assessment immediately available for eligible candidate attempts.`
        }
        confirmLabel={isPublished ? `Publish V${nextVersionNumber}` : 'Publish V1'}
        onConfirm={handleConfirmPublish}
        isLoading={isPublishing}
      />
    </div>
  );
};
