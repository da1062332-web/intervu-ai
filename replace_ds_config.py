import re

with open("apps/web/src/app/admin/templates/[id]/components/DatasetConfigurationSection.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { useUpdateTemplate, useSaveOptionStrategy } from '@/services/templates/hooks';",
    "import { useSaveOptionStrategy, useSaveTemplateDatasetConfig, useTemplateDatasetPreview, useTemplateVariables } from '@/services/templates/hooks';\nimport { useDatasetSchema } from '@/services/datasets/hooks';\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';"
)

content = content.replace(
    "import { Loader2, Database, Settings2, Search, ChevronDown, Check, CheckCircle2, Circle } from 'lucide-react';",
    "import { Loader2, Database, Settings2, Search, ChevronDown, Check, CheckCircle2, Circle, Eye, Link } from 'lucide-react';"
)

# 2. Hooks and States
old_states = """  const [selectionMode, setSelectionMode] = useState<'RANDOM' | 'SEQUENTIAL'>('RANDOM');
  const [itemsPerQuestion, setItemsPerQuestion] = useState<number>(1);
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);"""

new_states = """  const [selectionMethod, setSelectionMethod] = useState<'RANDOM' | 'SEQUENTIAL' | 'SPECIFIC'>('RANDOM');
  const [sampleSize, setSampleSize] = useState<number>(1);
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [allowReuse, setAllowReuse] = useState<boolean>(false);
  const [specificItemId, setSpecificItemId] = useState<string>('');
  const [fallbackPolicy, setFallbackPolicy] = useState<string>('RELAX_FILTERS');
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<any>(null);"""

content = content.replace(old_states, new_states)

# Replace hook calls
old_hooks = """  const { mutate: updateTemplate, isPending: isUpdatingConfig } = useUpdateTemplate();
  const { mutateAsync: saveOptions, isPending: isSavingDataset } = useSaveOptionStrategy();
  const isSaving = isUpdatingConfig || isSavingDataset;"""

new_hooks = """  const { mutate: saveDatasetConfig, isPending: isSavingConfig } = useSaveTemplateDatasetConfig();
  const { mutateAsync: saveOptions, isPending: isSavingDataset } = useSaveOptionStrategy();
  const { mutate: getPreview, isPending: isGeneratingPreview } = useTemplateDatasetPreview();
  const isSaving = isSavingConfig || isSavingDataset;"""
content = content.replace(old_hooks, new_hooks)

# Fetching schema and variables
dataset_response = """  const { data: datasetResponse, isLoading: datasetLoading } = useDataset(selectedDatasetId);
  const datasetDetails = (datasetResponse as any)?.data || datasetResponse;"""

new_fetch = """  const { data: datasetResponse, isLoading: datasetLoading } = useDataset(selectedDatasetId);
  const datasetDetails = (datasetResponse as any)?.data || datasetResponse;

  const { data: schemaResponse } = useDatasetSchema(selectedDatasetId);
  const datasetSchema = (schemaResponse as any)?.data || schemaResponse;
  
  const { data: varsResponse } = useTemplateVariables(template?.id);
  const templateVarsData = (varsResponse as any)?.data || varsResponse;
  
  const availableColumns = (() => {
    if (!datasetSchema) return [];
    if (Array.isArray(datasetSchema)) return datasetSchema.map((c: any) => typeof c === 'string' ? c : c.name || c.key || String(c));
    if (datasetSchema.columns && Array.isArray(datasetSchema.columns)) return datasetSchema.columns.map((c: any) => typeof c === 'string' ? c : c.name || c.key || String(c));
    if (datasetSchema.fields && Array.isArray(datasetSchema.fields)) return datasetSchema.fields.map((c: any) => typeof c === 'string' ? c : c.name || c.key || String(c));
    return [];
  })();

  const templateVariables = (() => {
    if (!templateVarsData) return [];
    if (Array.isArray(templateVarsData)) return templateVarsData;
    if (templateVarsData.items && Array.isArray(templateVarsData.items)) return templateVarsData.items;
    return [];
  })();
"""
content = content.replace(dataset_response, new_fetch)

# UseEffect
old_useeffect = """  // Initialize from template config
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
  }, [template]);"""

new_useeffect = """  // Initialize from template config
  useEffect(() => {
    if (template?.datasetId || template?.config?.datasetId) {
      setSelectedDatasetId(template.datasetId || template.config.datasetId);
    }
    const dsConfig = template?.config?.datasetConfig;
    if (dsConfig) {
      if (dsConfig.selectionMethod) setSelectionMethod(dsConfig.selectionMethod);
      else if (dsConfig.selectionMode) setSelectionMethod(dsConfig.selectionMode); // legacy
      
      if (dsConfig.sampleSize) setSampleSize(dsConfig.sampleSize);
      else if (dsConfig.itemsPerQuestion) setSampleSize(dsConfig.itemsPerQuestion); // legacy
      
      if (dsConfig.shuffle !== undefined) setShuffle(dsConfig.shuffle);
      
      if (dsConfig.allowReuse !== undefined) setAllowReuse(dsConfig.allowReuse);
      else if (dsConfig.allowDuplicates !== undefined) setAllowReuse(dsConfig.allowDuplicates); // legacy
      
      if (dsConfig.specificItemId) setSpecificItemId(dsConfig.specificItemId);
      if (dsConfig.fallbackPolicy) setFallbackPolicy(dsConfig.fallbackPolicy);
      if (dsConfig.variableMapping) setVariableMapping(dsConfig.variableMapping);
    }
  }, [template]);"""
content = content.replace(old_useeffect, new_useeffect)

# handleSave
old_handleSave = """      // Step 2: Save the specific configuration logic
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
      }, {"""

new_handleSave = """      // Step 2: Save the specific configuration logic
      saveDatasetConfig({
        templateId: template.id,
        payload: {
          datasetId: selectedDatasetId,
          selectionMethod,
          sampleSize,
          shuffle,
          allowReuse,
          specificItemId: selectionMethod === 'SPECIFIC' ? specificItemId : undefined,
          fallbackPolicy,
          variableMapping
        }
      }, {"""
content = content.replace(old_handleSave, new_handleSave)

# handleGeneratePreview
preview_func = """
  const handleGeneratePreview = () => {
    if (!template?.id) return;
    getPreview(template.id, {
      onSuccess: (data: any) => {
        setPreviewResult(data?.data || data);
        toast.success("Preview generated successfully");
      },
      onError: () => {
        toast.error("Failed to generate preview");
      }
    });
  };
"""
content = content.replace("  const filteredDatasets = datasets?.filter((ds: Dataset) => ", preview_func + "\n  const filteredDatasets = datasets?.filter((ds: Dataset) => ")

# replace validation
content = content.replace("const isItemsValid = itemsPerQuestion > 0;", "const isItemsValid = sampleSize > 0;")
content = content.replace("value={itemsPerQuestion}", "value={sampleSize}")
content = content.replace("setItemsPerQuestion(parseInt(e.target.value) || 1)", "setSampleSize(parseInt(e.target.value) || 1)")

# selectionMode -> selectionMethod in render
content = content.replace("selectionMode === 'RANDOM'", "selectionMethod === 'RANDOM'")
content = content.replace("selectionMode === 'SEQUENTIAL'", "selectionMethod === 'SEQUENTIAL'")
content = content.replace("setSelectionMode('RANDOM')", "setSelectionMethod('RANDOM')")
content = content.replace("setSelectionMode('SEQUENTIAL')", "setSelectionMethod('SEQUENTIAL')")

# specific radio
specific_radio = """
                        <label className="flex items-center gap-3 text-sm cursor-pointer group mt-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectionMethod === 'SPECIFIC' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-500'}`}>
                            {selectionMethod === 'SPECIFIC' && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Specific Item</span>
                          <input type="radio" className="hidden" checked={selectionMethod === 'SPECIFIC'} onChange={() => setSelectionMethod('SPECIFIC')} />
                        </label>
                        <p className="text-xs text-gray-500 pl-7 -mt-2">Always pick a specific item by ID.</p>
                        
                        {selectionMethod === 'SPECIFIC' && (
                          <div className="pl-7 mt-1">
                            <Input 
                              placeholder="Item ID..." 
                              value={specificItemId} 
                              onChange={(e) => setSpecificItemId(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
"""
content = content.replace("Picks items in order, looping back to the start when exhausted.</p>", "Picks items in order, looping back to the start when exhausted.</p>" + specific_radio)

# The large layout changes: tabs for Preview and Mapping
new_cards = """
        {selectedDatasetId && hasRecords && (
          <Tabs defaultValue="mapping" className="mt-6 w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mapping" className="flex gap-2"><Link className="w-4 h-4"/> Variable Mapping</TabsTrigger>
              <TabsTrigger value="preview" className="flex gap-2"><Eye className="w-4 h-4"/> Live Prompt Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mapping" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                  <CardTitle className="text-base flex items-center gap-2">
                    Map Template Variables
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {templateVariables.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">No template variables found to map.</div>
                  ) : (
                    <div className="space-y-4">
                      {templateVariables.map((v: any, i: number) => {
                        const varKey = v.key || v.name || v;
                        return (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-1/3 text-sm font-medium">{{`{{${varKey}}}`}}</div>
                            <div className="w-2/3">
                              <select 
                                className="w-full p-2 text-sm border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-indigo-500"
                                value={variableMapping[varKey] || ''}
                                onChange={(e) => {
                                  setVariableMapping((prev: any) => ({
                                    ...prev,
                                    [varKey]: e.target.value
                                  }));
                                }}
                              >
                                <option value="">-- Select Column --</option>
                                {availableColumns.map((col: string, j: number) => (
                                  <option key={j} value={col}>{col}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    Dry-Run Preview
                  </CardTitle>
                  <Button size="sm" onClick={handleGeneratePreview} disabled={isGeneratingPreview}>
                    {isGeneratingPreview ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Eye className="w-4 h-4 mr-2"/>}
                    Generate Preview
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  {!previewResult ? (
                    <div className="text-sm text-gray-500 text-center py-4">Click generate to see a preview of the question generation prompt.</div>
                  ) : (
                    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <span className="font-semibold block mb-1">Mock Variables:</span>
                        <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded border overflow-x-auto text-xs">
                          {JSON.stringify(previewResult.mockVariables || previewResult.variables || previewResult, null, 2)}
                        </pre>
                      </div>
                      {previewResult.promptText && (
                        <div>
                          <span className="font-semibold block mb-1">Compiled Prompt:</span>
                          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded border border-indigo-100 dark:border-indigo-900 whitespace-pre-wrap">
                            {previewResult.promptText}
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
"""

content = content.replace("""        {/* Card 4: Preview Records */}
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
        )}""", new_cards)

with open("apps/web/src/app/admin/templates/[id]/components/DatasetConfigurationSection.tsx", "w", encoding="utf-8") as f:
    f.write(content)
