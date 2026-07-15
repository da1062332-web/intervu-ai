import React, { useState, useEffect } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Database, CheckCircle2, Circle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useParams } from 'next/navigation';
import { useUpdateTemplate } from '@/services/templates/hooks';
import { useDataset } from '@/services/datasets/hooks';
import toast from 'react-hot-toast';

interface DatasetQuestionDefinitionSectionProps {
  template: any;
}

export function DatasetQuestionDefinitionSection({ template }: DatasetQuestionDefinitionSectionProps) {
  const { id } = useParams() as { id: string };
  
  const [generationPrompt, setGenerationPrompt] = useState(
    'Read the selected dataset record carefully.\n\nGenerate ONE multiple choice question based only on the provided content.\n\nRequirements:\n- Keep the original meaning.\n- Create exactly 4 options.\n- Only one correct answer.\n- Difficulty should match the template difficulty.\n- Do not invent facts outside the dataset.\n- Return explanation.'
  );
  const [questionType, setQuestionType] = useState('MCQ');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [maxOptions, setMaxOptions] = useState<number>(4);
  const [generateExplanation, setGenerateExplanation] = useState(true);
  const [preserveDatasetMeaning, setPreserveDatasetMeaning] = useState(true);

  const { mutate: updateTemplate, isPending: isSaving } = useUpdateTemplate();

  // Try to get datasetId from multiple possible locations where it might be saved
  const datasetId = template?.datasetId || template?.config?.datasetId || '';
  const { data: datasetData } = useDataset(datasetId);
  const datasetDetails = datasetData?.data || datasetData;

  useEffect(() => {
    if (template?.structure) {
      if (template.structure.generationPrompt !== undefined) {
        setGenerationPrompt(template.structure.generationPrompt);
      }
      if (template.structure.questionType !== undefined) {
        setQuestionType(template.structure.questionType);
      }
      if (template.structure.difficulty !== undefined) {
        setDifficulty(template.structure.difficulty);
      } else if (template.difficulty) {
        setDifficulty(template.difficulty);
      }
      if (template.structure.maxOptions !== undefined) {
        setMaxOptions(template.structure.maxOptions);
      }
      if (template.structure.generateExplanation !== undefined) {
        setGenerateExplanation(template.structure.generateExplanation);
      }
      if (template.structure.preserveDatasetMeaning !== undefined) {
        setPreserveDatasetMeaning(template.structure.preserveDatasetMeaning);
      }
    } else if (template?.difficulty) {
      setDifficulty(template.difficulty);
    }
  }, [template]);

  const hasDataset = !!datasetId && !!datasetDetails;
  const hasPrompt = generationPrompt.trim().length > 10;
  const isReady = hasDataset && hasPrompt;

  const handleSave = () => {
    if (!template?.id) return;
    
    updateTemplate({
      templateId: template.id,
      payload: {
        structure: {
          ...(template.structure || {}),
          generationPrompt,
          questionType,
          difficulty,
          maxOptions,
          generateExplanation,
          preserveDatasetMeaning
        }
      }
    }, {
      onSuccess: () => {
        toast.success("Question definition saved successfully");
      },
      onError: () => {
        toast.error("Failed to save question definition");
      }
    });
  };

  return (
    <TemplateSection
      title="Question Definition"
      description="Define how a question should be generated from a selected dataset record. The AI will use one dataset item together with these instructions to generate the final question."
      actions={
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Question Definition
        </Button>
      }
    >
      <div className="space-y-8">
        
        {/* Card 1: Generation Prompt */}
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generation Instructions</h3>
            <span className="text-xl">⭐</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Write the specific instructions the AI will follow when converting a dataset record into a question.
          </p>
          <div className="border rounded-md overflow-hidden h-[300px] shadow-sm">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={generationPrompt}
              onChange={(value: any) => setGenerationPrompt(value || '')}
              options={{ minimap: { enabled: false }, wordWrap: 'on' }}
            />
          </div>
        </div>

        {/* Card 2: Dataset Context */}
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Available Dataset Context</h3>
          {hasDataset ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Selected Dataset</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{datasetDetails.name}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Record Fields Available</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {/* Default fields for dataset items based on schema */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> content</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> difficulty</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> topic</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> tags</div>
                  
                  {/* Assuming custom metadata fields if any exist */}
                  {datasetDetails.items && datasetDetails.items.length > 0 && 
                   datasetDetails.items[0].metadata && 
                   Object.keys(datasetDetails.items[0].metadata).map(key => (
                     <div key={key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {key}
                     </div>
                   ))
                  }
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                These fields are sent directly to the AI generation model. The AI will use these fields alongside your instructions above.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed rounded-md bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm text-gray-500">No dataset selected yet. Configure a dataset in the Dataset Configuration section to see available fields.</p>
            </div>
          )}
        </div>

        {/* Card 3: AI Generation Rules */}
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-5 shadow-sm space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Generation Rules</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Question Type</Label>
                <RadioGroup value={questionType} onValueChange={setQuestionType} className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MCQ" id="type-mcq" />
                    <Label htmlFor="type-mcq" className="font-normal cursor-pointer">Multiple Choice (MCQ)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="TF" id="type-tf" />
                    <Label htmlFor="type-tf" className="font-normal cursor-pointer">True / False</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FIB" id="type-fib" />
                    <Label htmlFor="type-fib" className="font-normal cursor-pointer">Fill in the Blank</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SA" id="type-sa" />
                    <Label htmlFor="type-sa" className="font-normal cursor-pointer">Short Answer</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="difficulty">Difficulty Match</Label>
                <select 
                  id="difficulty"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxOptions">Max Options (if applicable)</Label>
                <Input 
                  id="maxOptions" 
                  type="number" 
                  min={2} 
                  max={6}
                  value={maxOptions}
                  onChange={(e) => setMaxOptions(parseInt(e.target.value) || 4)}
                  disabled={questionType !== 'MCQ'}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="generateExplanation" 
                    checked={generateExplanation}
                    onCheckedChange={(checked) => setGenerateExplanation(checked as boolean)}
                  />
                  <Label htmlFor="generateExplanation" className="font-normal cursor-pointer">Generate Explanation</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="preserveMeaning" 
                    checked={preserveDatasetMeaning}
                    onCheckedChange={(checked) => setPreserveDatasetMeaning(checked as boolean)}
                  />
                  <Label htmlFor="preserveMeaning" className="font-normal cursor-pointer">Preserve Dataset Meaning Strictly</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Prompt Preview */}
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Data Flow Preview</h3>
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm text-center">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dataset Record</div>
                <div className="text-sm italic line-clamp-2">"The Industrial Revolution began in Great Britain in the late 18th century..."</div>
              </div>
              
              <div className="text-2xl text-slate-400">↓</div>
              
              <div className="w-full max-w-md bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm text-center border-indigo-200 dark:border-indigo-900">
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Generation Prompt</div>
                <div className="text-sm line-clamp-2">{generationPrompt || "No prompt written yet."}</div>
              </div>
              
              <div className="text-2xl text-slate-400">↓</div>
              
              <div className="w-full max-w-md bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-md border border-indigo-200 dark:border-indigo-900/50 text-center shadow-sm">
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Generated Question</div>
                <div className="text-sm font-medium">Where did the Industrial Revolution originate?</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Validation */}
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Validation</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                {hasDataset ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                <span className={`text-sm ${hasDataset ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>Dataset Selected</span>
              </div>
              <div className="flex items-center gap-2">
                {hasPrompt ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                <span className={`text-sm ${hasPrompt ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>Prompt Written</span>
              </div>
              <div className="flex items-center gap-2">
                {isReady ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                <span className={`text-sm ${isReady ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500'}`}>Ready for Preview</span>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto mt-4 md:mt-0">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Question Definition
          </Button>
        </div>
        
      </div>
    </TemplateSection>
  );
}
