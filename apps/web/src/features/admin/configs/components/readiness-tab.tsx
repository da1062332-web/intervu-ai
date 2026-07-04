'use client';

import React from 'react';
import { useConfig, useConfigPreview, useAutoValidateConfig } from '@/services/exam-configs';
import { useConfigWizardStore } from './wizard-store';
import { ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReadinessTabProps {
  configId: string;
  onTabChange: (tabId: string) => void;
}

export function ReadinessTab({ configId, onTabChange }: ReadinessTabProps) {
  const { data: config } = useConfig(configId);
  const { data: preview } = useConfigPreview(configId);
  const { data: validation } = useAutoValidateConfig(configId);
  const selectedBlueprintId = useConfigWizardStore((state) => state.getBlueprintId(configId));

  const hasSections = preview ? preview.sections > 0 : false;
  const isDifficultyValid = preview
    ? preview.difficulty.easy + preview.difficulty.medium + preview.difficulty.hard === 100
    : false;
  const hasTopics = preview?.sectionBreakdown
    ? preview.sections > 0 && preview.sectionBreakdown.every((s) => s.topicCount > 0)
    : false;
  const hasTemplatesWarn = validation?.warnings?.some((w) => w.includes('No templates found'));

  const checks = [
    { label: 'Configuration', state: 'Saved', passed: !!config?.id, tab: 'general' },
    { label: 'Blueprint', state: 'Selected', passed: !!selectedBlueprintId, tab: 'blueprint' },
    { label: 'Sections', state: 'Configured', passed: hasSections, tab: 'sections' },
    { label: 'Topics', state: 'Available', passed: hasTopics, tab: 'topics' },
    { label: 'Concepts', state: 'Linked', passed: hasTopics, tab: 'concepts' },
    {
      label: 'Templates',
      state: 'Ready',
      passed: validation ? !hasTemplatesWarn : false,
      tab: 'templates',
    },
    { label: 'Difficulty', state: '100%', passed: isDifficultyValid, tab: 'difficulty' },
    { label: 'Rules', state: 'Configured', passed: true, tab: 'rules' },
    { label: 'Validation', state: 'Passed', passed: !!validation?.valid, tab: 'preview' },
  ];

  const allPassed = checks.every((c) => c.passed);

  return (
    <div className='space-y-8 max-w-4xl'>
      <div>
        <h3 className='text-lg font-bold tracking-tight'>Readiness Validation</h3>
        <p className='text-sm text-muted-foreground'>
          This checklist ensures all dependencies are satisfied before generating an assembly.
        </p>
      </div>

      <div className='border rounded-xl bg-background shadow-sm overflow-hidden'>
        <div className='bg-muted/50 p-4 border-b flex items-center justify-between'>
          <h4 className='font-semibold'>System Checks</h4>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              allPassed
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            {allPassed ? (
              <>
                <ShieldCheck className='w-4 h-4' /> Ready: YES
              </>
            ) : (
              <>
                <ShieldAlert className='w-4 h-4' /> Ready: NO
              </>
            )}
          </span>
        </div>

        <div className='divide-y'>
          {checks.map((check, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between p-4 hover:bg-muted/30 transition-colors'
            >
              <div className='flex items-center gap-3 w-1/3'>
                <span className='text-sm font-semibold'>{check.label}</span>
              </div>
              <div className='flex items-center gap-2 w-1/3 text-muted-foreground text-sm font-medium'>
                {check.state}
              </div>
              <div className='w-1/3 flex justify-end items-center gap-4'>
                {check.passed ? (
                  <CheckCircle2 className='w-5 h-5 text-green-500' />
                ) : (
                  <Button
                    variant='link'
                    className='h-auto p-0 text-amber-600'
                    onClick={() => onTabChange(check.tab)}
                  >
                    Fix Issue
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
