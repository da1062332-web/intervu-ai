'use client';

import React from 'react';
import { useConfigurationValidation } from '../hooks/useConfigurationValidation';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface GenerationReadinessPanelProps {
  configId: string;
  onTabChange?: (tabId: string) => void;
}

export function GenerationReadinessPanel({ configId, onTabChange }: GenerationReadinessPanelProps) {
  const { data: validation, isLoading, isError, refetch } = useConfigurationValidation(configId);

  if (isLoading) {
    return (
      <div className='space-y-6 max-w-4xl'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (isError || !validation) {
    return (
      <div className='text-center py-12 border rounded-lg bg-red-50/50'>
        <h3 className='text-lg font-medium text-red-600 mb-2'>Validation Error</h3>
        <p className='text-muted-foreground mb-4'>
          Failed to run readiness checks for this configuration.
        </p>
        <Button variant='outline' onClick={() => refetch()}>
          <RefreshCw className='mr-2 h-4 w-4' /> Retry
        </Button>
      </div>
    );
  }

  const { valid, readiness, errors, warnings } = validation;

  return (
    <div className='space-y-8 max-w-4xl'>
      <div>
        <h3 className='text-lg font-bold tracking-tight'>Generation Readiness</h3>
        <p className='text-sm text-muted-foreground'>
          This checks if your configuration is fully ready for deterministic question generation.
        </p>
      </div>

      <div className='border rounded-xl bg-background shadow-sm overflow-hidden'>
        <div className='bg-muted/50 p-6 border-b flex items-center justify-between'>
          <div>
            <h4 className='font-semibold text-lg'>Readiness Score</h4>
            <p className='text-sm text-muted-foreground'>
              Based on topics, concepts, templates, and weightages.
            </p>
          </div>

          <div className='flex items-center gap-4'>
            <div
              className='text-4xl font-black tabular-nums tracking-tighter'
              style={{ color: valid ? '#16a34a' : readiness > 50 ? '#d97706' : '#dc2626' }}
            >
              {readiness}%
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                valid
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {valid ? (
                <>
                  <ShieldCheck className='w-5 h-5' /> Ready: YES
                </>
              ) : (
                <>
                  <ShieldAlert className='w-5 h-5' /> Ready: NO
                </>
              )}
            </span>
          </div>
        </div>

        <div className='p-6 space-y-6'>
          {/* Errors Section */}
          {errors.length > 0 ? (
            <div className='space-y-3'>
              <h5 className='font-semibold text-red-700 flex items-center gap-2'>
                <XCircle className='w-5 h-5' />
                Blocking Issues ({errors.length})
              </h5>
              <ul className='space-y-2'>
                {errors.map((err, i) => (
                  <li
                    key={i}
                    className='flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md'
                  >
                    <span className='mt-0.5'>•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className='flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-md'>
              <CheckCircle2 className='w-5 h-5' />
              <span className='font-medium text-sm'>No blocking issues found.</span>
            </div>
          )}

          {/* Warnings Section */}
          {warnings.length > 0 && (
            <div className='space-y-3 mt-6'>
              <h5 className='font-semibold text-amber-700 flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5' />
                Warnings ({warnings.length})
              </h5>
              <ul className='space-y-2'>
                {warnings.map((warn, i) => (
                  <li
                    key={i}
                    className='flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-md'
                  >
                    <span className='mt-0.5'>•</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!valid && (
            <div className='pt-4 border-t mt-6 flex justify-end'>
              <Button variant='outline' onClick={() => onTabChange?.('topics')}>
                Review Topics & Concepts
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
