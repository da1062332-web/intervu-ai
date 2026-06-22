import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function ValidationWidget() {
  const { previewResult } = useTemplatePreviewStore();

  if (!previewResult || !previewResult.validation) return null;

  const { valid, unknownVariables } = previewResult.validation;

  if (valid) {
    return (
      <div className='flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800'>
        <CheckCircle className='w-5 h-5 flex-shrink-0' />
        <span className='font-medium'>All Variables Resolved Successfully</span>
      </div>
    );
  }

  return (
    <div className='p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 space-y-3'>
      <div className='flex items-center gap-3'>
        <AlertCircle className='w-5 h-5 flex-shrink-0' />
        <span className='font-bold'>Missing or Unknown Variables Detected</span>
      </div>
      <div className='pl-8'>
        <p className='text-sm mb-2 opacity-90'>
          The following variables were not found in the allowed list:
        </p>
        <ul className='list-disc pl-4 text-sm font-mono space-y-1'>
          {unknownVariables.map((v: string) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
