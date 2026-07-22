'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, Edit2, Loader2, Sparkles } from 'lucide-react';
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
import { TemplateSection } from './TemplateSection';
import { useTemplate, useUpdateTemplate } from '@/services/templates/hooks';

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

export function GenerationStrategySection() {
  const { id: templateId } = useParams() as { id: string };
  const { data: templateResponse, isLoading: isLoadingTemplate } = useTemplate(templateId);
  const template = templateResponse?.data || templateResponse;

  const { mutate: updateTemplate, isPending: isUpdatingTemplate } = useUpdateTemplate();

  const variableSchema = useMemo(() => {
    return (template?.variableSchema as Record<string, any>) || {};
  }, [template?.variableSchema]);

  const constraintSchema = useMemo(() => {
    return (template?.constraints as Record<string, any>) || {};
  }, [template?.constraints]);

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
    const rawConstraints = Array.isArray(constraintSchema.constraints)
      ? constraintSchema.constraints
      : [];

    return rawConstraints.map((item: any, index: number) => {
      if (typeof item === 'string') {
        return { id: `${item}-${index}`, target: item, operator: '==', value: '', rule: item };
      }

      const rule = item.rule || `${item.target || ''} ${item.operator || '=='} ${item.value || ''}`;
      return {
        id: `${item.target || 'constraint'}-${index}`,
        target: item.target || '',
        operator: item.operator || '==',
        value: item.value || '',
        rule,
      };
    });
  }, [constraintSchema.constraints]);

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

  const resetVariableForm = () => {
    setVariableForm({ name: '', type: 'number', min: '', max: '', defaultValue: '', generator: 'random' });
  };

  const resetDerivedForm = () => {
    setDerivedForm({ name: '', expression: '' });
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

  const openDerivedModal = (item?: DerivedVariableDefinition) => {
    setError(null);
    if (item) {
      setEditingDerived(item);
      setDerivedForm({ name: item.name, expression: item.expression });
    } else {
      setEditingDerived(null);
      resetDerivedForm();
    }
    setDerivedModalOpen(true);
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

    if (variableForm.type === 'number' || variableForm.type === 'integer' || variableForm.type === 'decimal') {
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

  const handleSaveDerived = () => {
    setError(null);
    if (!derivedForm.name.trim() || !derivedForm.expression.trim()) {
      setError('Both derived variable name and expression are required');
      return;
    }

    const nextDerived = [...derivedVariables];
    const normalized = {
      name: derivedForm.name.trim(),
      expression: derivedForm.expression.trim(),
    };

    const exists = nextDerived.findIndex((item) => item.name === editingDerived?.name);
    if (editingDerived && exists >= 0) {
      nextDerived[exists] = normalized;
    } else {
      nextDerived.push(normalized);
    }

    const payload = {
      variableSchema: {
        ...(variableSchema || {}),
        variables,
        derivedVariables: nextDerived,
        formulas: nextDerived.map((item) => `${item.name} = ${item.expression}`),
        generationStrategyConfig: {
          variables,
          derivedVariables: nextDerived,
          constraints: constraints.map((item) => ({ target: item.target, operator: item.operator, value: item.value, rule: `${item.target} ${item.operator} ${item.value}` })),
        },
      },
    };

    updateTemplate({ templateId, payload }, { onSuccess: () => setDerivedModalOpen(false) });
  };

  const handleSaveConstraint = () => {
    setError(null);
    if (!constraintForm.target.trim() || !constraintForm.value.trim()) {
      setError('Target and value are required');
      return;
    }

    const nextConstraints = [...constraints];
    const normalized = {
      id: `${constraintForm.target}-${constraintForm.operator}-${constraintForm.value}`,
      target: constraintForm.target.trim(),
      operator: constraintForm.operator,
      value: constraintForm.value.trim(),
      rule: `${constraintForm.target.trim()} ${constraintForm.operator} ${constraintForm.value.trim()}`,
    };

    const exists = nextConstraints.findIndex((item) => item.target === editingConstraint?.target && item.operator === editingConstraint?.operator);
    if (editingConstraint && exists >= 0) {
      nextConstraints[exists] = normalized;
    } else {
      nextConstraints.push(normalized);
    }

    const payload = {
      variableSchema: {
        ...(variableSchema || {}),
        variables,
        derivedVariables,
        formulas: derivedVariables.map((item) => `${item.name} = ${item.expression}`),
        generationStrategyConfig: {
          variables,
          derivedVariables,
          constraints: nextConstraints.map((item) => ({ target: item.target, operator: item.operator, value: item.value, rule: `${item.target} ${item.operator} ${item.value}` })),
        },
      },
      constraints: {
        ...(constraintSchema || {}),
        constraints: nextConstraints.map((item) => ({ target: item.target, operator: item.operator, value: item.value, rule: `${item.target} ${item.operator} ${item.value}` })),
        generationStrategyConfig: {
          variables,
          derivedVariables,
          constraints: nextConstraints.map((item) => ({ target: item.target, operator: item.operator, value: item.value, rule: `${item.target} ${item.operator} ${item.value}` })),
        },
      },
    };

    updateTemplate({ templateId, payload }, { onSuccess: () => setConstraintModalOpen(false) });
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

  const handleDeleteDerived = (name: string) => {
    const nextDerived = derivedVariables.filter((item) => item.name !== name);
    const payload = {
      variableSchema: {
        ...(variableSchema || {}),
        variables,
        derivedVariables: nextDerived,
        formulas: nextDerived.map((item) => `${item.name} = ${item.expression}`),
      },
    };
    updateTemplate({ templateId, payload });
  };

  const handleDeleteConstraint = (target: string) => {
    const nextConstraints = constraints.filter((item) => item.target !== target);
    const payload = {
      constraints: {
        ...(constraintSchema || {}),
        constraints: nextConstraints.map((item) => ({ target: item.target, operator: item.operator, value: item.value, rule: `${item.target} ${item.operator} ${item.value}` })),
      },
    };
    updateTemplate({ templateId, payload });
  };

  return (
    <TemplateSection
      title="Generation Strategy"
      description="Define the deterministic variable strategy for this template, including derived values and validation rules."
      actions={
        <div className="flex items-center gap-2 text-sm text-indigo-600">
          <Sparkles className="h-4 w-4" />
          Deterministic mode
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-white p-4 dark:border-gray-800 dark:from-indigo-950/30 dark:to-transparent">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">What this editor controls</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The generation engine uses these values to resolve independent variables, compute derived values, and enforce deterministic constraints before the question is rendered.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Variables</h3>
              <p className="text-sm text-muted-foreground">Define the base inputs used in the question and solution logic.</p>
            </div>
            <Button onClick={() => openVariableModal()} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Variable
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Range / Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTemplate ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : variables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No base variables yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  variables.map((variable) => (
                    <TableRow key={variable.name}>
                      <TableCell className="font-mono text-sm">{variable.name}</TableCell>
                      <TableCell>{variable.type}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {variable.min !== undefined && variable.max !== undefined
                          ? `${variable.min} - ${variable.max}`
                          : variable.defaultValue !== undefined
                            ? String(variable.defaultValue)
                            : '—'}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openVariableModal(variable)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteVariable(variable.name)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Derived Variables</h3>
              <p className="text-sm text-muted-foreground">Create formula-based values that depend on base variables.</p>
            </div>
            <Button variant="outline" onClick={() => openDerivedModal()} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Derived Variable
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Expression</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {derivedVariables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      No derived variables yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  derivedVariables.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-mono text-sm">{item.name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.expression}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDerivedModal(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDerived(item.name)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Constraints</h3>
              <p className="text-sm text-muted-foreground">Define the numeric or logical conditions that the generated values must satisfy.</p>
            </div>
            <Button variant="outline" onClick={() => openConstraintModal()} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Constraint
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constraints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No constraints yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  constraints.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.target}</TableCell>
                      <TableCell className="font-mono text-xs">{item.operator}</TableCell>
                      <TableCell className="font-mono text-xs">{item.value}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openConstraintModal(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteConstraint(item.target)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
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

      <Modal isOpen={variableModalOpen} onClose={() => setVariableModalOpen(false)}>
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-xl font-semibold">{editingVariable ? 'Edit Variable' : 'Add Variable'}</h2>
          <div className="space-y-2">
            <Label htmlFor="strategyVarName">Variable Name</Label>
            <Input id="strategyVarName" value={variableForm.name} onChange={(event) => setVariableForm({ ...variableForm, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strategyVarType">Type</Label>
            <select id="strategyVarType" value={variableForm.type} onChange={(event) => setVariableForm({ ...variableForm, type: event.target.value })} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950">
              <option value="number">Number</option>
              <option value="integer">Integer</option>
              <option value="decimal">Decimal</option>
              <option value="boolean">Boolean</option>
              <option value="string">String</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="strategyVarGenerator">Generation Mode</Label>
            <select id="strategyVarGenerator" value={variableForm.generator} onChange={(event) => setVariableForm({ ...variableForm, generator: event.target.value })} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950">
              <option value="random">Random</option>
              <option value="even">Even</option>
              <option value="odd">Odd</option>
              <option value="prime">Prime</option>
              <option value="static">Static</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="strategyMin">Min</Label>
              <Input id="strategyMin" value={variableForm.min} onChange={(event) => setVariableForm({ ...variableForm, min: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategyMax">Max</Label>
              <Input id="strategyMax" value={variableForm.max} onChange={(event) => setVariableForm({ ...variableForm, max: event.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="strategyDefault">Default / Static Value</Label>
            <Input id="strategyDefault" value={variableForm.defaultValue} onChange={(event) => setVariableForm({ ...variableForm, defaultValue: event.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVariableModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVariable} disabled={isUpdatingTemplate}>
              {isUpdatingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={derivedModalOpen} onClose={() => setDerivedModalOpen(false)}>
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-xl font-semibold">{editingDerived ? 'Edit Derived Variable' : 'Add Derived Variable'}</h2>
          <div className="space-y-2">
            <Label htmlFor="derivedName">Name</Label>
            <Input id="derivedName" value={derivedForm.name} onChange={(event) => setDerivedForm({ ...derivedForm, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="derivedExpression">Expression</Label>
            <Input id="derivedExpression" value={derivedForm.expression} onChange={(event) => setDerivedForm({ ...derivedForm, expression: event.target.value })} placeholder="e.g. (selling_price - cost_price) / cost_price * 100" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDerivedModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDerived} disabled={isUpdatingTemplate}>
              {isUpdatingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={constraintModalOpen} onClose={() => setConstraintModalOpen(false)}>
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-xl font-semibold">{editingConstraint ? 'Edit Constraint' : 'Add Constraint'}</h2>
          <div className="space-y-2">
            <Label htmlFor="constraintTarget">Target</Label>
            <Input id="constraintTarget" value={constraintForm.target} onChange={(event) => setConstraintForm({ ...constraintForm, target: event.target.value })} placeholder="e.g. selling_price" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="constraintOperator">Operator</Label>
            <select id="constraintOperator" value={constraintForm.operator} onChange={(event) => setConstraintForm({ ...constraintForm, operator: event.target.value })} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950">
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value=">=">&gt;=</option>
              <option value="<=">&lt;=</option>
              <option value="==">==</option>
              <option value="!=">!=</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="constraintValue">Value</Label>
            <Input id="constraintValue" value={constraintForm.value} onChange={(event) => setConstraintForm({ ...constraintForm, value: event.target.value })} placeholder="e.g. cost_price" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConstraintModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConstraint} disabled={isUpdatingTemplate}>
              {isUpdatingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </TemplateSection>
  );
}
