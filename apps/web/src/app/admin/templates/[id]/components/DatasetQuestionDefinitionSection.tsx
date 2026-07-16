import React, { useState, useEffect } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useParams } from 'next/navigation';
import { useSaveQuestionDefinition } from '@/services/templates/hooks';
import toast from 'react-hot-toast';

interface DatasetQuestionDefinitionSectionProps {
  template: any;
}

export function DatasetQuestionDefinitionSection({ template }: DatasetQuestionDefinitionSectionProps) {
  const { id } = useParams() as { id: string };
  
  const [stem, setStem] = useState('Read the following passage and answer the question.');
  const [instructions, setInstructions] = useState('Choose the correct answer.');
  const [generationPrompt, setGenerationPrompt] = useState('Generate one MCQ from this passage.');

  const { mutate: saveQuestion, isPending: isSaving } = useSaveQuestionDefinition();

  useEffect(() => {
    try {
      if (template?.structure?.questionTemplate) {
        // Try parsing if it's a JSON string (technical debt format)
        let parsed = template.structure.questionTemplate;
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        if (parsed.stem) setStem(parsed.stem);
        if (parsed.instructions) setInstructions(parsed.instructions);
        if (parsed.generationPrompt) setGenerationPrompt(parsed.generationPrompt);
      }
    } catch (e) {
      // If parsing fails, maybe it was just a plain string. 
      // Leave defaults or attempt fallback.
    }
  }, [template]);

  const handleSave = () => {
    if (!template?.id) return;
    
    // Stringify to accommodate backend SaveQuestionDefinitionDto which expects string
    const questionTemplateStr = JSON.stringify({
      stem,
      instructions,
      placeholder: '{{DATASET_ITEM}}',
      generationPrompt
    });

    saveQuestion({
      templateId: template.id,
      payload: {
        questionTemplate: questionTemplateStr
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
      description="Configure how the question will be presented to the candidate. The dataset item is automatically injected into the placeholder."
      actions={
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Question Definition
        </Button>
      }
    >
      <div className="space-y-8">
        
        {/* Section 1: Question Stem */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Question Stem</h3>
          <p className="text-sm text-muted-foreground">The opening text shown to the candidate before the passage.</p>
          <div className="border rounded-md overflow-hidden h-[150px] shadow-sm">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={stem}
              onChange={(value: any) => setStem(value || '')}
              options={{ minimap: { enabled: false }, wordWrap: 'on', lineNumbers: 'off' }}
            />
          </div>
        </div>

        {/* Section 2: Candidate Instructions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Candidate Instructions</h3>
          <p className="text-sm text-muted-foreground">Instructions on how the candidate should answer.</p>
          <div className="border rounded-md overflow-hidden h-[100px] shadow-sm">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={instructions}
              onChange={(value: any) => setInstructions(value || '')}
              options={{ minimap: { enabled: false }, wordWrap: 'on', lineNumbers: 'off' }}
            />
          </div>
        </div>

        {/* Section 3: Dataset Placeholder */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Dataset Placeholder</h3>
          <p className="text-sm text-muted-foreground">The dataset record content will automatically replace this block.</p>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border text-center font-mono text-slate-500 cursor-not-allowed select-none">
            {`{{DATASET_ITEM}}`}
          </div>
        </div>

        {/* Section 4: Generation Prompt */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generation Prompt</h3>
            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Optional</span>
          </div>
          <p className="text-sm text-muted-foreground">Specific rules for the AI to follow when generating questions from this template.</p>
          <div className="border rounded-md overflow-hidden h-[150px] shadow-sm">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={generationPrompt}
              onChange={(value: any) => setGenerationPrompt(value || '')}
              options={{ minimap: { enabled: false }, wordWrap: 'on', lineNumbers: 'off' }}
            />
          </div>
        </div>

      </div>
    </TemplateSection>
  );
}
