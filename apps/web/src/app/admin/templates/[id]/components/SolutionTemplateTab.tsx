import { SolutionTemplateEditor } from './SolutionTemplateEditor';
import { VariableHelperPanel } from './VariableHelperPanel';
import { PreviewBuilder } from './PreviewBuilder';
import { PreviewResultPanel } from './PreviewResultPanel';
import { Button } from '@/components/ui/button';
import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { useSaveSolutionTemplate, useSolutionTemplate } from '@/services/templates/hooks';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export function SolutionTemplateTab() {
  const params = useParams();
  const templateId = params.id as string;
  const { data: existingData } = useSolutionTemplate(templateId);
  const saveMutation = useSaveSolutionTemplate();
  const { solutionTemplate, explanationTemplate, setSolutionTemplate, setExplanationTemplate, isDirty, setDirty } = useTemplatePreviewStore();

  useEffect(() => {
    if (existingData && !isDirty) {
      setSolutionTemplate(existingData.solutionTemplate);
      if (existingData.explanationTemplate) {
        setExplanationTemplate(existingData.explanationTemplate);
      }
    }
  }, [existingData, isDirty, setSolutionTemplate, setExplanationTemplate]);

  const handleSave = () => {
    saveMutation.mutate({
      templateId,
      payload: { solutionTemplate, explanationTemplate },
      isUpdate: !!existingData
    });
    setDirty(false);
  };

  return (
    <div className="space-y-8 bg-white dark:bg-gray-950 p-6 rounded-lg border">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold">Solution Templates</h2>
          <p className="text-gray-500 text-sm mt-1">Manage solution and explanation templates.</p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending} size="lg">
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <SolutionTemplateEditor />
          </section>
          
          <hr className="border-gray-200 dark:border-gray-800" />
          
          <section>
            <h2 className="text-xl font-bold mb-4">Template Preview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PreviewBuilder />
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4 flex flex-col justify-center text-center text-sm text-gray-500">
                <p>Provide a JSON payload with variable values to render a preview.</p>
              </div>
            </div>
            <PreviewResultPanel />
          </section>
        </div>
        
        <div className="space-y-6">
          <VariableHelperPanel />
        </div>
      </div>
    </div>
  );
}
