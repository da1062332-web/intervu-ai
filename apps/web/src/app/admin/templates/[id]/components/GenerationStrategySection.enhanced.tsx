'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { TemplateSection } from './TemplateSection';
import {
  useTemplate,
  useUpdateTemplate,
  useDraftStrategy,
  useApplyStrategy,
} from '@/services/templates/hooks';
import toast from 'react-hot-toast';
import { buildConstraintRule, parseConstraintRule, toConstraintPayload } from './constraint-utils';

interface VariableDefinition {
  name: string;
  type: string;
  min?: number;
  max?: number;
  defaultValue?: unknown;
  generator?: string;
  range?: {
    min?: number;
    max?: number;
    step?: number;
  };
}

interface DerivedVariableDefinition {
  name: string;
  expression: string;
}

interface ConstraintDefinition {
  id: string;
  target: string;
  operator: string;
  value: string;
  rule?: string;
}

interface DraftedStrategy {
  variables: any[];
  derivedVariables: any[];
  constraints: any[];
  notes: string[];
}

export function GenerationStrategySection() {
  const { id: templateId } = useParams() as { id: string };
  const { data: templateResponse, isLoading: isLoadingTemplate } = useTemplate(templateId);
  const template = templateResponse?.data || templateResponse;

  const { mutate: updateTemplate, isPending: isUpdatingTemplate } = useUpdateTemplate();
  const { mutate: draftStrategy, isPending: isDrafting } = useDraftStrategy();
  const { mutate: applyStrategy, isPending: isApplying } = useApplyStrategy();

  const variableSchema = useMemo(() => {
    return (template?.variableSchema as Record<string, any>) || {};
  }, [template?.variableSchema]);

  const constraintSchema = useMemo(() => {
    return (template?.constraints as Record<string, any>) || {};
  }, [template?.constraints]);

  const normalizedConstraintCollection = useMemo(() => {
    const candidates = [
      constraintSchema?.constraints,
      constraintSchema?.rules,
      constraintSchema?.generationStrategyConfig?.constraints,
      variableSchema?.generationStrategyConfig?.constraints,
      template?.constraints?.constraints,
      template?.constraints?.rules,
      template?.constraints?.generationStrategyConfig?.constraints,
      template?.variableSchema?.generationStrategyConfig?.constraints,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }, [constraintSchema, variableSchema, template?.constraints, template?.variableSchema]);

  const variables = useMemo<VariableDefinition[]>(() => {
    return Array.isArray(variableSchema.variables)
      ? variableSchema.variables.map((item: any) => ({
          name: item.name || '',
          type: item.type || 'number',
          min: item.min,
          max: item.max,
          defaultValue: item.defaultValue,
          generator: item.generator,
          range: item.range,
        }))
      : [];
  }, [variableSchema.variables]);

  const derivedVariables = useMemo<DerivedVariableDefinition[]>(() => {
    if (Array.isArray(variableSchema.derivedVariables)) {
      return variableSchema.derivedVariables.map((item: any) => ({
        name: item.name || '',
        expression: item.expression || '',
      }));
    }

    if (Array.isArray(variableSchema.formulas)) {
      return variableSchema.formulas
        .filter((item: any) => typeof item === 'string' && item.includes('='))
        .map((item: string) => {
          const [name, ...rest] = item.split('=');
          return { name: name.trim(), expression: rest.join('=').trim() };
        });
    }

    return [];
  }, [variableSchema.derivedVariables, variableSchema.formulas]);

  const constraints = useMemo<ConstraintDefinition[]>(() => {
    return normalizedConstraintCollection.map((item: any, index: number) => {
      const parsed = parseConstraintRule(item, index);
      return {
        id: parsed.id,
        target: parsed.target,
        operator: parsed.operator,
        value: parsed.value,
        rule: parsed.rule,
      };
    });
  }, [normalizedConstraintCollection]);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [draftedStrategy, setDraftedStrategy] = useState<DraftedStrategy | null>(null);
  const [showAiSection, setShowAiSection] = useState(true);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Manual Editor States
  const [variableModalOpen, setVariableModalOpen] = useState(false);
  const [constraintModalOpen, setConstraintModalOpen] = useState(false);
  const [derivedModalOpen, setDerivedModalOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<VariableDefinition | null>(null);
  const [editingDerived, setEditingDerived] = useState<DerivedVariableDefinition | null>(null);
  const [editingConstraint, setEditingConstraint] = useState<ConstraintDefinition | null>(null);
  const [variableForm, setVariableForm] = useState({
    name: '',
    type: 'number',
    min: '',
    max: '',
    defaultValue: '',
    generator: 'random',
  });
  const [derivedForm, setDerivedForm] = useState({ name: '', expression: '' });
  const [constraintForm, setConstraintForm] = useState({ target: '', operator: '>', value: '' });
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDraft = () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    draftStrategy(
      { templateId, prompt: aiPrompt },
      {
        onSuccess: (response: any) => {
          if (response.success && response.data) {
            setDraftedStrategy(response.data);
            setValidationWarnings(response.validationWarnings || []);
            toast.success('Strategy drafted successfully!');
            setShowAiSection(false);
          } else {
            toast.error(response.error || 'Failed to generate draft');
          }
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message || error?.message || 'Failed to generate draft';
          toast.error(message);
        },
      },
    );
  };

  const handleApplyDraft = () => {
    if (!draftedStrategy) {
      toast.error('No draft to apply');
      return;
    }

    applyStrategy(
      { templateId, draft: draftedStrategy },
      {
        onSuccess: (response: any) => {
          if (response.success) {
            toast.success('Strategy applied successfully!');
            setDraftedStrategy(null);
            setAiPrompt('');
            setShowAiSection(true);
          } else {
            toast.error(response.error || 'Failed to apply strategy');
          }
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message || error?.message || 'Failed to apply strategy';
          toast.error(message);
        },
      },
    );
  };

  const handleEditDraftVariable = (variable: any) => {
    setEditingVariable(variable);
    setVariableForm({
      name: variable.name,
      type: variable.type,
      min: variable.min !== undefined ? String(variable.min) : '',
      max: variable.max !== undefined ? String(variable.max) : '',
      defaultValue: variable.defaultValue !== undefined ? String(variable.defaultValue) : '',
      generator: variable.generator || 'random',
    });
    setVariableModalOpen(true);
  };

  const handleSaveDraftVariable = () => {
    if (!draftedStrategy || !editingVariable) return;

    const updatedVariables = draftedStrategy.variables.map((v: any) =>
      v.name === editingVariable.name
        ? {
            ...v,
            type: variableForm.type,
            min: variableForm.min ? Number(variableForm.min) : undefined,
            max: variableForm.max ? Number(variableForm.max) : undefined,
            defaultValue: variableForm.defaultValue ? Number(variableForm.defaultValue) : undefined,
            generator: variableForm.generator,
          }
        : v,
    );

    setDraftedStrategy({
      ...draftedStrategy,
      variables: updatedVariables,
    });
    setVariableModalOpen(false);
    setEditingVariable(null);
    toast.success('Variable updated');
  };

  const handleDeleteDraftVariable = (name: string) => {
    if (!draftedStrategy) return;

    setDraftedStrategy({
      ...draftedStrategy,
      variables: draftedStrategy.variables.filter((v: any) => v.name !== name),
    });
    toast.success('Variable removed');
  };

  const handleEditDraftConstraint = (constraint: any) => {
    setEditingConstraint(constraint);
    setConstraintForm({
      target: constraint.target === 'Custom' ? '' : constraint.target || '',
      operator: constraint.operator || '>',
      value:
        constraint.operator === 'Formula' ||
        constraint.operator === 'Custom' ||
        constraint.operator === 'Regex'
          ? constraint.rule || constraint.value || ''
          : constraint.value || '',
    });
    setConstraintModalOpen(true);
  };

  const handleSaveDraftConstraint = () => {
    if (!draftedStrategy || !editingConstraint) return;

    const updatedConstraints = draftedStrategy.constraints.map((c: any) =>
      c.rule === editingConstraint.rule
        ? {
            rule: buildConstraintRule({
              target: constraintForm.target,
              operator: constraintForm.operator,
              value: constraintForm.value,
            }),
            severity: c.severity,
          }
        : c,
    );

    setDraftedStrategy({
      ...draftedStrategy,
      constraints: updatedConstraints,
    });
    setConstraintModalOpen(false);
    setEditingConstraint(null);
    toast.success('Constraint updated');
  };

  const handleDeleteDraftConstraint = (id: string) => {
    if (!draftedStrategy) return;

    setDraftedStrategy({
      ...draftedStrategy,
      constraints: draftedStrategy.constraints.filter((c: any) => c.id !== id),
    });
    toast.success('Constraint removed');
  };

  const resetVariableForm = () => {
    setVariableForm({
      name: '',
      type: 'number',
      min: '',
      max: '',
      defaultValue: '',
      generator: 'random',
    });
  };

  const resetConstraintForm = () => {
    setConstraintForm({ target: '', operator: '>', value: '' });
  };

  const openVariableModal = (item?: VariableDefinition) => {
    setError(null);
    if (item) {
      setEditingVariable(item);
      setVariableForm({
        name: item.name,
        type: item.type,
        min: item.min !== undefined ? String(item.min) : '',
        max: item.max !== undefined ? String(item.max) : '',
        defaultValue: item.defaultValue !== undefined ? String(item.defaultValue) : '',
        generator: item.generator || 'random',
      });
    } else {
      setEditingVariable(null);
      resetVariableForm();
    }
    setVariableModalOpen(true);
  };

  const openConstraintModal = (item?: ConstraintDefinition) => {
    setError(null);
    if (item) {
      setEditingConstraint(item);
      setConstraintForm({ target: item.target, operator: item.operator, value: item.value });
    } else {
      setEditingConstraint(null);
      resetConstraintForm();
    }
    setConstraintModalOpen(true);
  };

  const handleSaveVariable = () => {
    setError(null);
    if (!variableForm.name.trim()) {
      setError('Variable name is required');
      return;
    }

    const nextVariables = [...variables];
    const normalized: VariableDefinition = {
      name: variableForm.name.trim(),
      type: variableForm.type,
      generator: variableForm.generator,
    };

    if (
      variableForm.type === 'number' ||
      variableForm.type === 'integer' ||
      variableForm.type === 'decimal'
    ) {
      const min = variableForm.min === '' ? undefined : Number(variableForm.min);
      const max = variableForm.max === '' ? undefined : Number(variableForm.max);
      if (min !== undefined) normalized.min = min;
      if (max !== undefined) normalized.max = max;
      if (variableForm.defaultValue !== '') {
        normalized.defaultValue = Number(variableForm.defaultValue);
      }
    } else if (variableForm.type === 'boolean') {
      normalized.defaultValue = variableForm.defaultValue === 'true';
    } else if (variableForm.defaultValue !== '') {
      normalized.defaultValue = variableForm.defaultValue;
    }

    const exists = nextVariables.findIndex((item) => item.name === editingVariable?.name);
    if (editingVariable && exists >= 0) {
      nextVariables[exists] = normalized;
    } else {
      nextVariables.push(normalized);
    }

    const nextDerived = derivedVariables;
    const nextConstraints = constraints;

    const payload = {
      variableSchema: {
        ...(variableSchema || {}),
        variables: nextVariables,
        derivedVariables: nextDerived,
        formulas: nextDerived.map((item) => `${item.name} = ${item.expression}`),
        generationStrategyConfig: {
          variables: nextVariables,
          derivedVariables: nextDerived,
          constraints: nextConstraints.map((item) => ({
            target: item.target,
            operator: item.operator,
            value: item.value,
            rule: `${item.target} ${item.operator} ${item.value}`,
          })),
        },
      },
      constraints: {
        ...(constraintSchema || {}),
        constraints: nextConstraints.map((item) => ({
          target: item.target,
          operator: item.operator,
          value: item.value,
          rule: `${item.target} ${item.operator} ${item.value}`,
        })),
        generationStrategyConfig: {
          variables: nextVariables,
          derivedVariables: nextDerived,
          constraints: nextConstraints.map((item) => ({
            target: item.target,
            operator: item.operator,
            value: item.value,
            rule: `${item.target} ${item.operator} ${item.value}`,
          })),
        },
      },
    };

    updateTemplate({ templateId, payload }, { onSuccess: () => setVariableModalOpen(false) });
  };

  const handleDeleteVariable = (name: string) => {
    const nextVariables = variables.filter((item) => item.name !== name);
    const payload = {
      variableSchema: {
        ...(variableSchema || {}),
        variables: nextVariables,
        derivedVariables,
        formulas: derivedVariables.map((item) => `${item.name} = ${item.expression}`),
      },
    };
    updateTemplate({ templateId, payload });
  };

  const handleSaveConstraint = () => {
    setError(null);
    const isCustomOperator =
      constraintForm.operator === 'Formula' ||
      constraintForm.operator === 'Custom' ||
      constraintForm.operator === 'Regex';

    if (!constraintForm.value.trim()) {
      setError('Value is required');
      return;
    }

    if (!isCustomOperator && !constraintForm.target.trim()) {
      setError('Target is required');
      return;
    }

    const nextConstraints = [...constraints];
    const normalizedTarget = isCustomOperator
      ? constraintForm.target.trim() || 'Custom'
      : constraintForm.target.trim();
    const ruleText = buildConstraintRule({
      target: normalizedTarget,
      operator: constraintForm.operator,
      value: constraintForm.value,
    });
    const normalized = {
      id:
        editingConstraint?.id ||
        `${normalizedTarget || 'constraint'}-${constraintForm.operator}-${constraintForm.value}`,
      target: normalizedTarget,
      operator: constraintForm.operator,
      value: constraintForm.value.trim(),
      rule: ruleText,
    };

    const exists = nextConstraints.findIndex((item) => item.id === editingConstraint?.id);
    if (editingConstraint && exists >= 0) {
      nextConstraints[exists] = normalized;
    } else {
      nextConstraints.push(normalized);
    }

    const payload = {
      constraints: {
        ...(constraintSchema || {}),
        constraints: nextConstraints.map((item) => toConstraintPayload(item)),
        generationStrategyConfig: {
          variables,
          derivedVariables,
          constraints: nextConstraints.map((item) => toConstraintPayload(item)),
        },
      },
    };

    updateTemplate({ templateId, payload }, { onSuccess: () => setConstraintModalOpen(false) });
  };

  const handleDeleteConstraint = (id: string) => {
    const nextConstraints = constraints.filter((item) => item.id !== id);
    const payload = {
      constraints: {
        ...(constraintSchema || {}),
        constraints: nextConstraints.map((item) => ({
          target: item.target,
          operator: item.operator,
          value: item.value,
          rule:
            item.rule ||
            buildConstraintRule({
              target: item.target,
              operator: item.operator,
              value: item.value,
            }),
        })),
      },
    };
    updateTemplate({ templateId, payload });
  };

  return (
    <TemplateSection
      title='Generation Strategy'
      description='Define the deterministic variable strategy for this template, including derived values and validation rules.'
      actions={
        <div className='flex items-center gap-2 text-sm text-indigo-600'>
          <Sparkles className='h-4 w-4' />
          Deterministic mode
        </div>
      }
    >
      <div className='space-y-6'>
        {error && (
          <div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
            {error}
          </div>
        )}

        {/* A. Quick Start Section - AI Assisted */}
        {showAiSection && !draftedStrategy && (
          <div className='space-y-4 rounded-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 dark:border-indigo-800 dark:from-indigo-950/30 dark:to-transparent'>
            <div className='flex items-start justify-between'>
              <div>
                <h3 className='flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  <Zap className='h-5 w-5 text-amber-500' />
                  AI-Assisted Strategy Builder
                </h3>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Describe your question logic in simple English, and let the AI draft the variable
                  and constraint structure for you.
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowAiSection(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                <ChevronUp className='h-4 w-4' />
              </Button>
            </div>

            <div className='space-y-3'>
              <Label htmlFor='aiPrompt' className='text-base font-semibold'>
                Describe your logic
              </Label>
              <Textarea
                id='aiPrompt'
                placeholder='Example: Create a question where price is between 100 and 500, quantity is an integer between 1 and 20, and total cost equals price times quantity. The total must be a multiple of 100.'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className='min-h-24 resize-none'
                disabled={isDrafting}
              />
              <p className='text-xs text-muted-foreground'>
                Be specific about variable names, ranges, and any relationships between them.
              </p>
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={handleGenerateDraft}
                disabled={isDrafting || !aiPrompt.trim()}
                className='gap-2 bg-indigo-600 hover:bg-indigo-700 text-white'
              >
                {isDrafting && <Loader2 className='h-4 w-4 animate-spin' />}
                Generate Draft
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setShowAiSection(false);
                  setAiPrompt('');
                }}
                disabled={isDrafting}
              >
                Use Manual Editor Instead
              </Button>
            </div>
          </div>
        )}

        {/* Drafted Strategy Preview & Review Section */}
        {draftedStrategy && (
          <div className='space-y-4 rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 dark:border-amber-800 dark:from-amber-950/30 dark:to-transparent'>
            <div>
              <h3 className='flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
                <CheckCircle2 className='h-5 w-5 text-green-500' />
                Review & Edit Draft
              </h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                Review the AI-generated structure. You can edit any item before applying.
              </p>
            </div>

            {validationWarnings.length > 0 && (
              <div className='space-y-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-950/30'>
                <div className='flex items-start gap-2'>
                  <AlertCircle className='h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-700 dark:text-yellow-300' />
                  <div className='text-sm text-yellow-800 dark:text-yellow-200'>
                    <p className='font-semibold'>Validation Notes:</p>
                    <ul className='mt-1 space-y-1 list-disc list-inside'>
                      {validationWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Drafted Variables Preview */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h4 className='text-base font-semibold'>
                  Variables ({draftedStrategy.variables.length})
                </h4>
                <Button variant='outline' size='sm' onClick={() => openVariableModal()}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add More
                </Button>
              </div>
              <div className='overflow-hidden rounded-md border'>
                <Table>
                  <TableHeader className='bg-gray-50 dark:bg-gray-900'>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Range / Value</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftedStrategy.variables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
                          No variables in draft.
                        </TableCell>
                      </TableRow>
                    ) : (
                      draftedStrategy.variables.map((v: any) => (
                        <TableRow key={v.name}>
                          <TableCell className='font-mono text-sm'>{v.name}</TableCell>
                          <TableCell>{v.type}</TableCell>
                          <TableCell className='font-mono text-xs'>
                            {v.min !== undefined && v.max !== undefined
                              ? `${v.min} - ${v.max}`
                              : v.defaultValue !== undefined
                                ? String(v.defaultValue)
                                : '—'}
                          </TableCell>
                          <TableCell className='space-x-2 text-right'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleEditDraftVariable(v)}
                            >
                              <Edit2 className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteDraftVariable(v.name)}
                            >
                              <Trash2 className='h-4 w-4 text-red-600' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Drafted Constraints Preview */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h4 className='text-base font-semibold'>
                  Constraints ({draftedStrategy.constraints.length})
                </h4>
                <Button variant='outline' size='sm' onClick={() => openConstraintModal()}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add More
                </Button>
              </div>
              <div className='overflow-hidden rounded-md border'>
                <Table>
                  <TableHeader className='bg-gray-50 dark:bg-gray-900'>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftedStrategy.constraints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className='py-8 text-center text-muted-foreground'>
                          No constraints in draft.
                        </TableCell>
                      </TableRow>
                    ) : (
                      draftedStrategy.constraints.map((c: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className='font-mono text-sm'>{c.rule}</TableCell>
                          <TableCell className='space-x-2 text-right'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleEditDraftConstraint(c)}
                            >
                              <Edit2 className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteDraftConstraint(c.rule)}
                            >
                              <Trash2 className='h-4 w-4 text-red-600' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className='flex gap-2 pt-4'>
              <Button
                onClick={handleApplyDraft}
                disabled={isApplying}
                className='gap-2 bg-green-600 hover:bg-green-700 text-white'
              >
                {isApplying && <Loader2 className='h-4 w-4 animate-spin' />}
                Apply to Template
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setDraftedStrategy(null);
                  setValidationWarnings([]);
                  setShowAiSection(true);
                }}
                disabled={isApplying}
              >
                Discard & Start Over
              </Button>
            </div>
          </div>
        )}

        {/* B. Manual Editor Sections - Always available */}
        {!draftedStrategy && (
          <Button
            variant='outline'
            onClick={() => setShowAiSection(!showAiSection)}
            className='w-full justify-between'
          >
            <span>AI-Assisted Strategy Builder</span>
            {showAiSection ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </Button>
        )}

        <div className='rounded-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-white p-4 dark:border-gray-800 dark:from-indigo-950/30 dark:to-transparent'>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>Manual Editor</h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Create and manage variables, derived variables, and constraints manually.
          </p>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-base font-semibold'>Variables</h3>
              <p className='text-sm text-muted-foreground'>
                Define the base inputs used in the question and solution logic.
              </p>
            </div>
            <Button onClick={() => openVariableModal()} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Add Variable
            </Button>
          </div>
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader className='bg-gray-50 dark:bg-gray-900'>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Range / Value</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTemplate ? (
                  <TableRow>
                    <TableCell colSpan={4} className='py-8 text-center'>
                      <Loader2 className='mx-auto h-5 w-5 animate-spin text-muted-foreground' />
                    </TableCell>
                  </TableRow>
                ) : variables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
                      No base variables yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  variables.map((variable) => (
                    <TableRow key={variable.name}>
                      <TableCell className='font-mono text-sm'>{variable.name}</TableCell>
                      <TableCell>{variable.type}</TableCell>
                      <TableCell className='font-mono text-xs'>
                        {variable.min !== undefined && variable.max !== undefined
                          ? `${variable.min} - ${variable.max}`
                          : variable.defaultValue !== undefined
                            ? String(variable.defaultValue)
                            : '—'}
                      </TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => openVariableModal(variable)}
                        >
                          <Edit2 className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteVariable(variable.name)}
                        >
                          <Trash2 className='h-4 w-4 text-red-600' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-base font-semibold'>Constraints</h3>
              <p className='text-sm text-muted-foreground'>
                Define the numeric or logical conditions that the generated values must satisfy.
              </p>
            </div>
            <Button variant='outline' onClick={() => openConstraintModal()} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Add Constraint
            </Button>
          </div>
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader className='bg-gray-50 dark:bg-gray-900'>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constraints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
                      No constraints yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  constraints.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-mono text-sm'>{item.target}</TableCell>
                      <TableCell className='font-mono text-xs'>{item.operator}</TableCell>
                      <TableCell className='font-mono text-xs'>{item.value}</TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='sm' onClick={() => openConstraintModal(item)}>
                          <Edit2 className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteConstraint(item.id)}
                        >
                          <Trash2 className='h-4 w-4 text-red-600' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Variable Modal */}
      <Modal isOpen={variableModalOpen} onClose={() => setVariableModalOpen(false)}>
        <div className='w-full max-w-md space-y-4'>
          <h2 className='text-xl font-semibold'>
            {editingVariable ? 'Edit Variable' : 'Add Variable'}
          </h2>
          {error && <div className='p-3 bg-red-50 text-red-700 rounded-md text-sm'>{error}</div>}
          <div className='space-y-2'>
            <Label htmlFor='varName'>Variable Name</Label>
            <Input
              id='varName'
              value={variableForm.name}
              onChange={(e) => setVariableForm({ ...variableForm, name: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='varType'>Type</Label>
            <select
              id='varType'
              value={variableForm.type}
              onChange={(e) => setVariableForm({ ...variableForm, type: e.target.value })}
              className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950'
            >
              <option value='number'>Number</option>
              <option value='integer'>Integer</option>
              <option value='decimal'>Decimal</option>
              <option value='boolean'>Boolean</option>
              <option value='string'>String</option>
            </select>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-2'>
              <Label htmlFor='varMin'>Min</Label>
              <Input
                id='varMin'
                value={variableForm.min}
                onChange={(e) => setVariableForm({ ...variableForm, min: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='varMax'>Max</Label>
              <Input
                id='varMax'
                value={variableForm.max}
                onChange={(e) => setVariableForm({ ...variableForm, max: e.target.value })}
              />
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setVariableModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={
                draftedStrategy && editingVariable ? handleSaveDraftVariable : handleSaveVariable
              }
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Constraint Modal */}
      <Modal isOpen={constraintModalOpen} onClose={() => setConstraintModalOpen(false)}>
        <div className='w-full max-w-md space-y-4'>
          <h2 className='text-xl font-semibold'>
            {editingConstraint ? 'Edit Constraint' : 'Add Constraint'}
          </h2>
          {error && <div className='p-3 bg-red-50 text-red-700 rounded-md text-sm'>{error}</div>}
          <div className='space-y-2'>
            <Label htmlFor='conTarget'>Target Variable</Label>
            <Input
              id='conTarget'
              value={constraintForm.target}
              onChange={(e) => setConstraintForm({ ...constraintForm, target: e.target.value })}
              placeholder={
                constraintForm.operator === 'Formula' ||
                constraintForm.operator === 'Custom' ||
                constraintForm.operator === 'Regex'
                  ? 'Optional label'
                  : 'e.g. selling_price'
              }
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='conOp'>Operator</Label>
            <select
              id='conOp'
              value={constraintForm.operator}
              onChange={(e) => setConstraintForm({ ...constraintForm, operator: e.target.value })}
              className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono dark:border-gray-800 dark:bg-gray-950'
            >
              <option value='>'>&gt;</option>
              <option value='<'>&lt;</option>
              <option value='>='>&gt;=</option>
              <option value='<='>&lt;=</option>
              <option value='=='>=</option>
              <option value='!='>!=</option>
              <option value='Regex'>Regex</option>
              <option value='Formula'>Formula</option>
              <option value='Custom'>Custom Logic</option>
            </select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='conValue'>Value</Label>
            <Input
              id='conValue'
              value={constraintForm.value}
              onChange={(e) => setConstraintForm({ ...constraintForm, value: e.target.value })}
              placeholder={
                constraintForm.operator === 'Regex'
                  ? '^\\d+$'
                  : constraintForm.operator === 'Formula' || constraintForm.operator === 'Custom'
                    ? 'e.g. other_number % 1 = 0'
                    : 'e.g. cost_price'
              }
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setConstraintModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={
                draftedStrategy && editingConstraint
                  ? handleSaveDraftConstraint
                  : handleSaveConstraint
              }
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </TemplateSection>
  );
}
