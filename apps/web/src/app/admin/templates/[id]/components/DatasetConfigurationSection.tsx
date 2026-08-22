import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Database,
  Settings2,
  Search,
  ChevronDown,
  Check,
  Link,
  Eye,
  Play,
} from 'lucide-react';
import { useDatasets, useDataset, useDatasetSchema } from '@/services/datasets/hooks';
import {
  useSaveOptionStrategy,
  useSaveTemplateDatasetConfig,
  useTemplateDatasetPreview,
  useTemplateVariables,
} from '@/services/templates/hooks';
import { useGenerateQuestion } from '@/services/question-generation/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Dataset } from '@/services/datasets/api';
import toast from 'react-hot-toast';

import { useTemplateBuilderContext } from '../context/TemplateBuilderContext';

interface DatasetConfigurationSectionProps {
  template: any;
}

export function DatasetConfigurationSection({ template }: DatasetConfigurationSectionProps) {
  const { data: datasets, isLoading: datasetsLoading } = useDatasets();
  const { mutate: saveDatasetConfig, isPending: isSavingConfig } = useSaveTemplateDatasetConfig();
  const { mutateAsync: saveOptions, isPending: isSavingDataset } = useSaveOptionStrategy();
  const { mutate: getPreview, isPending: isGeneratingPreview } = useTemplateDatasetPreview();
  const { mutate: generateQuestion, isPending: isGenerating } = useGenerateQuestion();
  const isSaving = isSavingConfig || isSavingDataset;

  const { draftState, updateDraftState } = useTemplateBuilderContext();

  const selectedDatasetId = draftState.datasetConfig?.selectedDatasetId ?? '';
  const selectionMethod = draftState.datasetConfig?.selectionMethod ?? 'RANDOM';
  const sampleSize = draftState.datasetConfig?.sampleSize ?? 1;
  const shuffle = draftState.datasetConfig?.shuffle ?? true;
  const allowReuse = draftState.datasetConfig?.allowReuse ?? false;
  const specificItemId = draftState.datasetConfig?.specificItemId ?? '';
  const variableMapping = draftState.datasetConfig?.variableMapping ?? {};

  const setSelectedDatasetId = (val: string) => {
    updateDraftState({
      datasetConfig: {
        ...(draftState.datasetConfig || {
          selectionMethod: 'RANDOM',
          sampleSize: 1,
          shuffle: true,
          allowReuse: false,
          specificItemId: '',
          variableMapping: {},
        }),
        selectedDatasetId: val,
      },
    });
  };

  const setSelectionMethod = (val: 'RANDOM' | 'SEQUENTIAL' | 'SPECIFIC') => {
    updateDraftState({
      datasetConfig: {
        ...(draftState.datasetConfig || {
          selectedDatasetId: '',
          sampleSize: 1,
          shuffle: true,
          allowReuse: false,
          specificItemId: '',
          variableMapping: {},
        }),
        selectionMethod: val,
      },
    });
  };

  const setSampleSize = (val: number) => {
    updateDraftState({
      datasetConfig: {
        ...(draftState.datasetConfig || {
          selectedDatasetId: '',
          selectionMethod: 'RANDOM',
          shuffle: true,
          allowReuse: false,
          specificItemId: '',
          variableMapping: {},
        }),
        sampleSize: val,
      },
    });
  };

  const setShuffle = (val: boolean) => {
    updateDraftState({
      datasetConfig: {
        ...(draftState.datasetConfig || {
          selectedDatasetId: '',
          selectionMethod: 'RANDOM',
          sampleSize: 1,
          allowReuse: false,
          specificItemId: '',
          variableMapping: {},
        }),
        shuffle: val,
      },
    });
  };

  const setAllowReuse = (val: boolean) => {
    updateDraftState({
      datasetConfig: {
        ...(draftState.datasetConfig || {
          selectedDatasetId: '',
          selectionMethod: 'RANDOM',
          sampleSize: 1,
          shuffle: true,
          specificItemId: '',
          variableMapping: {},
        }),
        allowReuse: val,
      },
    });
  };

  const setSpecificItemId = (val: string) => {
    updateDraftState({
      datasetConfig: {
        ...(draftState.datasetConfig || {
          selectedDatasetId: '',
          selectionMethod: 'RANDOM',
          sampleSize: 1,
          shuffle: true,
          allowReuse: false,
          variableMapping: {},
        }),
        specificItemId: val,
      },
    });
  };

  const setVariableMapping = (val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    const nextMapping = typeof val === 'function' ? val(variableMapping) : val;
    updateDraftState({
      datasetConfig: {
        ...(draftState.datasetConfig || {
          selectedDatasetId: '',
          selectionMethod: 'RANDOM',
          sampleSize: 1,
          shuffle: true,
          allowReuse: false,
          specificItemId: '',
        }),
        variableMapping: nextMapping,
      },
    });
  };

  // Track the baseline of what was successfully saved
  const [savedConfig, setSavedConfig] = useState<any>({});

  // Results
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [generatedQuestion, setGeneratedQuestion] = useState<any>(null);

  // Searchable Select State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize from template config
  useEffect(() => {
    let initialId = '';
    let configSnapshot: any = {};
    if (template?.datasetId || template?.config?.datasetId) {
      initialId = template.datasetId || template.config.datasetId;
    }
    const dsConfig = template?.config?.datasetConfig;
    if (dsConfig) {
      configSnapshot = {
        datasetId: initialId,
        selectionMethod: dsConfig.selectionMethod || 'RANDOM',
        sampleSize: dsConfig.sampleSize || 1,
        shuffle: dsConfig.shuffle ?? true,
        allowReuse: dsConfig.allowReuse ?? false,
        specificItemId: dsConfig.specificItemId || '',
        variableMapping: dsConfig.variableMapping || {},
      };
    } else {
      configSnapshot = { datasetId: initialId };
    }
    setSavedConfig(configSnapshot);

    if (template && !draftState.datasetConfig) {
      updateDraftState({
        datasetConfig: {
          selectedDatasetId: initialId,
          selectionMethod: dsConfig?.selectionMethod || 'RANDOM',
          sampleSize: dsConfig?.sampleSize || 1,
          shuffle: dsConfig?.shuffle ?? true,
          allowReuse: dsConfig?.allowReuse ?? false,
          specificItemId: dsConfig?.specificItemId || '',
          variableMapping: dsConfig?.variableMapping || {},
        },
      });
    }
  }, [template, draftState.datasetConfig, updateDraftState]);

  // Handle Dataset Change Reset
  useEffect(() => {
    if (selectedDatasetId && savedConfig.datasetId && selectedDatasetId !== savedConfig.datasetId) {
      setVariableMapping({});
      setSpecificItemId('');
      setPreviewResult(null);
      setGeneratedQuestion(null);
      // We intentionally do not update savedConfig here so `hasUnsavedChanges` becomes true
    }
  }, [selectedDatasetId, savedConfig.datasetId]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: datasetResponse, isLoading: datasetLoading } = useDataset(selectedDatasetId);
  const datasetDetails = (datasetResponse as any)?.data || datasetResponse;

  const { data: schemaResponse } = useDatasetSchema(selectedDatasetId);
  const datasetSchema = (schemaResponse as any)?.data || schemaResponse;

  const { data: varsResponse } = useTemplateVariables(template?.id);
  const templateVarsData = (varsResponse as any)?.data || varsResponse;

  const availableColumns = (() => {
    if (!datasetSchema) return [];
    if (Array.isArray(datasetSchema))
      return datasetSchema.map((c: any) =>
        typeof c === 'string' ? c : c.name || c.key || String(c),
      );
    if (datasetSchema.columns && Array.isArray(datasetSchema.columns))
      return datasetSchema.columns.map((c: any) =>
        typeof c === 'string' ? c : c.name || c.key || String(c),
      );
    if (datasetSchema.fields && Array.isArray(datasetSchema.fields))
      return datasetSchema.fields.map((c: any) =>
        typeof c === 'string' ? c : c.name || c.key || String(c),
      );
    return [];
  })();

  const templateVariables = useMemo(() => {
    // 1. Try to use variableSchema if available
    const schemaVars = template?.variableSchema;
    if (schemaVars && Array.isArray(schemaVars) && schemaVars.length > 0) {
      return schemaVars.map((v: any) => v.key || v.name || v);
    }

    // 2. Try the shared hook output
    if (templateVarsData) {
      if (Array.isArray(templateVarsData) && templateVarsData.length > 0)
        return templateVarsData.map((v: any) => v.key || v.name || v);
      if (
        templateVarsData.items &&
        Array.isArray(templateVarsData.items) &&
        templateVarsData.items.length > 0
      )
        return templateVarsData.items.map((v: any) => v.key || v.name || v);
    }

    // 3. Fallback to parsing from promptTemplate
    const templatePrompt = template?.structure?.promptTemplate || '';
    const placeholderRegex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
    const variables = [...templatePrompt.matchAll(placeholderRegex)]
      .map((match) => match[1])
      .filter(Boolean);

    return Array.from(new Set(variables));
  }, [template?.variableSchema, template?.structure?.promptTemplate, templateVarsData]);

  const isMappingComplete =
    templateVariables.length === 0 || templateVariables.every((v: any) => !!variableMapping[v]);
  const isSpecificValid = selectionMethod === 'SPECIFIC' ? !!specificItemId : true;
  const canSave = selectedDatasetId && sampleSize > 0 && isMappingComplete && isSpecificValid;

  // Track if we have unsaved changes comparing current state to savedConfig
  const hasUnsavedChanges =
    selectedDatasetId !== savedConfig.datasetId ||
    selectionMethod !== (savedConfig.selectionMethod || 'RANDOM') ||
    sampleSize !== (savedConfig.sampleSize || 1) ||
    shuffle !== (savedConfig.shuffle ?? true) ||
    allowReuse !== (savedConfig.allowReuse ?? false) ||
    (selectionMethod === 'SPECIFIC' ? specificItemId : null) !==
      (savedConfig.specificItemId || null) ||
    JSON.stringify(templateVariables.length === 0 ? {} : variableMapping) !==
      JSON.stringify(savedConfig.variableMapping || {});

  const handleSave = async () => {
    if (!template?.id || !canSave) return;

    try {
      await saveOptions({
        templateId: template.id,
        payload: {
          strategy: template?.generationStrategy || 'DATASET',
          datasetId: selectedDatasetId,
          optionsTemplate: template?.structure?.optionsTemplate || [],
        },
      });

      const finalMapping = templateVariables.length === 0 ? {} : variableMapping;

      saveDatasetConfig(
        {
          templateId: template.id,
          payload: {
            datasetId: selectedDatasetId,
            selectionMethod,
            sampleSize,
            shuffle,
            allowReuse,
            specificItemId: selectionMethod === 'SPECIFIC' ? specificItemId : null,
            variableMapping: finalMapping,
          },
        },
        {
          onSuccess: () => {
            toast.success('Dataset configuration saved successfully');
            setSavedConfig({
              datasetId: selectedDatasetId,
              selectionMethod,
              sampleSize,
              shuffle,
              allowReuse,
              specificItemId: selectionMethod === 'SPECIFIC' ? specificItemId : null,
              variableMapping: finalMapping,
            });
          },
          onError: () => {
            toast.error('Failed to save dataset configuration');
          },
        },
      );
    } catch (error) {
      toast.error('Failed to link dataset');
    }
  };

  const handleGeneratePreview = () => {
    if (!template?.id || hasUnsavedChanges) return;
    getPreview(template.id, {
      onSuccess: (data: any) => {
        setPreviewResult(data?.data || data);
        toast.success('Preview generated successfully');
      },
      onError: () => {
        toast.error('Failed to generate preview');
      },
    });
  };

  const handleGenerate = () => {
    if (!template?.id || hasUnsavedChanges) return;
    generateQuestion({ templateId: template.id, count: 1 } as any, {
      onSuccess: (data: any) => {
        setGeneratedQuestion(data?.data || data);
        toast.success('Question generated successfully');
      },
      onError: (err: any) => {
        toast.error('Failed to generate question');
      },
    });
  };

  const templateTopicIds: string[] = [
    template?.topicId,
    template?.config?.topicId,
    ...(Array.isArray(template?.config?.topics) ? template.config.topics : []),
  ].filter(Boolean) as string[];

  const templateConceptKeys: string[] = [
    template?.conceptKey,
    template?.conceptId,
    template?.config?.conceptId,
    template?.config?.conceptKey,
  ].filter(Boolean) as string[];

  const hasTopicOrConceptFilter = templateTopicIds.length > 0 || templateConceptKeys.length > 0;

  const matchedDatasets = (datasets || []).filter((ds: Dataset) => {
    const matchesSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (hasTopicOrConceptFilter) {
      const matchesTopic =
        templateTopicIds.length > 0 && ds.topicId ? templateTopicIds.includes(ds.topicId) : false;
      const matchesConcept =
        templateConceptKeys.length > 0 && ds.conceptId
          ? templateConceptKeys.includes(ds.conceptId)
          : false;
      return matchesTopic || matchesConcept;
    }
    return true;
  });

  const filteredDatasets =
    matchedDatasets.length > 0 || !hasTopicOrConceptFilter
      ? matchedDatasets
      : (datasets || []).filter((ds: Dataset) =>
          ds.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  const selectedDataset = datasets?.find((ds: Dataset) => ds.id === selectedDatasetId);
  const hasRecords = datasetDetails?.items && datasetDetails.items.length > 0;

  return (
    <TemplateSection
      title='Dataset Configuration'
      description='Connect a dataset to this template and map variables to dataset columns.'
      actions={
        <div className='flex gap-2'>
          <Button
            onClick={handleSave}
            disabled={isSaving || !canSave || !hasUnsavedChanges}
            className='min-w-[120px]'
          >
            {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save Configuration
          </Button>
        </div>
      }
    >
      <div className='space-y-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='space-y-6'>
            <Card className='shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base flex items-center gap-2'>
                  <Database className='w-4 h-4 text-indigo-500' />
                  Dataset Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <Label className='text-sm font-semibold'>Select Dataset</Label>
                  <div className='relative w-full' ref={dropdownRef}>
                    <div
                      className='flex items-center justify-between w-full p-3 border rounded-md bg-white dark:bg-gray-950 cursor-pointer hover:border-indigo-500 transition-colors'
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <div className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                        {selectedDataset ? (
                          <span className='font-medium'>{selectedDataset.name}</span>
                        ) : (
                          <span className='text-gray-400'>Search Dataset...</span>
                        )}
                      </div>
                      <ChevronDown className='w-4 h-4 text-gray-500' />
                    </div>

                    {isDropdownOpen && (
                      <div className='absolute z-10 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg overflow-hidden'>
                        <div className='p-2 border-b border-gray-100 dark:border-gray-800'>
                          <div className='relative'>
                            <Search className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                            <Input
                              placeholder='Search datasets...'
                              className='pl-8 h-8 border-none focus-visible:ring-0 shadow-none bg-gray-50 dark:bg-gray-900'
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className='max-h-60 overflow-y-auto p-1'>
                          {datasetsLoading ? (
                            <div className='flex items-center justify-center py-4 text-sm text-gray-500'>
                              <Loader2 className='w-4 h-4 animate-spin mr-2' /> Loading...
                            </div>
                          ) : filteredDatasets.length === 0 ? (
                            <div className='p-3 text-sm text-center text-gray-500'>
                              No datasets found.
                            </div>
                          ) : (
                            filteredDatasets.map((ds: Dataset) => {
                              const isMatch =
                                (templateTopicIds.length > 0 && ds.topicId
                                  ? templateTopicIds.includes(ds.topicId)
                                  : false) ||
                                (templateConceptKeys.length > 0 && ds.conceptId
                                  ? templateConceptKeys.includes(ds.conceptId)
                                  : false);
                              return (
                                <div
                                  key={ds.id}
                                  className={`flex items-center justify-between p-2 rounded-sm cursor-pointer text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${
                                    selectedDatasetId === ds.id
                                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium'
                                      : isMatch
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-gray-800 dark:text-gray-200'
                                        : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                  onClick={() => {
                                    setSelectedDatasetId(ds.id);
                                    setIsDropdownOpen(false);
                                    setSearchQuery('');
                                  }}
                                >
                                  <div>
                                    <div className='flex items-center gap-1.5'>
                                      <span>{ds.name}</span>
                                      {isMatch && (
                                        <span className='text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold'>
                                          Topic Match
                                        </span>
                                      )}
                                    </div>
                                    <div className='text-xs text-gray-400 mt-0.5'>
                                      {ds._count?.items ?? 0} Items
                                    </div>
                                  </div>
                                  {selectedDatasetId === ds.id && <Check className='w-4 h-4' />}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedDatasetId && (
              <Card className='shadow-sm'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    <Database className='w-4 h-4 text-indigo-500' />
                    Dataset Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {datasetLoading ? (
                    <div className='space-y-3'>
                      <Skeleton className='h-4 w-3/4' />
                      <Skeleton className='h-10 w-full' />
                    </div>
                  ) : datasetDetails ? (
                    <div className='space-y-4'>
                      <div>
                        <Label className='text-xs text-gray-500 uppercase tracking-wider'>
                          Name
                        </Label>
                        <div className='font-medium mt-1'>{datasetDetails.name}</div>
                      </div>
                      <div>
                        <Label className='text-xs text-gray-500 uppercase tracking-wider'>
                          Description
                        </Label>
                        <div className='text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2'>
                          {datasetDetails.description || 'No description provided.'}
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800'>
                        <div>
                          <Label className='text-xs text-gray-500 uppercase tracking-wider'>
                            Records
                          </Label>
                          <div className='text-lg font-semibold mt-0.5'>
                            {(datasetDetails.items?.length || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <Label className='text-xs text-gray-500 uppercase tracking-wider'>
                            Type
                          </Label>
                          <div className='text-sm font-medium mt-1'>{datasetDetails.type}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='text-sm text-red-500'>Failed to load dataset information.</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className='space-y-6'>
            {selectedDatasetId && (
              <Card className='shadow-sm'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    <Settings2 className='w-4 h-4 text-emerald-500' />
                    Selection Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-6'>
                    <div className='space-y-3'>
                      <Label className='text-sm font-semibold'>Selection Method</Label>
                      <div className='flex flex-col gap-3'>
                        <label className='flex items-center gap-3 text-sm cursor-pointer group'>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMethod === 'RANDOM' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}
                          >
                            {selectionMethod === 'RANDOM' && (
                              <div className='w-2 h-2 rounded-full bg-white' />
                            )}
                          </div>
                          <span className='font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors'>
                            Random Selection
                          </span>
                          <input
                            type='radio'
                            className='hidden'
                            checked={selectionMethod === 'RANDOM'}
                            onChange={() => setSelectionMethod('RANDOM')}
                          />
                        </label>

                        <label className='flex items-center gap-3 text-sm cursor-pointer group mt-2'>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMethod === 'SEQUENTIAL' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}
                          >
                            {selectionMethod === 'SEQUENTIAL' && (
                              <div className='w-2 h-2 rounded-full bg-white' />
                            )}
                          </div>
                          <span className='font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors'>
                            Sequential Selection
                          </span>
                          <input
                            type='radio'
                            className='hidden'
                            checked={selectionMethod === 'SEQUENTIAL'}
                            onChange={() => setSelectionMethod('SEQUENTIAL')}
                          />
                        </label>

                        <label className='flex items-center gap-3 text-sm cursor-pointer group mt-2'>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMethod === 'SPECIFIC' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}
                          >
                            {selectionMethod === 'SPECIFIC' && (
                              <div className='w-2 h-2 rounded-full bg-white' />
                            )}
                          </div>
                          <span className='font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors'>
                            Specific Item
                          </span>
                          <input
                            type='radio'
                            className='hidden'
                            checked={selectionMethod === 'SPECIFIC'}
                            onChange={() => setSelectionMethod('SPECIFIC')}
                          />
                        </label>

                        {selectionMethod === 'SPECIFIC' && (
                          <div className='pl-7 mt-1'>
                            <Input
                              placeholder='Item ID...'
                              value={specificItemId}
                              onChange={(e) => setSpecificItemId(e.target.value)}
                              className='h-8 text-sm'
                            />
                            {!specificItemId && (
                              <div className='text-xs text-red-500 mt-1'>
                                Required for specific selection
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800'>
                      <div className='space-y-2'>
                        <Label className='text-sm font-semibold flex items-center justify-between'>
                          Shuffle
                          <input
                            type='checkbox'
                            checked={shuffle}
                            onChange={(e) => setShuffle(e.target.checked)}
                            className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                          />
                        </Label>
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm font-semibold flex items-center justify-between'>
                          Allow Reuse
                          <input
                            type='checkbox'
                            checked={allowReuse}
                            onChange={(e) => setAllowReuse(e.target.checked)}
                            className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                          />
                        </Label>
                      </div>
                    </div>

                    <div className='space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800'>
                      <Label className='text-sm font-semibold'>Sample Size</Label>
                      <Input
                        type='number'
                        min={1}
                        max={20}
                        value={sampleSize}
                        onChange={(e) => setSampleSize(parseInt(e.target.value) || 1)}
                        className='w-full bg-gray-50 dark:bg-gray-900'
                      />
                      {sampleSize < 1 && (
                        <div className='text-xs text-red-500'>
                          Sample size must be greater than 0
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {selectedDatasetId && hasRecords && (
          <Tabs
            defaultValue={templateVariables.length > 0 ? 'mapping' : 'preview'}
            className='mt-6 w-full'
          >
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger
                value='mapping'
                disabled={templateVariables.length === 0}
                className='flex gap-2'
              >
                <Link className='w-4 h-4' /> Variable Mapping
              </TabsTrigger>
              <TabsTrigger value='preview' className='flex gap-2'>
                <Eye className='w-4 h-4' /> Live Preview
                {hasUnsavedChanges && (
                  <Badge
                    variant='outline'
                    className='ml-2 text-[10px] h-4 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                  >
                    Unsaved
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value='generate' className='flex gap-2'>
                <Play className='w-4 h-4' /> Generate Question
                {hasUnsavedChanges && (
                  <Badge
                    variant='outline'
                    className='ml-2 text-[10px] h-4 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                  >
                    Unsaved
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {templateVariables.length > 0 && (
              <TabsContent value='mapping' className='mt-4'>
                <Card className='shadow-sm'>
                  <CardHeader className='pb-3 border-b border-gray-100 dark:border-gray-800'>
                    <CardTitle className='text-base flex items-center gap-2'>
                      Variable Mapping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-4'>
                    <div className='space-y-4'>
                      {templateVariables.map((v: any, i: number) => {
                        const varKey = v;
                        const isMapped = !!variableMapping[varKey];
                        return (
                          <div key={i} className='flex items-center gap-4'>
                            <div
                              className={`w-1/3 text-sm font-medium ${isMapped ? 'text-gray-900 dark:text-gray-100' : 'text-red-500'}`}
                            >
                              {`{{${varKey}}}`}
                            </div>
                            <div className='w-2/3'>
                              <select
                                className={`w-full p-2 text-sm border rounded-md bg-gray-50 dark:bg-gray-900 focus:ring-1 focus:ring-indigo-500 ${isMapped ? 'border-gray-200 dark:border-gray-800' : 'border-red-300 dark:border-red-800'}`}
                                value={variableMapping[varKey] || ''}
                                onChange={(e) => {
                                  setVariableMapping((prev: any) => ({
                                    ...prev,
                                    [varKey]: e.target.value,
                                  }));
                                }}
                              >
                                <option value=''>-- Select Column --</option>
                                {availableColumns.map((col: string, j: number) => (
                                  <option key={j} value={col}>
                                    {col}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                      {!isMappingComplete && (
                        <div className='text-sm text-red-500 mt-2 font-medium'>
                          All template variables must be mapped before saving.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value='preview' className='mt-4'>
              <Card className='shadow-sm'>
                <CardHeader className='pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    Preview Generation Logic
                  </CardTitle>
                  <Button
                    size='sm'
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview || hasUnsavedChanges || !selectedDatasetId}
                  >
                    {isGeneratingPreview ? (
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    ) : (
                      <Eye className='w-4 h-4 mr-2' />
                    )}
                    Generate Preview
                  </Button>
                </CardHeader>
                <CardContent className='pt-4'>
                  {hasUnsavedChanges ? (
                    <div className='text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md flex items-center justify-center font-medium border border-amber-200 dark:border-amber-900'>
                      Save configuration to enable preview generation.
                    </div>
                  ) : !previewResult ? (
                    <div className='text-sm text-gray-500 text-center py-4'>
                      Click generate to preview the compiled prompt and dataset variables.
                    </div>
                  ) : (
                    <div className='space-y-4 text-sm text-gray-700 dark:text-gray-300'>
                      {previewResult.variables && (
                        <div>
                          <span className='font-semibold block mb-1'>Injected Variables:</span>
                          <pre className='p-3 bg-gray-50 dark:bg-gray-900 rounded border overflow-x-auto text-xs'>
                            {JSON.stringify(previewResult.variables, null, 2)}
                          </pre>
                        </div>
                      )}
                      {previewResult.datasetItem && (
                        <div>
                          <span className='font-semibold block mb-1'>Dataset Item ID:</span>
                          <div className='p-2 bg-gray-50 dark:bg-gray-900 rounded border text-xs'>
                            {previewResult.datasetItem.id ||
                              JSON.stringify(previewResult.datasetItem)}
                          </div>
                        </div>
                      )}
                      {previewResult.compiledPrompt && (
                        <div>
                          <span className='font-semibold block mb-1'>Compiled Prompt:</span>
                          <div className='p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded border border-indigo-100 dark:border-indigo-900 whitespace-pre-wrap'>
                            {previewResult.compiledPrompt}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='generate' className='mt-4'>
              <Card className='shadow-sm'>
                <CardHeader className='pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    Test Generation
                  </CardTitle>
                  <Button
                    size='sm'
                    onClick={handleGenerate}
                    disabled={isGenerating || hasUnsavedChanges || !selectedDatasetId}
                  >
                    {isGenerating ? (
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    ) : (
                      <Play className='w-4 h-4 mr-2' />
                    )}
                    Generate Question
                  </Button>
                </CardHeader>
                <CardContent className='pt-4'>
                  {hasUnsavedChanges ? (
                    <div className='text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md flex items-center justify-center font-medium border border-amber-200 dark:border-amber-900'>
                      Save configuration to enable question generation.
                    </div>
                  ) : !generatedQuestion ? (
                    <div className='text-sm text-gray-500 text-center py-4'>
                      Click generate to test the full pipeline and run a live generation.
                    </div>
                  ) : (
                    <div className='space-y-4 text-sm text-gray-700 dark:text-gray-300'>
                      {generatedQuestion.question && (
                        <div>
                          <span className='font-semibold block mb-1 text-emerald-700 dark:text-emerald-400'>
                            Generated Question:
                          </span>
                          <div className='p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-900 whitespace-pre-wrap'>
                            <h3 className='font-bold text-base mb-2'>
                              {generatedQuestion.question.questionText}
                            </h3>
                            {generatedQuestion.question.options &&
                              generatedQuestion.question.options.length > 0 && (
                                <ul className='list-disc pl-5 mt-2 space-y-1'>
                                  {generatedQuestion.question.options.map(
                                    (opt: any, idx: number) => {
                                      const optText =
                                        typeof opt === 'object' && opt !== null
                                          ? opt.text ??
                                            opt.optionText ??
                                            opt.value ??
                                            opt.label ??
                                            JSON.stringify(opt)
                                          : String(opt);
                                      const isCorrect =
                                        (typeof opt === 'object' &&
                                          opt !== null &&
                                          opt.isCorrect === true) ||
                                        generatedQuestion.question
                                          .correctAnswer === opt ||
                                        generatedQuestion.question
                                          .correctAnswer === optText;

                                      return (
                                        <li
                                          key={idx}
                                          className={
                                            isCorrect
                                              ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                              : ''
                                          }
                                        >
                                          {optText}
                                        </li>
                                      );
                                    },
                                  )}
                                </ul>
                              )}
                            <div className='mt-4 text-xs text-gray-500 border-t border-emerald-100 dark:border-emerald-900/50 pt-2'>
                              Explanation: {generatedQuestion.question.explanation}
                            </div>
                          </div>
                        </div>
                      )}

                      {generatedQuestion.validationReport && (
                        <div className='mt-6 border-t pt-4'>
                          <span className='font-semibold block mb-2'>Validation Report</span>
                          <div
                            className={`p-3 rounded border text-xs flex gap-4 items-start ${generatedQuestion.validationReport.valid ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900/50' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/50'}`}
                          >
                            <div className='flex-1'>
                              <strong>Errors:</strong>
                              {generatedQuestion.validationReport.errors?.length ? (
                                <ul className='list-disc pl-4 mt-1'>
                                  {generatedQuestion.validationReport.errors.map(
                                    (e: string, i: number) => (
                                      <li key={i}>{e}</li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <span className='ml-2'>None</span>
                              )}
                            </div>
                            <div className='flex-1 border-l pl-4 border-black/10 dark:border-white/10'>
                              <strong>Warnings:</strong>
                              {generatedQuestion.validationReport.warnings?.length ? (
                                <ul className='list-disc pl-4 mt-1'>
                                  {generatedQuestion.validationReport.warnings.map(
                                    (w: string, i: number) => (
                                      <li key={i}>{w}</li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <span className='ml-2'>None</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </TemplateSection>
  );
}
