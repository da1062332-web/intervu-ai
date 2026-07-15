import { Label } from '@/components/ui/label';
import React from 'react';
import Editor from '@monaco-editor/react';

interface SolutionTemplateEditorProps {
  solutionTemplate: string;
  explanationTemplate: string;
  setSolutionTemplate: (val: string) => void;
  setExplanationTemplate: (val: string) => void;
}

export function SolutionTemplateEditor({
  solutionTemplate,
  explanationTemplate,
  setSolutionTemplate,
  setExplanationTemplate
}: SolutionTemplateEditorProps) {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='solution'>Solution Template</Label>
        <div className='border rounded-md overflow-hidden h-[200px]'>
          <Editor
            height='100%'
            defaultLanguage='plaintext'
            value={solutionTemplate}
            onChange={(value: any) => setSolutionTemplate(value || '')}
            options={{ minimap: { enabled: false }, wordWrap: 'on' }}
          />
        </div>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='explanation'>Explanation Template</Label>
        <div className='border rounded-md overflow-hidden h-[150px]'>
          <Editor
            height='100%'
            defaultLanguage='plaintext'
            value={explanationTemplate}
            onChange={(value: any) => setExplanationTemplate(value || '')}
            options={{ minimap: { enabled: false }, wordWrap: 'on' }}
          />
        </div>
      </div>
    </div>
  );
}
