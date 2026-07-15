import React, { useState, useEffect, useRef } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, Settings2, Search, ChevronDown, Check, CheckCircle2, Circle } from 'lucide-react';
import { useDatasets, useDataset } from '@/services/datasets/hooks';
import { useUpdateTemplate, useSaveOptionStrategy } from '@/services/templates/hooks';
import type { Dataset } from '@/services/datasets/api';
import toast from 'react-hot-toast';

interface DatasetConfigurationSectionProps {
  template: any;
}

export function DatasetConfigurationSection({ template }: DatasetConfigurationSectionProps) {
  const { data: datasets, isLoading: datasetsLoading } = useDatasets();
  const { mutate: updateTemplate, isPending: isUpdatingConfig } = useUpdateTemplate();
  const { mutateAsync: saveOptions, isPending: isSavingDataset } = useSaveOptionStrategy();
  const isSaving = isUpdatingConfig || isSavingDataset;

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  
  // Generation Settings
  const [selectionMode, setSelectionMode] = useState<'RANDOM' | 'SEQUENTIAL'>('RANDOM');
  const [itemsPerQuestion, setItemsPerQuestion] = useState<number>(1);
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);

  // Searchable Select State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize from template config
  useEffect(() => {
    if (template?.datasetId || template?.config?.datasetId) {
      setSelectedDatasetId(template.datasetId || template.config.datasetId);
    }
    const dsConfig = template?.config?.datasetConfig;
    if (dsConfig) {
      if (dsConfig.selectionMode) setSelectionMode(dsConfig.selectionMode);
      if (dsConfig.itemsPerQuestion) setItemsPerQuestion(dsConfig.itemsPerQuestion);
      if (dsConfig.shuffle !== undefined) setShuffle(dsConfig.shuffle);
      if (dsConfig.allowDuplicates !== undefined) setAllowDuplicates(dsConfig.allowDuplicates);
    }
  }, [template]);

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

  const handleSave = async () => {
    if (!template?.id) return;
    
    try {
      // Step 1: Save options strategy to link dataset to the template 
      // (This is how the backend links datasets)
      await saveOptions({
        templateId: template.id,
        payload: {
          strategy: template?.generationStrategy || 'DATASET',
          datasetId: selectedDatasetId,
          optionsTemplate: template?.structure?.optionsTemplate || []
        }
      });

      // Step 2: Save the specific configuration logic
      updateTemplate({
        templateId: template.id,
        payload: {
          config: {
            ...(template.config || {}),
            datasetConfig: {
              selectionMode,
              itemsPerQuestion,
              shuffle,
              allowDuplicates
            }
          }
        }
      }, {
        onSuccess: () => {
          toast.success("Dataset configuration saved successfully");
        },
        onError: () => {
          toast.error("Failed to save dataset configuration");
        }
      });
    } catch (error) {
      toast.error("Failed to link dataset");
    }
  };

  const filteredDatasets = datasets?.filter((ds: Dataset) => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedDataset = datasets?.find((ds: Dataset) => ds.id === selectedDatasetId);

  // Health checks
  const isDatasetSelected = !!selectedDatasetId;
  const isDatasetConnected = template?.datasetId === selectedDatasetId;
  const hasRecords = datasetDetails?.items && datasetDetails.items.length > 0;
  const isItemsValid = itemsPerQuestion > 0;
  const isReadyForPreview = isDatasetConnected && hasRecords && isItemsValid;

  return (
    <TemplateSection
      title="Dataset Configuration"
      description="Connect a dataset to this template and configure how items are selected for question generation."
      actions={
        <Button onClick={handleSave} disabled={isSaving || !selectedDatasetId} className="min-w-[120px]">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Configuration
        </Button>
      }
    >
      <div className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            
            {/* Card 1: Dataset Selection */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Dataset Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Select Dataset</Label>
                  <div className="relative w-full" ref={dropdownRef}>
                    <div 
                      className="flex items-center justify-between w-full p-3 border rounded-md bg-white dark:bg-gray-950 cursor-pointer hover:border-indigo-500 transition-colors"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        {selectedDataset ? (
                          <span className="font-medium">{selectedDataset.name}</span>
                        ) : (
                          <span className="text-gray-400">Search Dataset...</span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                              placeholder="Search datasets..." 
                              className="pl-8 h-8 border-none focus-visible:ring-0 shadow-none bg-gray-50 dark:bg-gray-900"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                          {datasetsLoading ? (
                            <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
                            </div>
                          ) : filteredDatasets.length === 0 ? (
                            <div className="p-3 text-sm text-center text-gray-500">No datasets found.</div>
                          ) : (
                            filteredDatasets.map((ds: Dataset) => (
                              <div 
                                key={ds.id}
                                className={`flex items-center justify-between p-2 rounded-sm cursor-pointer text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${selectedDatasetId === ds.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                onClick={() => {
                                  setSelectedDatasetId(ds.id);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                              >
                                <div>
                                  <div>{ds.name}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">{ds._count?.items ?? 0} Items</div>
                                </div>
                                {selectedDatasetId === ds.id && <Check className="w-4 h-4" />}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Dataset Details */}
            {selectedDatasetId && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-500" />
                    Dataset Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {datasetLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-10 w-full" />
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  ) : datasetDetails ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wider">Name</Label>
                        <div className="font-medium mt-1">{datasetDetails.name}</div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wider">Description</Label>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {datasetDetails.description || 'No description provided.'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <Label className="text-xs text-gray-500 uppercase tracking-wider">Records</Label>
                          <div className="text-lg font-semibold mt-0.5">
                            {(datasetDetails.items?.length || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500 uppercase tracking-wider">Status</Label>
                          <div className="mt-1">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <div>
                           <Label className="text-xs text-gray-500 uppercase tracking-wider">Created</Label>
                           <div className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                             {new Date(datasetDetails.createdAt).toLocaleDateString()}
                           </div>
                        </div>
                        <div>
                           <Label className="text-xs text-gray-500 uppercase tracking-wider">Updated</Label>
                           <div className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                             {new Date(datasetDetails.updatedAt).toLocaleDateString()}
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-500">Failed to load dataset information.</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Card 3: Generation Rules */}
            {selectedDatasetId && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-emerald-500" />
                    Generation Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Selection Mode</Label>
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMode === 'RANDOM' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}>
                            {selectionMode === 'RANDOM' && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Random Selection</span>
                          <input type="radio" className="hidden" checked={selectionMode === 'RANDOM'} onChange={() => setSelectionMode('RANDOM')} />
                        </label>
                        <p className="text-xs text-gray-500 pl-7 -mt-2">Randomly picks items from the dataset each time.</p>
                        
                        <label className="flex items-center gap-3 text-sm cursor-pointer group mt-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMode === 'SEQUENTIAL' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}>
                            {selectionMode === 'SEQUENTIAL' && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Sequential Selection</span>
                          <input type="radio" className="hidden" checked={selectionMode === 'SEQUENTIAL'} onChange={() => setSelectionMode('SEQUENTIAL')} />
                        </label>
                        <p className="text-xs text-gray-500 pl-7 -mt-2">Picks items in order, looping back to the start when exhausted.</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Label className="text-sm font-semibold">Items per Question</Label>
                      <div className="flex items-center gap-4">
                        <Input 
                          type="number" 
                          min={1} 
                          max={20} 
                          value={itemsPerQuestion} 
                          onChange={(e) => setItemsPerQuestion(parseInt(e.target.value) || 1)}
                          className="w-24 bg-gray-50 dark:bg-gray-900"
                        />
                        <span className="text-sm text-gray-500">Number of records injected at once</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Health Checklist */}
            {selectedDatasetId && (
              <Card className="shadow-sm border-indigo-100 dark:border-indigo-900">
                <CardHeader className="pb-3 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <CardTitle className="text-base flex items-center gap-2">
                    Dataset Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {isDatasetSelected ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                    <span className={`text-sm ${isDatasetSelected ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>Dataset Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasRecords ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                    <span className={`text-sm ${hasRecords ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>Records Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isItemsValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                    <span className={`text-sm ${isItemsValid ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>Items Per Question Valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDatasetConnected ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                    <span className={`text-sm ${isDatasetConnected ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>Dataset Connected to Template</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    {isReadyForPreview ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                    <span className={`text-sm font-medium ${isReadyForPreview ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>Ready for Preview</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Card 4: Preview Records */}
        {selectedDatasetId && hasRecords && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  Preview Records (First 5)
                </CardTitle>
                <Badge variant="outline" className="text-xs text-gray-500 font-normal">
                  Showing 5 of {datasetDetails.items.length} records
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {datasetDetails.items.slice(0, 5).map((item: any, i: number) => (
                  <div key={item.id} className="p-4 rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.difficulty && (
                          <span className="text-[10px] uppercase font-bold text-gray-500 px-2 py-0.5 rounded-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                            {item.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TemplateSection>
  );
}
