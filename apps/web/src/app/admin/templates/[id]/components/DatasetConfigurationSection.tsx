import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Database, Settings2, Search, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { useDatasets, useDataset } from '@/services/datasets/hooks';
import { useUpdateTemplate } from '@/services/templates/hooks';
import type { Dataset } from '@/services/datasets/api';

interface DatasetConfigurationSectionProps {
  template: any;
}

export function DatasetConfigurationSection({ template }: DatasetConfigurationSectionProps) {
  const { data: datasets, isLoading: datasetsLoading } = useDatasets();
  const { mutate: updateTemplate, isPending: isSaving, isSuccess: isSaveSuccess } = useUpdateTemplate();

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  
  // Generation Settings
  const [selectionMode, setSelectionMode] = useState<'RANDOM' | 'SEQUENTIAL'>('RANDOM');
  const [itemsPerQuestion, setItemsPerQuestion] = useState<number>(5);
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

  const { data: datasetDetails, isLoading: datasetLoading } = useDataset(selectedDatasetId);

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
    });
  };

  const filteredDatasets = datasets?.filter((ds: Dataset) => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedDataset = datasets?.find((ds: Dataset) => ds.id === selectedDatasetId);

  return (
    <TemplateSection
      title="Dataset Configuration"
      description="Connect a dataset to this template and configure how items are selected for question generation."
      actions={
        <Button onClick={handleSave} disabled={isSaving || !selectedDatasetId} className="min-w-[120px]">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaveSuccess && !isSaving ? 'Saved!' : 'Save Configuration'}
        </Button>
      }
    >
      <div className="space-y-6">
        
        {/* Dataset Selection */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Select Dataset</Label>
          <div className="relative w-full max-w-xl" ref={dropdownRef}>
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

        {selectedDatasetId && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dataset Information Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-500" />
                    Dataset Information
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

              {/* Generation Configuration Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-emerald-500" />
                    Generation Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Selection Mode</Label>
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMode === 'RANDOM' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}>
                            {selectionMode === 'RANDOM' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Random</span>
                          <span className="text-xs text-gray-400 ml-auto hidden sm:inline-block">Picks items arbitrarily</span>
                        </label>
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMode === 'SEQUENTIAL' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}>
                            {selectionMode === 'SEQUENTIAL' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Sequential</span>
                          <span className="text-xs text-gray-400 ml-auto hidden sm:inline-block">Picks items in order</span>
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
                    
                    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <label className="flex items-center gap-3 text-sm cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${shuffle ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-500'}`}>
                           {shuffle && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Shuffle Dataset</span>
                      </label>

                      <label className="flex items-center gap-3 text-sm cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allowDuplicates ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-500'}`}>
                           {allowDuplicates && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Allow Duplicate Records</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dataset Preview Section */}
            <Card className="shadow-sm w-full overflow-hidden">
              <CardHeader className="pb-4 bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Preview of Dataset Items</span>
                </CardTitle>
              </CardHeader>
              
              {datasetLoading ? (
                <div className="p-8 flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">Loading preview records...</span>
                </div>
              ) : datasetDetails && datasetDetails.items && datasetDetails.items.length > 0 ? (
                <div className="w-full">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 font-medium">Row</th>
                        <th className="px-6 py-3 font-medium">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {datasetDetails.items.slice(0, 5).map((item: any, idx: number) => {
                        // Extract a nice preview string
                        let previewStr = item.content;
                        try {
                           // If content is JSON string, parse it to extract values
                           const parsed = JSON.parse(item.content);
                           if (typeof parsed === 'object' && parsed !== null) {
                             previewStr = Object.values(parsed).slice(0, 3).join(' - ');
                           }
                        } catch(e) { 
                           // Keep original if not valid JSON
                        }

                        // Fallback to topic + content if empty
                        if (!previewStr) {
                           previewStr = `${item.topic} - ${item.content}`;
                        }

                        return (
                          <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-gray-400 w-16 text-center">{idx + 1}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium truncate max-w-[600px]">
                              {previewStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      Showing first {Math.min(5, datasetDetails.items.length)} of {datasetDetails.items.length.toLocaleString()} records
                    </span>
                    <Link href={`/admin/datasets/${selectedDatasetId}`}>
                      <Button variant="outline" size="sm" className="gap-2 text-xs">
                        View Complete Dataset
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                  <Database className="w-8 h-8 text-gray-300" />
                  <p>No dataset items available.</p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </TemplateSection>
  );
}
