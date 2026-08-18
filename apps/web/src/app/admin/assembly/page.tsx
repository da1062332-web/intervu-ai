'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play, ArrowLeft, Info, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';
import Link from 'next/link';
import { useTopics } from '@/services/topics/hooks';
import { SectionHeader } from '@/components/ui/section-header';
import { ConfigurationSelection } from '@/features/assessment-builder/components/ConfigurationSelection';
import { formatAssemblyError } from './utils/assembly-error-utils';
import type { ExamConfig } from '@/services/exam-configs/types';

export default function AssemblyDashboardPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);

  // Fetch topics so we can resolve topic names in error messages
  const { data: topics } = useTopics(false);

  const generateAssembly = async (config: ExamConfig) => {
    // FE-09: Pre-Assembly Validation guard
    if (config.status === 'DRAFT') {
      toast.error('Draft configurations cannot be assembled. Please validate or publish the configuration first.');
      return;
    }
    if ((config.totalQuestions ?? 0) <= 0) {
      toast.error('Cannot assemble a configuration with 0 total questions.');
      return;
    }

    setGenerating(config.id);
    try {
      const response = await apiClient.request<{ testInstanceId: string }>(
        '/assembly/tests/generate',
        {
          method: 'POST',
          body: { configId: config.id },
        },
      );

      if (response && response.testInstanceId) {
        toast.success('Successfully assembled test instance.');
        router.push(`/admin/assembly/${response.testInstanceId}`);
      } else {
        throw new Error('Failed to generate assembly');
      }
    } catch (error: any) {
      // FE-07: Error parsing via assembly error utils
      const { displayMessage, isNoSections } = formatAssemblyError(error, topics);
      if (isNoSections) {
        toast.error(displayMessage, { duration: 4000 });
        setTimeout(() => {
          router.push(`/admin/configurations/${config.id}/edit`);
        }, 1500);
      } else {
        toast.error(displayMessage);
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6'>
      <SectionHeader
        title='Test Assembly'
        description='Generate full test instances from your exam configurations. Each assembly contains sections, questions, and analytics.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Assembly' }]}
      />

      {/* Workflow Guide */}
      <div className='flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30 p-4'>
        <Info className='w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0' />
        <div className='text-sm text-indigo-800 dark:text-indigo-300'>
          <p className='font-medium'>Complete Assembly Lifecycle</p>
          <p className='mt-0.5 text-indigo-700 dark:text-indigo-400'>
            <span className='font-semibold'>1. Templates</span> define structure →{' '}
            <span className='font-semibold'>2. Exam Configs</span> set rules →{' '}
            <span className='font-semibold'>3. Assembly Engine</span> builds the test →{' '}
            <span className='font-semibold'>4. Review & Analytics</span> →{' '}
            <span className='font-semibold'>5. Save Version & Publish</span>.
            <br />
            Click <strong>Generate Test Assembly</strong> below to begin step 3.
          </p>
        </div>
        <Link href='/admin/templates' className='shrink-0'>
          <Button
            variant='outline'
            size='sm'
            className='text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-400'
          >
            <ArrowLeft className='w-3.5 h-3.5 mr-1.5' />
            View Templates
          </Button>
        </Link>
      </div>

      {/* ARCH-01 & ARCH-02: Reused Configuration Selection & Custom Actions */}
      <ConfigurationSelection
        filterStatus={null}
        onEmptyAction={() => router.push('/admin/configurations/new')}
        emptyActionLabel='Create Exam Config'
        renderActions={(config) => {
          const isDraft = config.status === 'DRAFT';
          const isZeroQuestions = (config.totalQuestions ?? 0) <= 0;
          const isInvalidForAssembly = isDraft || isZeroQuestions;

          return (
            <div className='w-full space-y-2'>
              {isInvalidForAssembly && (
                <div className='flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800'>
                  <AlertCircle className='w-3.5 h-3.5 shrink-0' />
                  <span>
                    {isDraft
                      ? 'Draft config cannot be assembled. Validate or publish first.'
                      : 'Config has 0 total questions defined.'}
                  </span>
                </div>
              )}
              <Button
                className='w-full gap-2'
                onClick={() => generateAssembly(config)}
                disabled={isInvalidForAssembly || generating === config.id}
                isLoading={generating === config.id}
              >
                {generating !== config.id && <Play className='h-4 w-4' />}
                {generating === config.id ? 'Assembling...' : 'Generate Test Assembly'}
              </Button>
              <Button
                variant='outline'
                className='w-full gap-2'
                onClick={() => router.push(`/admin/assessment-builder?configId=${config.id}`)}
              >
                <Sparkles className='h-4 w-4' />
                Open Assessment Generator
              </Button>
            </div>
          );
        }}
      />
    </div>
  );
}

