import React from 'react';
import { TemplateSection } from './TemplateSection';
import { SolutionTemplateEditor } from './SolutionTemplateEditor';
import { Button } from '@/components/ui/button';
import { useSaveSolutionTemplate, useSolutionTemplate } from '@/services/templates/hooks';
import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function SolutionLogicSection() {
  const params = useParams();
  const templateId = params.id as string;
  const { data: existingData } = useSolutionTemplate(templateId);
  const saveMutation = useSaveSolutionTemplate();
  const { solutionTemplate, explanationTemplate, isDirty, setDirty } = useTemplatePreviewStore();

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
