import React from 'react';
import { TemplateSection } from './TemplateSection';
import { SolutionTemplateEditor } from './SolutionTemplateEditor';
import { Button } from '@/components/ui/button';
import { useSaveSolutionTemplate, useSolutionTemplate } from '@/services/templates/hooks';
import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface SolutionLogicSectionProps {
  template?: any;
}

export function SolutionLogicSection({ template }: SolutionLogicSectionProps) {
  const params = useParams();
  const templateId = params.id as string;
  const { data: existingData } = useSolutionTemplate(templateId);
  const saveMutation = useSaveSolutionTemplate();
  const { solutionTemplate, explanationTemplate, setSolutionTemplate, setExplanationTemplate, isDirty, setDirty } = useTemplatePreviewStore();

  useEffect(() => {
    if (template?.solutionSchema) {
      if (template.solutionSchema.solutionTemplate !== undefined) {
        setSolutionTemplate(template.solutionSchema.solutionTemplate);
      }
      if (template.solutionSchema.explanationTemplate !== undefined) {
        setExplanationTemplate(template.solutionSchema.explanationTemplate);
      }
    }
  }, [template, setSolutionTemplate, setExplanationTemplate]);

  const handleSave = () => {
    saveMutation.mutate({
      templateId,
      payload: { solutionTemplate, explanationTemplate },
      isUpdate: !!existingData,
    });
    setDirty(false);
  };

  return (
    <TemplateSection
      title='Solution Logic & Explanation'
      description='Define the correct solution mapping and the explanation to be shown to the candidate.'
      actions={
        <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save Logic
        </Button>
      }
    >
      <SolutionTemplateEditor />
    </TemplateSection>
  );
}
