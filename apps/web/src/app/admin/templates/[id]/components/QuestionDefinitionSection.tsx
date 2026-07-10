import React, { useState, useMemo, useEffect } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useParams } from 'next/navigation';
import { useTemplateVariables } from '@/services/templates/hooks';

export function QuestionDefinitionSection() {
  const { id } = useParams() as { id: string };
  const [statement, setStatement] = useState(
    'The price increased from {{oldPrice}} to {{newPrice}}.',
  );
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch variables for validation
  const { data: variablesResponse } = useTemplateVariables(id);
  const fetchedVariables = variablesResponse?.data || [];

  const knownVariables = useMemo(() => {
    return [
      'answer',
      'explanation',
      'difficulty',
      'concept',
      'topic',
      'company',
      ...fetchedVariables.map((v: any) => v.variableName),
    ];
  }, [fetchedVariables]);

  const extractVariables = (text: string) => {
    const matches = text.match(/{{([^}]+)}}/g);
    if (!matches) return [];
    return matches.map((m) => m.replace(/{{|}}/g, '').trim());
  };

  const usedVariables = useMemo(() => {
    return Array.from(new Set([...extractVariables(statement), ...extractVariables(instructions)]));
  }, [statement, instructions]);

  const undefinedVariables = usedVariables.filter((v) => !knownVariables.includes(v));

  const handleSave = () => {
    setIsSaving(true);
    // TODO: Replace with backend API to POST/PATCH question definition
    console.log('Mock saving question definition:', { statement, instructions });

    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  return (
    <TemplateSection
      title='Question Definition'
      description='Define the core question text and instructions. Use {{variable}} syntax to insert dynamic variables.'
      actions={
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save Question
        </Button>
      }
    >
      <div className='space-y-6'>
        {undefinedVariables.length > 0 && (
          <div className='p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800 flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 flex-shrink-0 mt-0.5' />
            <div>
              <p className='font-semibold text-sm'>Undefined Variables Detected</p>
              <p className='text-sm opacity-90 mt-1'>
                You are using variables that have not been defined in the Variable Builder yet:
              </p>
              <ul className='list-disc pl-5 mt-2 text-sm font-mono space-y-1'>
                {undefinedVariables.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <p className='text-xs opacity-75 mt-2'>
                Make sure to define them before assembling the test.
              </p>
            </div>
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='statement'>Question Statement</Label>
          <div className='border rounded-md overflow-hidden h-[250px] shadow-sm'>
            <Editor
              height='100%'
              defaultLanguage='markdown'
              value={statement}
              onChange={(value: any) => setStatement(value || '')}
              options={{ minimap: { enabled: false }, wordWrap: 'on' }}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='instructions'>Instructions (Optional)</Label>
          <div className='border rounded-md overflow-hidden h-[150px] shadow-sm'>
            <Editor
              height='100%'
              defaultLanguage='markdown'
              value={instructions}
              onChange={(value: any) => setInstructions(value || '')}
              options={{ minimap: { enabled: false }, wordWrap: 'on' }}
            />
          </div>
        </div>

        {usedVariables.length > 0 && (
          <div className='space-y-2'>
            <Label>Variables Used</Label>
            <div className='flex flex-wrap gap-2 mt-2'>
              {usedVariables.map((v) => {
                const isKnown = knownVariables.includes(v);
                return (
                  <span
                    key={v}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium border ${
                      isKnown
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                    }`}
                  >
                    {`{{${v}}}`}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </TemplateSection>
  );
}
