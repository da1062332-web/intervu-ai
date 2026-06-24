import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { useGeneratePreview } from '@/services/templates/hooks';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className || ''}`}
  />
);

export function PreviewBuilder() {
  const params = useParams();
  const templateId = params.id as string;
  const { previewInput, setPreviewInput, setPreviewResult, solutionTemplate, explanationTemplate } =
    useTemplatePreviewStore();
  const generatePreview = useGeneratePreview();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    try {
      const payload = JSON.parse(previewInput);
      const res = await generatePreview.mutateAsync({
        templateId,
        payload: {
          previewPayload: payload,
          solutionTemplate,
          explanationTemplate,
        },
      });
      setPreviewResult(res.previewResult);
    } catch (e: any) {
      console.error(e);
      if (e instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        // Assume API error with validation info
        setPreviewResult(
          e.response?.data?.data?.previewResult || {
            validation: e.response?.data?.unknownVariables
              ? {
                  valid: false,
                  unknownVariables: e.response.data.unknownVariables,
                }
              : null,
          },
        );
      }
    }
  };

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='font-medium text-sm text-gray-600 mb-2'>Preview Payload (JSON)</h3>
        <Textarea
          value={previewInput}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPreviewInput(e.target.value)}
          rows={6}
          className='font-mono text-sm bg-gray-50 dark:bg-gray-900'
        />
        {error && <p className='text-red-500 text-sm mt-1'>{error}</p>}
      </div>
      <Button onClick={handleGenerate} disabled={generatePreview.isPending} className='w-full'>
        {generatePreview.isPending && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
        Generate Preview
      </Button>
    </div>
  );
}
