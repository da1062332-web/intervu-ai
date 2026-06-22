import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { ValidationWidget } from './ValidationWidget';

export function PreviewResultPanel() {
  const { previewResult } = useTemplatePreviewStore();

  if (!previewResult) return null;

  return (
    <div className='space-y-6 mt-8'>
      <ValidationWidget />

      {previewResult.solution && (
        <div className='border rounded-md overflow-hidden'>
          <div className='bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300'>
            Rendered Solution
          </div>
          <div className='p-4 bg-white dark:bg-gray-950 whitespace-pre-wrap font-mono text-sm'>
            {previewResult.solution}
          </div>
        </div>
      )}

      {previewResult.explanation && (
        <div className='border rounded-md overflow-hidden'>
          <div className='bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300'>
            Rendered Explanation
          </div>
          <div className='p-4 bg-white dark:bg-gray-950 whitespace-pre-wrap font-mono text-sm'>
            {previewResult.explanation}
          </div>
        </div>
      )}

      {previewResult.resolvedVariables &&
        Object.keys(previewResult.resolvedVariables).length > 0 && (
          <div className='border rounded-md overflow-hidden'>
            <div className='bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm text-gray-700 dark:text-gray-300'>
              Resolved Variables
            </div>
            <div className='p-4 bg-white dark:bg-gray-950 font-mono text-sm'>
              <pre>{JSON.stringify(previewResult.resolvedVariables, null, 2)}</pre>
            </div>
          </div>
        )}
    </div>
  );
}
