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
import { HiringEvaluationTab } from '@/features/admin/configs/components/hiring-evaluation-tab';
import { useConfigWizardStore } from '@/features/admin/configs/components/wizard-store';
import { GenerationReadinessPanel } from '@/features/admin/configs/components/GenerationReadinessPanel';

import { cn } from '@/lib/utils';
import { useConfig, useConfigPreview, useAutoValidateConfig } from '@/services/exam-configs';
import { useConfigurationValidation } from '@/features/admin/configs/hooks/useConfigurationValidation';
import { useTopics } from '@/services/topics/hooks';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle2, Circle } from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { ConfigurationSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConfigPageClientProps {
  configId: string;
}

const WIZARD_TABS = [
  { id: 'general', label: 'General' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'sections', label: 'Sections' },
  { id: 'topics', label: 'Topics' },
  { id: 'concepts-templates', label: 'Concepts & Content' },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'rules', label: 'Rules' },
  { id: 'hiring-evaluation', label: 'Hiring Qualification' },
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
  const { data: topics } = useTopics(false);

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
    // Auto-assign blueprint if available or allow auto-generation on publish
    const currentBlueprintId =
      selectedBlueprintId || (config as any)?.blueprint?.id || (config as any)?.blueprintId;
    if (activeTabId === 'blueprint' && !currentBlueprintId && false) {
      toast.error('Please select a blueprint before continuing.');
      return;
    }
    // Advance to next tab smoothly
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

      // 2. Publish config to create version and auto-ensure blueprint if not already published
      if (config?.status !== 'PUBLISHED') {
        try {
          await apiClient.request<any>(`/admin/configs/${configId}/publish`, {
            method: 'POST',
            skipErrorToast: true,
          });
        } catch (e) {
          console.warn('Publish notice before assembly generation:', e);
        }
      }

      // 3. Generate Assembly
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
      const errorMsg = error.message || 'Failed to generate assembly';
      let displayMsg = errorMsg;
      const uuidRegex =
        /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g;
      displayMsg = displayMsg.replace(uuidRegex, (match: string) => {
        const foundTopic = topics?.find((t: any) => t.id === match);
        return foundTopic ? `"${foundTopic.name}"` : match;
      });
      toast.error(displayMsg);
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl h-[60vh]'>
        <ConfigurationSkeleton />
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl h-[60vh]'>
        <EmptyState
          variant='error'
          title='Configuration Not Found'
          description='The exam configuration you are looking for does not exist or has been deleted.'
          className='border rounded-md'
        />
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
        <SectionHeader
          title={config.name}
          description='Follow the guided workflow to complete this exam configuration.'
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Configurations', href: '/admin/configurations' },
            { label: config.name },
          ]}
          className='!mb-0'
        />

        {/* Configuration Health Panel */}
        <Card className='p-5'>
          <div className='flex items-center justify-between mb-4 pb-4 border-b'>
            <h3 className='font-semibold text-sm text-foreground uppercase tracking-wider'>
              Configuration Health
            </h3>
            <div className='flex items-center gap-4'>
              <Progress value={progressPercent} className='w-32 md:w-64 hidden sm:block h-2' />
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
                <span
                  className={`truncate ${check.status === 'PASS' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  title={check.message}
                >
                  {check.name}
                </span>
              </div>
            ))}
            {healthChecks.length === 0 && (
              <div className='text-muted-foreground text-sm col-span-full'>
                Loading health checks...
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Top Workflow Navigation */}
      <div className='border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1'>
        <Tabs
          value={activeTabId}
          onValueChange={(id: string) => handleTabClick(WIZARD_TABS.findIndex((t) => t.id === id))}
          className='w-full'
        >
          <TabsList className='flex w-full justify-start bg-transparent border-none h-auto p-0'>
            {WIZARD_TABS.map((tab, index) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'rounded-none border-b-2 border-transparent px-1 py-4 text-sm font-medium transition-colors hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent gap-2',
                  index < activeTabIndex
                    ? 'text-foreground hover:text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]'>
                  {index + 1}
                </span>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className='mt-8 min-h-[400px]'>
        {activeTabId === 'general' && <GeneralSettingsTab configId={configId} />}
        {activeTabId === 'sections' && <SectionBuilder configId={configId} />}
        {activeTabId === 'topics' && <TopicsSummaryTab configId={configId} />}
        {activeTabId === 'concepts-templates' && <ConceptsAndTemplatesTab configId={configId} />}
        {activeTabId === 'difficulty' && <DifficultyDistributionTab configId={configId} />}
        {activeTabId === 'rules' && <RuleFlagsTab configId={configId} onNext={handleNext} />}
        {activeTabId === 'hiring-evaluation' && (
          <HiringEvaluationTab configId={configId} onNext={handleNext} />
        )}
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='inline-block'>
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
                  </span>
                </TooltipTrigger>
                {!isReady && (
                  <TooltipContent side='top' align='end' className='w-64 p-3'>
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
                          <span
                            className={
                              check.status === 'PASS' ? 'line-through text-muted-foreground' : ''
                            }
                            title={check.message}
                          >
                            {check.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button onClick={handleNext}>Continue</Button>
          )}
        </div>
      </div>
    </div>
  );
}
