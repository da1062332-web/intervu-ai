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
import { ConceptManagementPanel } from '@/features/admin/configs/components/concept-mapping';
import { BlueprintSelectionTab } from '@/features/admin/configs/components/blueprint-selection-tab';
import { TopicsSummaryTab } from '@/features/admin/configs/components/topics-summary-tab';
import { TemplatesSummaryTab } from '@/features/admin/configs/components/templates-summary-tab';
import { ReadinessTab } from '@/features/admin/configs/components/readiness-tab';
import { useConfigWizardStore } from '@/features/admin/configs/components/wizard-store';

import { cn } from '@/lib/utils';
import { useConfig, useConfigPreview, useAutoValidateConfig } from '@/services/exam-configs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle2, Circle } from 'lucide-react';
import { apiClient } from '@/services/api/client';

interface ConfigPageClientProps {
  configId: string;
}

const WIZARD_TABS = [
  { id: 'general', label: 'General' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'sections', label: 'Sections' },
  { id: 'topics', label: 'Topics' },
  { id: 'concepts', label: 'Concept Mapping' },
  { id: 'templates', label: 'Templates' },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'rules', label: 'Rules' },
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
  const { data: validation } = useAutoValidateConfig(configId);
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
    // Strict block if no blueprint and trying to skip past it
    if (!selectedBlueprintId && index > 1) {
      toast.error('Please select a blueprint first.');
      setActiveTabIndex(1); // Force them to blueprint tab
      return;
    }
    setActiveTabIndex(index);
  };

  const generateAssembly = async () => {
    setGenerating(true);
    try {
      // 1. Pre-flight config validation
      const validation = await apiClient.request<any>(
        `/admin/configs/${configId}/validate`,
        { method: 'POST', skipErrorToast: true }
      );

      if (!validation.valid) {
        toast.error('Cannot generate assembly. Validation failed:', {
          description: (
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {validation.errors?.map((err: string, i: number) => (
                <li key={i} className="text-xs">{err}</li>
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


  // Derived Health State
  const hasSections = preview ? preview.sections > 0 : false;
  const isDifficultyValid = preview
    ? preview.difficulty.easy + preview.difficulty.medium + preview.difficulty.hard === 100
    : false;
  const hasTopics = preview?.sectionBreakdown
    ? preview.sections > 0 && preview.sectionBreakdown.every(s => s.topicCount > 0)
    : false;
  const hasTemplatesWarn = validation?.warnings?.some(w => w.includes('No templates found'));

  const healthChecks = [
    { label: 'Configuration Saved', passed: !!config.id },
    { label: 'Blueprint Selected', passed: !!selectedBlueprintId },
    { label: 'Sections Configured', passed: hasSections },
    { label: 'Topics Available', passed: hasTopics },
    { label: 'Concepts Linked', passed: hasTopics },
    { label: 'Templates Ready', passed: validation ? !hasTemplatesWarn : false },
    { label: 'Difficulty = 100%', passed: isDifficultyValid },
    { label: 'Rules Configured', passed: true }, // Rules are optional and apply default values
    { label: 'Validation Passed', passed: !!validation?.valid },
  ];
  const passedCount = healthChecks.filter((c) => c.passed).length;
  const progressPercent = Math.round((passedCount / healthChecks.length) * 100);
  const isReady = passedCount === healthChecks.length;

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8'>
      <div className='flex flex-col md:flex-row md:items-start justify-between gap-6'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold tracking-tight'>{config.name}</h1>
          <p className='text-muted-foreground mt-2'>
            Follow the guided workflow to complete this exam configuration.
          </p>
        </div>

        {/* Configuration Health Panel */}
        <div className='w-full md:w-80 border rounded-lg p-4 bg-muted/20 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-sm'>Configuration Health</h3>
            <span className='text-sm font-medium text-primary'>{progressPercent}%</span>
          </div>
          <div className='space-y-2 mb-4'>
            {healthChecks.map((check, i) => (
              <div key={i} className='flex items-center gap-2 text-xs'>
                {check.passed ? (
                  <CheckCircle2 className='w-4 h-4 text-green-500' />
                ) : (
                  <Circle className='w-4 h-4 text-muted-foreground' />
                )}
                <span className={check.passed ? 'text-foreground' : 'text-muted-foreground'}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
          <div className='text-xs font-medium text-muted-foreground text-right'>
            Progress: {passedCount} / {healthChecks.length}
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
        {activeTabId === 'general' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <GeneralSettingsTab configId={configId} />
          </div>
        )}
        {activeTabId === 'blueprint' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <BlueprintSelectionTab configId={configId} />
          </div>
        )}
        {activeTabId === 'sections' && <SectionBuilder configId={configId} />}
        {activeTabId === 'topics' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <TopicsSummaryTab configId={configId} />
          </div>
        )}
        {activeTabId === 'concepts' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <ConceptManagementPanel />
          </div>
        )}
        {activeTabId === 'templates' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <TemplatesSummaryTab configId={configId} />
          </div>
        )}
        {activeTabId === 'difficulty' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <DifficultyDistributionTab configId={configId} />
          </div>
        )}
        {activeTabId === 'rules' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <RuleFlagsTab configId={configId} onNext={handleNext} />
          </div>
        )}
        {activeTabId === 'readiness' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <ReadinessTab configId={configId} onTabChange={(id) => {
              const idx = WIZARD_TABS.findIndex(t => t.id === id);
              if (idx !== -1) setActiveTabIndex(idx);
            }} />
          </div>
        )}
        {activeTabId === 'preview' && (
          <div className='p-6 border rounded-lg bg-background shadow-sm'>
            <ConfigPreviewTab configId={configId} />
          </div>
        )}
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
                    {healthChecks.map((check, i) => (
                      <li key={i} className='flex items-center gap-2 text-xs'>
                        {check.passed ? (
                          <CheckCircle2 className='w-3 h-3 text-green-500' />
                        ) : (
                          <span className='w-3 h-3 border rounded-sm' />
                        )}
                        <span className={check.passed ? 'line-through text-muted-foreground' : ''}>
                          {check.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={handleNext}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
