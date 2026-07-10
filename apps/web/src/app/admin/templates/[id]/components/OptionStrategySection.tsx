import React, { useState } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function OptionStrategySection() {
  const [strategy, setStrategy] = useState('static');

  return (
    <TemplateSection
      title='Option Strategy'
      description='Configure how multiple-choice options and distractors are generated for this template.'
      actions={<Button disabled>Save Strategy</Button>}
    >
      <div className='space-y-6'>
        <div className='flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800'>
          <Info className='w-5 h-5 flex-shrink-0 mt-0.5' />
          <div>
            <p className='font-semibold text-sm'>Backend Integration Pending</p>
            <p className='text-sm mt-1 opacity-90'>
              Option Strategy will be fully available after the backend integration is completed.
              You can preview the strategy types below, but saving is currently disabled.
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <Label className='text-base font-semibold'>Generation Strategy</Label>
          <RadioGroup
            value={strategy}
            onValueChange={setStrategy}
            className='flex flex-col space-y-3'
          >
            <div
              className='flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors'
              onClick={() => setStrategy('static')}
            >
              <RadioGroupItem value='static' id='static' />
              <Label htmlFor='static' className='flex flex-col cursor-pointer'>
                <span className='font-medium text-sm'>Static</span>
                <span className='text-sm text-muted-foreground font-normal'>
                  Fixed options provided manually.
                </span>
              </Label>
            </div>

            <div
              className='flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors'
              onClick={() => setStrategy('formula')}
            >
              <RadioGroupItem value='formula' id='formula' />
              <Label htmlFor='formula' className='flex flex-col cursor-pointer'>
                <span className='font-medium text-sm'>Formula</span>
                <span className='text-sm text-muted-foreground font-normal'>
                  Options calculated from variables (e.g., answer + 10).
                </span>
              </Label>
            </div>

            <div
              className='flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors'
              onClick={() => setStrategy('dynamic')}
            >
              <RadioGroupItem value='dynamic' id='dynamic' />
              <Label htmlFor='dynamic' className='flex flex-col cursor-pointer'>
                <span className='font-medium text-sm'>Dynamic Constraints</span>
                <span className='text-sm text-muted-foreground font-normal'>
                  Distractors generated based on range constraints.
                </span>
              </Label>
            </div>

            <div
              className='flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors'
              onClick={() => setStrategy('ai')}
            >
              <RadioGroupItem value='ai' id='ai' />
              <Label htmlFor='ai' className='flex flex-col cursor-pointer'>
                <span className='font-medium text-sm'>AI Assisted</span>
                <span className='text-sm text-muted-foreground font-normal'>
                  AI will generate plausible distractors based on the concept context.
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </TemplateSection>
  );
}
