'use client';

import React, { useState } from 'react';
import { TemplateSection } from '../TemplateSection';
import { Button } from '@/components/ui/button';
import { Loader2, GitBranch } from 'lucide-react';
import { useScenarios } from '@/services/scenarios/hooks';
import { useStrategyConfigStore } from '@/store/strategy-config.store';
import { validateStrategyConfig } from '../../registry/strategy-validation.registry';
import { useEffect } from 'react';
import type { StrategyPanelProps } from '../../registry/strategy-panel.registry';
import type { Scenario } from '@/services/scenarios/api';

const JsonEditor = ({
  id,
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) => (
  <div className='space-y-2'>
    <label
      htmlFor={id}
      className={`text-sm font-medium ${error ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
    >
      {label}
      {required && <span className='text-red-500 ml-1'>*</span>}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
      placeholder={placeholder}
      className={`flex w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-900 ${
        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-800'
      }`}
    />
    {error && <p className='text-xs text-red-500'>{error}</p>}
  </div>
);

/**
 * HybridStrategyPanel
 *
 * Entity schema, relationship schema, constraint rules, and scenario selector.
 * Config saved to Zustand store and validated with hybridStrategySchema.
 */
export function HybridStrategyPanel({ templateId: _, template }: StrategyPanelProps) {
  const { updateConfig, configs } = useStrategyConfigStore();
  const config = (configs['HYBRID'] ?? {}) as Record<string, unknown>;

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (template?.config && !hydrated) {
      if (template.generationStrategy === 'HYBRID') {
        updateConfig(template.config);
        if (template.config.entitySchema)
          setEntitySchemaStr(JSON.stringify(template.config.entitySchema, null, 2));
        if (template.config.relationshipSchema)
          setRelationshipSchemaStr(JSON.stringify(template.config.relationshipSchema, null, 2));
        if (template.config.constraintSchema)
          setConstraintSchemaStr(JSON.stringify(template.config.constraintSchema, null, 2));
        if (template.config.scenarioId) setSelectedScenarioId(template.config.scenarioId as string);
      }
      setHydrated(true);
    }
  }, [template, hydrated, updateConfig]);

  const [entitySchemaStr, setEntitySchemaStr] = useState<string>(
    config.entitySchema ? JSON.stringify(config.entitySchema, null, 2) : '',
  );
  const [relationshipSchemaStr, setRelationshipSchemaStr] = useState<string>(
    config.relationshipSchema ? JSON.stringify(config.relationshipSchema, null, 2) : '',
  );
  const [constraintSchemaStr, setConstraintSchemaStr] = useState<string>(
    config.constraintSchema ? JSON.stringify(config.constraintSchema, null, 2) : '',
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    (config.scenarioId as string) ?? '',
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  const { data: scenarios, isLoading } = useScenarios();

  const parseJson = (str: string, field: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(str);
    } catch {
      setJsonErrors((prev) => ({ ...prev, [field]: 'Invalid JSON format' }));
      return null;
    }
  };

  const handleSave = () => {
    setJsonErrors({});
    setValidationErrors({});

    const entitySchema = parseJson(entitySchemaStr, 'entitySchema');
    const relationshipSchema = parseJson(relationshipSchemaStr, 'relationshipSchema');
    const constraintSchema = constraintSchemaStr
      ? parseJson(constraintSchemaStr, 'constraintSchema')
      : {};

    if (!entitySchema || !relationshipSchema) return;

    const configToValidate = {
      entitySchema,
      relationshipSchema,
      constraintSchema: constraintSchema ?? {},
      scenarioId: selectedScenarioId || undefined,
    };

    const result = validateStrategyConfig('HYBRID', configToValidate);
    if (!result.success) {
      const errors: Record<string, string> = {};
      (result as any).error.errors.forEach((e: any) => {
        errors[e.path.join('.') || 'general'] = e.message;
      });
      setValidationErrors(errors);
      return;
    }

    updateConfig(configToValidate);
  };

  return (
    <div className='space-y-6'>
      <TemplateSection
        title='Hybrid Strategy Configuration'
        description='Define entity schemas and relationships to generate logical reasoning questions from scenarios.'
        actions={
          <Button onClick={handleSave} size='sm'>
            Save Configuration
          </Button>
        }
      >
        <div className='p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-md mb-4'>
          <p className='text-sm text-purple-800 dark:text-purple-300'>
            <strong>Hybrid Strategy:</strong> Questions are generated from entity-relationship
            graphs and logic scenarios. Ideal for blood relations, seating arrangements, and logical
            puzzles.
          </p>
        </div>

        {/* General validation errors */}
        {validationErrors.general && (
          <div className='p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-md'>
            <p className='text-sm text-red-700 dark:text-red-400'>{validationErrors.general}</p>
          </div>
        )}

        <div className='space-y-6'>
          {/* Entity Schema */}
          <JsonEditor
            id='entitySchema'
            label='Entity Schema'
            required
            value={entitySchemaStr}
            onChange={setEntitySchemaStr}
            error={jsonErrors.entitySchema || validationErrors.entitySchema}
            placeholder={'{\n  "names": ["Rohan", "Amit", "Neha"],\n  "types": ["person"]\n}'}
          />

          {/* Relationship Schema */}
          <JsonEditor
            id='relationshipSchema'
            label='Relationship Schema'
            required
            value={relationshipSchemaStr}
            onChange={setRelationshipSchemaStr}
            error={jsonErrors.relationshipSchema || validationErrors.relationshipSchema}
            placeholder={'{\n  "relations": ["father", "brother", "sister"]\n}'}
          />

          {/* Constraint Schema */}
          <JsonEditor
            id='constraintSchema'
            label='Constraint Rules (optional)'
            value={constraintSchemaStr}
            onChange={setConstraintSchemaStr}
            error={jsonErrors.constraintSchema}
            placeholder={'{\n  "acyclic": true,\n  "depth": 3,\n  "entityCount": 4\n}'}
          />

          {/* Scenario Selector */}
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              <GitBranch className='inline w-4 h-4 mr-1' />
              Select Scenario (optional)
            </h3>
            <p className='text-xs text-gray-500'>
              Link a pre-defined scenario to auto-populate entity/relationship schemas.
            </p>
            {isLoading ? (
              <div className='flex items-center gap-2 text-sm text-gray-500'>
                <Loader2 className='w-4 h-4 animate-spin' />
                Loading scenarios...
              </div>
            ) : !scenarios || scenarios.length === 0 ? (
              <div className='p-4 border border-dashed rounded-lg text-center text-sm text-gray-500'>
                No scenarios found. Create one first or fill schemas manually.
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {scenarios.map((scenario: Scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => {
                      setSelectedScenarioId(scenario.id);
                      // Auto-populate schemas from scenario
                      setEntitySchemaStr(JSON.stringify(scenario.entitySchema, null, 2));
                      setRelationshipSchemaStr(JSON.stringify(scenario.relationSchema, null, 2));
                    }}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedScenarioId === scenario.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <div className='font-medium text-sm'>{scenario.name}</div>
                    {scenario.description && (
                      <div className='text-xs text-gray-500 mt-1 line-clamp-2'>
                        {scenario.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graph Preview */}
          {entitySchemaStr && relationshipSchemaStr && (
            <div className='space-y-2'>
              <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Graph Preview (read-only)
              </h3>
              <div className='p-4 bg-gray-50 dark:bg-gray-900 border rounded-md font-mono text-xs text-gray-700 dark:text-gray-300'>
                <div className='text-xs font-semibold text-gray-400 mb-2'>ENTITIES</div>
                <pre>{entitySchemaStr}</pre>
                <div className='text-xs font-semibold text-gray-400 mb-2 mt-4'>RELATIONSHIPS</div>
                <pre>{relationshipSchemaStr}</pre>
              </div>
            </div>
          )}
        </div>
      </TemplateSection>
    </div>
  );
}
