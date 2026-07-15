import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, 
  Database, 
  Settings2, 
  Search, 
  ChevronDown, 
  Check, 
  ExternalLink,
  Activity,
  PlayCircle,
  AlertCircle,
  RefreshCw,
  Edit
} from 'lucide-react';
import { useDatasets, useDataset } from '@/services/datasets/hooks';
import { useUpdateTemplate, useGeneratePreview } from '@/services/templates/hooks';
import type { Dataset } from '@/services/datasets/api';
import { toast } from 'sonner';

interface DatasetConfigurationSectionProps {
  template: any;
}

export function DatasetConfigurationSection({ template }: DatasetConfigurationSectionProps) {
  // Queries & Mutations
  const { data: datasets, isLoading: datasetsLoading, error: datasetsError } = useDatasets();
  const { mutate: updateTemplate, isPending: isSaving } = useUpdateTemplate();
  const { mutate: generatePreview, isPending: isGenerating, data: previewResult, error: previewError } = useGeneratePreview();

  // Local State
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  
  // Generation Settings State
  const [selectionMode, setSelectionMode] = useState<'RANDOM' | 'SEQUENTIAL'>('RANDOM');
  const [itemsPerQuestion, setItemsPerQuestion] = useState<number>(1);
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);

  // Dropdown UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize state from template config on mount
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

  // Handle clicking outside the dataset dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch selected dataset details dynamically
  const { 
    data: datasetDetails, 
    isLoading: datasetLoading,
    error: datasetError,
    refetch: refetchDataset
  } = useDataset(selectedDatasetId);

  // Handlers
  const handleSave = () => {
    if (!template?.id) return;
    
    updateTemplate({
      templateId: template.id,
      payload: {
        datasetId: selectedDatasetId,
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
        toast.error("Unable to save configuration.");
      }
    });
  };

  const handleGeneratePreview = () => {
    if (!template?.id) return;
    generatePreview({
      templateId: template.id,
      payload: {
        previewPayload: {} // Dataset strategy handles the payload internally
      }
    });
  };

  // Derived variables
  const filteredDatasets = datasets?.filter((ds: Dataset) => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedDataset = datasets?.find((ds: Dataset) => ds.id === selectedDatasetId);
  const hasRecords = datasetDetails && datasetDetails.items && datasetDetails.items.length > 0;
  
  // Health checks
  const isDatasetSelected = !!selectedDatasetId;
  const isDatasetPopulated = !!hasRecords;
  const isConfigured = itemsPerQuestion > 0 && !!selectionMode;
  const isReadyForPreview = isDatasetSelected && isDatasetPopulated && isConfigured;

  // Empty State (No datasets exist in the system)
  if (!datasetsLoading && (!datasets || datasets.length === 0)) {
    return (
      <TemplateSection title="Dataset Configuration" description="Configure dataset parameters for generation.">
        <Card className="w-full shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4">
            <Database className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No datasets available</h3>
            <p className="text-gray-500 mt-2 text-center max-w-sm mb-6">
              Create your first dataset to use the Dataset Strategy in this template.
            </p>
            <Link href="/admin/datasets">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Go to Dataset Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </TemplateSection>
    );
  }

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return rtf.format(daysDifference, 'day');
  };

  return (
    <TemplateSection
      title="Dataset Configuration"
      description="Connect a dataset to this template and configure how items are selected for question generation."
    >
      <div className="flex flex-col space-y-8 max-w-4xl">
        
        {/* CARD 1: Dataset Summary / Selection */}
        <Card className="shadow-sm overflow-visible">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              Dataset Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {datasetsError ? (
              <div className="flex items-center justify-between p-4 bg-red-50 text-red-700 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Unable to load datasets.</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative w-full" ref={dropdownRef}>
                  <div 
                    className="flex items-center justify-between w-full p-3 border rounded-md bg-white dark:bg-gray-950 cursor-pointer hover:border-indigo-500 transition-colors"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      {selectedDataset ? (
                        <span className="font-medium">Change Dataset...</span>
                      ) : (
                        <span className="text-gray-400">Select a Dataset...</span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
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
                      <div className="max-h-60 overflow-y-auto p-1 bg-white dark:bg-gray-950">
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
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                  <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{ds.type || 'GENERAL'}</span>
                                  <span>{ds._count?.items ?? 0} Items</span>
                                </div>
                              </div>
                              {selectedDatasetId === ds.id && <Check className="w-4 h-4" />}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {datasetLoading ? (
                  <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : datasetError ? (
                  <div className="text-sm text-red-500 py-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Failed to load dataset details.
                  </div>
                ) : datasetDetails ? (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Selected Dataset</h3>
                    <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                      <div className="text-gray-500">Dataset</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{datasetDetails.name}</div>
                      
                      <div className="text-gray-500">Type</div>
                      <div>{datasetDetails.type || 'Reading Passage'}</div>
                      
                      <div className="text-gray-500">Records</div>
                      <div>{(datasetDetails.items?.length || 0).toLocaleString()}</div>
                      
                      <div className="text-gray-500">Last Updated</div>
                      <div>{getRelativeTime(datasetDetails.updatedAt)}</div>
                      
                      <div className="text-gray-500">Status</div>
                      <div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                          Active
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center gap-3">
                      <Link href={`/admin/datasets/${datasetDetails.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="w-3.5 h-3.5" /> Open Dataset
                        </Button>
                      </Link>
                      <Link href={`/admin/datasets/${datasetDetails.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit className="w-3.5 h-3.5" /> Manage Dataset
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => refetchDataset()}>
                        <RefreshCw className={`w-3.5 h-3.5 ${datasetLoading ? 'animate-spin' : ''}`} /> Refresh Dataset
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 text-center text-sm text-gray-500">
                    Select a dataset from the dropdown above to view its details.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedDatasetId && (
          <>
            {/* CARD 2: Generation Settings */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-emerald-500" />
                    Generation Settings
                  </div>
                  <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700">
                    {isSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                    Save Settings
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Selection Mode</Label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 text-sm cursor-pointer group" onClick={() => setSelectionMode('RANDOM')}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMode === 'RANDOM' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}>
                          {selectionMode === 'RANDOM' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Random</span>
                      </label>
                      <label className="flex items-center gap-3 text-sm cursor-pointer group" onClick={() => setSelectionMode('SEQUENTIAL')}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMode === 'SEQUENTIAL' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}>
                          {selectionMode === 'SEQUENTIAL' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Sequential</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Items Per Question</Label>
                    <Input 
                      type="number" 
                      min={1}
                      value={itemsPerQuestion} 
                      onChange={(e) => setItemsPerQuestion(parseInt(e.target.value) || 1)}
                      className="max-w-[120px]"
                    />
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label className="flex items-center gap-3 text-sm cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${shuffle ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-500'}`}>
                         {shuffle && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Shuffle Records</span>
                      {/* Hidden checkbox for accessibility */}
                      <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="hidden" />
                    </label>

                    <label className="flex items-center gap-3 text-sm cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allowDuplicates ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-500'}`}>
                         {allowDuplicates && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Allow Duplicate Records</span>
                      <input type="checkbox" checked={allowDuplicates} onChange={(e) => setAllowDuplicates(e.target.checked)} className="hidden" />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: Dataset Preview Section */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-4 bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Dataset Preview Table</span>
                </CardTitle>
              </CardHeader>
              
              <div className="flex flex-col">
                {datasetLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center text-gray-500 space-y-4">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="text-sm font-medium">Loading preview records...</span>
                  </div>
                ) : hasRecords && datasetDetails ? (
                  <div className="w-full">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 font-medium w-12 text-center">#</th>
                            <th className="px-4 py-3 font-medium">Content</th>
                            <th className="px-4 py-3 font-medium w-32">Topic</th>
                            <th className="px-4 py-3 font-medium w-24">Difficulty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {datasetDetails.items.slice(0, 5).map((item: any, idx: number) => {
                            let contentStr = item.content || '';
                            try {
                              const parsed = JSON.parse(contentStr);
                              if (parsed && typeof parsed === 'object') {
                                // Extract first string value or truncate object string representation
                                contentStr = Object.values(parsed).find(v => typeof v === 'string') || JSON.stringify(parsed);
                              }
                            } catch (e) {
                              // not json, leave as is
                            }

                            return (
                              <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-gray-400 text-center">{idx + 1}</td>
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium truncate max-w-[400px]" title={contentStr}>
                                  {contentStr || <span className="text-gray-400 italic">Empty content</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                  {item.topic || 'General'}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                  {item.difficultyLevel || 'Medium'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
                    <Database className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="font-medium text-gray-900 dark:text-gray-100">Dataset contains no records.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* CARD 4: Generated Question Preview */}
            <Card className="shadow-sm border-indigo-100 dark:border-indigo-900">
              <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900 pb-4">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                      <PlayCircle className="w-4 h-4 text-indigo-500" />
                      Generated Question Preview
                    </CardTitle>
                    <CardDescription className="text-indigo-700/70 dark:text-indigo-300/70 mt-1">
                      Test generation using {datasetDetails?.name}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleGeneratePreview} 
                    disabled={!isReadyForPreview || isGenerating || isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                    Generate Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isGenerating ? (
                  <div className="p-16 flex flex-col items-center justify-center text-indigo-500 bg-white dark:bg-gray-950 rounded-b-lg">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm font-medium">Generating preview from dataset...</p>
                  </div>
                ) : previewError ? (
                  <div className="p-12 text-center text-red-600 flex flex-col items-center justify-center bg-white dark:bg-gray-950 rounded-b-lg">
                    <AlertCircle className="w-8 h-8 mb-4 text-red-500" />
                    <p className="font-medium">Unable to generate preview.</p>
                    <p className="text-sm opacity-80 mt-1">Check that you have saved valid generation settings.</p>
                  </div>
                ) : previewResult?.success && previewResult?.data && previewResult.data.length > 0 ? (
                  <div className="p-6 md:p-8 bg-white dark:bg-gray-950 rounded-b-lg">
                    <div className="space-y-8 max-w-4xl mx-auto">
                      {previewResult.data.map((preview: any, index: number) => {
                         const content = preview.content || preview.question || preview;
                         const rawDatasetRecord = preview.datasetRecord || preview.sourceRecord; // If backend returns it
                         const options = content.options || [];
                         const answer = content.answer || content.correctAnswer;
                         const explanation = content.explanation;

                         return (
                          <div key={index} className="space-y-6">
                            
                            {/* Display Dataset Record if available in response */}
                            {rawDatasetRecord && (
                              <div className="space-y-2">
                                <Label className="text-xs uppercase text-gray-500 tracking-wider">Dataset Record</Label>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 font-mono">
                                  {typeof rawDatasetRecord === 'string' ? rawDatasetRecord : JSON.stringify(rawDatasetRecord, null, 2)}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label className="text-xs uppercase text-indigo-600 dark:text-indigo-400 tracking-wider font-semibold">Generated Question</Label>
                              <div className="p-5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-base whitespace-pre-wrap font-medium shadow-sm">
                                {content.text || content.prompt || (typeof content === 'string' ? content : JSON.stringify(content, null, 2))}
                              </div>
                            </div>

                            {options && options.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs uppercase text-gray-500 tracking-wider">Options</Label>
                                <div className="grid gap-2">
                                  {options.map((opt: any, i: number) => (
                                    <div key={i} className="p-3 border rounded-md text-sm bg-white dark:bg-gray-950 flex items-start gap-3">
                                      <span className="font-mono text-gray-400 font-bold">{String.fromCharCode(65 + i)}</span>
                                      <span>{opt.text || opt}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(answer || explanation) && (
                              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50 space-y-4">
                                {answer && (
                                  <div>
                                    <Label className="text-xs uppercase text-emerald-700 dark:text-emerald-400 tracking-wider font-semibold">Answer</Label>
                                    <div className="font-medium text-emerald-900 dark:text-emerald-100 mt-1 text-sm">{typeof answer === 'string' ? answer : JSON.stringify(answer)}</div>
                                  </div>
                                )}
                                {explanation && (
                                  <div>
                                    <Label className="text-xs uppercase text-emerald-700 dark:text-emerald-400 tracking-wider font-semibold">Explanation</Label>
                                    <div className="text-sm text-emerald-800/90 dark:text-emerald-200/90 mt-1">{typeof explanation === 'string' ? explanation : JSON.stringify(explanation)}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                         )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center text-gray-500 bg-gray-50 dark:bg-gray-900/30 rounded-b-lg border-t border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-gray-900 dark:text-gray-100">No preview generated yet.</p>
                    <ol className="text-sm mt-3 space-y-1 text-left inline-block text-gray-600 dark:text-gray-400">
                      <li>1. Select a dataset above.</li>
                      <li>2. Configure generation settings.</li>
                      <li>3. Click <span className="font-semibold text-gray-900 dark:text-gray-100">Generate Preview</span>.</li>
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CARD 5: Configuration Health */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Configuration Health
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-3 text-center rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isDatasetSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className={`text-sm ${isDatasetSelected ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                      Dataset Selected
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 text-center rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isDatasetPopulated ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className={`text-sm ${isDatasetPopulated ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                      Dataset Contains Records
                    </span>
                  </div>

                  <div className="flex flex-col items-center p-3 text-center rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className={`text-sm ${isConfigured ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                      Generation Settings Saved
                    </span>
                  </div>

                  <div className="flex flex-col items-center p-3 text-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isReadyForPreview ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className={`text-sm ${isReadyForPreview ? 'font-semibold text-indigo-700 dark:text-indigo-400' : 'text-gray-500'}`}>
                      Ready For Preview
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </>
        )}
      </div>
    </TemplateSection>
  );
}
