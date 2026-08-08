import React from 'react';
import { TemplateSection } from './TemplateSection';
import { Info } from 'lucide-react';

export function PromptBuilderSection() {
  return (
    <TemplateSection
      title='AI Prompt Builder'
      description='Use AI to generate the entire question dynamically.'
    >
      <div className='p-12 text-center border rounded-lg bg-gray-50 dark:bg-gray-900 border-dashed'>
        <Info className='w-8 h-8 mx-auto text-gray-400 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>AI Prompt Manager</h3>
        <p className='text-gray-500 mt-2'>This feature is planned for a future release.</p>
        <div className='mt-6 text-sm text-gray-500 text-left max-w-md mx-auto space-y-2'>
          <p>
            <strong>Planned Features:</strong>
          </p>
          <ul className='list-disc pl-5'>
            <li>Prompt selection & management</li>
            <li>Prompt version control</li>
            <li>Live prompt preview and testing</li>
          </ul>
        </div>
      </div>
    </TemplateSection>
  );
}
