import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useTemplateVariables, useTemplateRules } from '@/services/templates/hooks';

export function VariableHelperPanel() {
  const { solutionTemplate, setSolutionTemplate } = useTemplatePreviewStore();
  const { id } = useParams() as { id: string };
  
  const { data: variablesResponse } = useTemplateVariables(id);
  const { data: rulesResponse } = useTemplateRules(id);
  
  const fetchedVariables = variablesResponse?.data || [];
  const fetchedRules = rulesResponse?.data || [];

  const AVAILABLE_VARIABLES = [
    { name: 'answer', type: 'Built-in' },
    { name: 'explanation', type: 'Built-in' },
    { name: 'difficulty', type: 'Metadata' },
    { name: 'concept', type: 'Metadata' },
    { name: 'topic', type: 'Metadata' },
    { name: 'company', type: 'Metadata' },
    ...fetchedVariables.map((v: any) => ({ name: v.variableName, type: `Variable (${v.variableType})` })),
    ...fetchedRules.map((r: any) => ({ name: r.ruleType, type: 'Rule' })),
  ];

  const insertVariable = (variableName: string) => {
    // Basic append functionality
    const placeholder = `{{${variableName}}}`;
    const newText = solutionTemplate ? `${solutionTemplate} ${placeholder}` : placeholder;
    setSolutionTemplate(newText);
  };

  return (
    <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
      <h3 className="font-semibold text-lg">Variables Helper</h3>
      <div className="space-y-3">
        {AVAILABLE_VARIABLES.map(v => (
          <div key={v.name} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <div>
              <code className="text-sm bg-white dark:bg-black px-2 py-1 rounded font-mono border">
                {v.name}
              </code>
              <p className="text-xs text-gray-500 mt-1">{v.type}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => insertVariable(v.name)}>
              Insert
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
