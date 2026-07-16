import React, { useState, useEffect } from 'react';
import { TemplateSection } from './TemplateSection';
import { SolutionTemplateEditor } from './SolutionTemplateEditor';
import { Button } from '@/components/ui/button';
import { useSaveSolutionTemplate, useSolutionTemplate } from '@/services/templates/hooks';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SolutionLogicSectionProps {
  template?: any;
}

export function SolutionLogicSection({ template }: SolutionLogicSectionProps) {
  // `useSolutionTemplate` from hooks already gets fetched data from the server.
  // But wait, user says "Every section reads from the same template (Master Template Object)".
  // Let's rely on `template` if possible, but the backend stores solution logic separately?
  // No, `GET /templates/{id}/solution` fetches the solution template.
  // Actually, wait, let me just initialize from the master template if it is there, 
  // or just use `useSolutionTemplate` and save with `useSaveSolutionTemplate` which invalidates `template` anyway.
  // We'll initialize from `template.solutionSchema` if available, otherwise from `useSolutionTemplate`.

  const { data: existingData } = useSolutionTemplate(template?.id || '');
  const { mutate: saveSolution, isPending: isSaving } = useSaveSolutionTemplate();

  const [solutionTemplateStr, setSolutionTemplateStr] = useState('');
  const [explanationTemplateStr, setExplanationTemplateStr] = useState('');

  useEffect(() => {
    // Try to load from master template first, fallback to existingData
    let initialSolution = '';
    let initialExplanation = '';

    if (template?.solutionSchema?.solutionTemplate !== undefined) {
      initialSolution = template.solutionSchema.solutionTemplate;
    } else if (existingData?.solutionTemplate) {
      initialSolution = existingData.solutionTemplate;
    }

    if (template?.solutionSchema?.explanationTemplate !== undefined) {
      initialExplanation = template.solutionSchema.explanationTemplate;
    } else if (existingData?.explanationTemplate) {
      initialExplanation = existingData.explanationTemplate;
    }

    setSolutionTemplateStr(initialSolution);
    setExplanationTemplateStr(initialExplanation);
  }, [template, existingData]);

  const handleSave = () => {
    if (!template?.id) return;
    
    saveSolution({
      templateId: template.id,
      payload: { 
        solutionTemplate: solutionTemplateStr, 
        explanationTemplate: explanationTemplateStr 
      },
      isUpdate: !!(template?.solutionSchema || existingData),
    }, {
      onSuccess: () => {
        toast.success("Solution logic saved successfully");
      },
      onError: () => {
        toast.error("Failed to save solution logic");
      }
    });
  };

  return (
    <TemplateSection
      title='Solution Logic & Explanation'
      description='Define the correct solution mapping and the explanation to be shown to the candidate.'
      actions={
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save Logic
        </Button>
      }
    >
      <SolutionTemplateEditor
        solutionTemplate={solutionTemplateStr}
        explanationTemplate={explanationTemplateStr}
        setSolutionTemplate={setSolutionTemplateStr}
        setExplanationTemplate={setExplanationTemplateStr}
      />
    </TemplateSection>
  );
}
