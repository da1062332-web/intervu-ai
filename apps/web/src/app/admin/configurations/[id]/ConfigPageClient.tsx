'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SectionBuilder } from '@/modules/exam-config/components/section-builder';
import { RuleFlagsTab } from '@/features/admin/configs/components/rule-flags-tab';
import { DifficultyDistributionTab } from '@/features/admin/configs/components/difficulty-distribution-tab';
import { ValidationWidget } from '@/features/admin/configs/components/validation-widget';
import { ConfigPreviewTab } from '@/features/admin/configs/components/config-preview-tab';
import { GeneralSettingsTab } from '@/features/admin/configs/components/general-settings-tab';
import { ConceptsAndTemplatesTab } from '@/features/admin/configs/components/concepts-templates-tab';
import { BlueprintSelectionTab } from '@/features/admin/configs/components/blueprint-selection-tab';
import { TopicsSummaryTab } from '@/features/admin/configs/components/topics-summary-tab';
import { useConfigWizardStore } from '@/features/admin/configs/components/wizard-store';
import { GenerationReadinessPanel } from '@/features/admin/configs/components/GenerationReadinessPanel';

import { cn } from '@/lib/utils';
import { useConfig, useConfigPreview, useAutoValidateConfig } from '@/services/exam-configs';
import { useConfigurationValidation } from '@/features/admin/configs/hooks/useConfigurationValidation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle2, Circle } from 'lucide-react';
import { apiClient } from '@/services/api/client';

interface ConfigPageClientProps {
  configId: string;
}

const WIZARD_TABS = [
  { id: 'general', label: 'General' },
  { id: 'sections', label: 'Sections' },
  { id: 'topics', label: 'Topics' },
  { id: 'concepts-templates', label: 'Concepts & Content' },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'rules', label: 'Rules' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'readiness', label: 'Readiness' },
  { id: 'preview', label: 'Preview' },
];

export function ConfigPageClient({ configId }: ConfigPageClientProps) {
  const router = useRouter();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { data: config, isLoading, isError } = useConfig(configId);
  const { data: preview } = useConfigPreview(configId);
  const { data: autoValidation } = useAutoValidateConfig(configId);
  const { data: generationReadiness } = useConfigurationValidation(configId);
  const selectedBlueprintId = useConfigWizardStore((state) => state.getBlueprintId(configId));

  const activeTabId = WIZARD_TABS[activeTabIndex].id;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const markClean = useCallback(() => setIsDirty(false), []);

  const handleNext = () => {
    if (activeTabId === 'blueprint' && !selectedBlueprintId) {
      toast.error('Please select a blueprint before continuing.');
      return;
    }
    // More complex validations can be added here if needed
    if (activeTabIndex < WIZARD_TABS.length - 1) {
      if (isDirty) {
        if (!window.confirm('You have unsaved changes. Continue without saving?')) return;
        markClean();
      }
      setActiveTabIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (activeTabIndex > 0) {
      if (isDirty) {
        if (!window.confirm('You have unsaved changes. Go back without saving?')) return;
        markClean();
      }
      setActiveTabIndex((i) => i - 1);
    }
  };

  const handleTabClick = (index: number) => {
    if (activeTabIndex === index) return;
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Leave this tab without saving?')) return;
      markClean();
    }
    if (!selectedBlueprintId && index > 7) {
      toast.error('Please select a blueprint first.');
      setActiveTabIndex(7); // Force them to blueprint tab
      return;
    }
    setActiveTabIndex(index);
  };

  const generateAssembly = async () => {
    setGenerating(true);
    try {
      // 1. Pre-flight config validation
      const validation = await apiClient.request<any>(`/admin/configs/${configId}/validate`, {
        method: 'POST',
        skipErrorToast: true,
      });

      if (!validation.valid) {
        toast.error('Cannot generate assembly. Validation failed:', {
          description: (
            <ul className='list-disc pl-4 mt-1 space-y-1'>
              {validation.errors?.map((err: string, i: number) => (
                <li key={i} className='text-xs'>
                  {err}
                </li>
              ))}
            </ul>
          ),
          duration: 10000,
        });
        setGenerating(false);
        return;
      }

      // 2. Generate Assembly
      const response = await apiClient.request<{ testInstanceId: string }>(
        '/assembly/tests/generate',
        {
          method: 'POST',
          body: { configId },
        },
      );

      if (response && response.testInstanceId) {
        toast.success('Successfully assembled test instance.');
        router.push(`/admin/assembly/${response.testInstanceId}`);
      } else {
        throw new Error('Failed to generate assembly');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate assembly');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8'>
        <Skeleton className='h-10 w-1/3' />
        <Skeleton className='h-6 w-1/4 mt-2' />
        <Skeleton className='h-12 w-full mt-8' />
        <Skeleton className='h-64 w-full mt-8' />
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
        <div className='text-center py-12 border rounded-md'>
          <h3 className='text-lg font-medium text-red-600 mb-2'>Configuration Not Found</h3>
          <p className='text-muted-foreground'>
            The exam configuration you are looking for does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  // Use dynamic readiness data from the new backend API
  const healthChecks = generationReadiness?.checks || [];
  const progressPercent = generationReadiness?.score || 0;
  const isReady = generationReadiness?.status === 'READY';

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8'>
      <div className='flex flex-col gap-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{config.name}</h1>
          <p className='text-muted-foreground mt-2'>
            Follow the guided workflow to complete this exam configuration.
          </p>
        </div>

        {/* Configuration Health Panel */}
        <div className='w-full border rounded-xl p-5 bg-card shadow-sm'>
          <div className='flex items-center justify-between mb-4 pb-4 border-b'>
            <h3 className='font-semibold text-sm text-foreground uppercase tracking-wider'>Configuration Health</h3>
            <div className='flex items-center gap-4'>
               <div className="w-32 md:w-64 bg-muted rounded-full h-2 hidden sm:block">
                 <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
               </div>
               <span className='text-sm font-medium text-primary'>{progressPercent}%</span>
            </div>
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-4 gap-x-4'>
            {healthChecks.map((check: any, i: number) => (
              <div key={i} className='flex items-center gap-2 text-sm'>
                {check.status === 'PASS' ? (
                  <CheckCircle2 className='w-4 h-4 text-green-500 shrink-0' />
                ) : (
                  <Circle className='w-4 h-4 text-muted-foreground shrink-0' />
                )}
                <span className={`truncate ${check.status === 'PASS' ? 'text-foreground font-medium' : 'text-muted-foreground'}`} title={check.message}>
                  {check.name}
                </span>
              </div>
            ))}
            {healthChecks.length === 0 && (
              <div className="text-muted-foreground text-sm col-span-full">Loading health checks...</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Workflow Navigation */}
      <div className='border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1'>
        <nav className='flex space-x-6' aria-label='Tabs'>
          {WIZARD_TABS.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(index)}
              className={cn(
                activeTabIndex === index
                  ? 'border-primary text-primary'
                  : index < activeTabIndex
                    ? 'border-transparent text-foreground hover:text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
              )}
            >
              <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]'>
                {index + 1}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className='mt-8 min-h-[400px]'>
        {activeTabId === 'general' && <GeneralSettingsTab configId={configId} />}
        {activeTabId === 'sections' && <SectionBuilder configId={configId} />}
        {activeTabId === 'topics' && <TopicsSummaryTab configId={configId} />}
        {activeTabId === 'concepts-templates' && <ConceptsAndTemplatesTab configId={configId} />}
        {activeTabId === 'difficulty' && <DifficultyDistributionTab configId={configId} />}
        {activeTabId === 'rules' && <RuleFlagsTab configId={configId} onNext={handleNext} />}
        {activeTabId === 'blueprint' && <BlueprintSelectionTab configId={configId} />}
        {activeTabId === 'readiness' && (
          <GenerationReadinessPanel
            configId={configId}
            onTabChange={(id: string) => {
              const idx = WIZARD_TABS.findIndex((t) => t.id === id);
              if (idx !== -1) setActiveTabIndex(idx);
            }}
          />
        )}
        {activeTabId === 'preview' && <ConfigPreviewTab configId={configId} />}
      </div>

      {/* Bottom Action Bar */}
      <div className='flex items-center justify-between pt-6 border-t'>
        <Button variant='outline' onClick={handlePrev} disabled={activeTabIndex === 0}>
          Previous
        </Button>
        <div className='flex items-center gap-3'>
          <Button variant='secondary' onClick={() => toast.success('Draft saved successfully.')}>
            Save Draft
          </Button>

          {activeTabId === 'preview' ? (
            <div className='relative group'>
              <Button
                className='gap-2'
                onClick={generateAssembly}
                disabled={generating || !isReady}
              >
                {generating ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Play className='h-4 w-4' />
                )}
                {generating ? 'Assembling...' : 'Generate Test Assembly'}
              </Button>
              {!isReady && (
                <div className='absolute bottom-full mb-2 right-0 hidden group-hover:block bg-popover text-popover-foreground border p-3 rounded-md shadow-lg text-sm w-64 z-50'>
                  <p className='font-semibold mb-2'>Generate Assembly Disabled</p>
                  <p className='text-muted-foreground text-xs mb-2'>Missing requirements:</p>
                  <ul className='space-y-1'>
                    {healthChecks.map((check: any, i: number) => (
                      <li key={i} className='flex items-center gap-2 text-xs'>
                        {check.status === 'PASS' ? (
                          <CheckCircle2 className='w-3 h-3 text-green-500' />
                        ) : (
                          <span className='w-3 h-3 border rounded-sm' />
                        )}
                        <span className={check.status === 'PASS' ? 'line-through text-muted-foreground' : ''} title={check.message}>
                          {check.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={handleNext}>Continue</Button>
          )}
        </div>
      </div>
    </div>
  );
}
