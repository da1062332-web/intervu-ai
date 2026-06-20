'use client';

import { useEffect, useState } from 'react';
import {
  useTemplateVariables,
  useTemplateRules,
  useCreateVariable,
  useUpdateVariable,
  useDeleteVariable,
  useCreateRule,
  useUpdateRule,
  useDeleteRule,
  useValidateTemplate,
} from '@/services/templates/hooks';
import {
  useTemplateSchemaStore,
  TemplateVariable,
  TemplateRule,
} from '@/store/template-schema.store';
import { VariableType, RuleType } from '@intervu/shared/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  AlertCircle,
  FileCode,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export function TemplateBuilderPageClient({ templateId }: { templateId: string }) {
  // Queries
  const { data: dbVariables } = useTemplateVariables(templateId);
  const { data: dbRules } = useTemplateRules(templateId);

  // Mutations
  const createVariableMutation = useCreateVariable();
  const updateVariableMutation = useUpdateVariable();
  const deleteVariableMutation = useDeleteVariable();
  const createRuleMutation = useCreateRule();
  const updateRuleMutation = useUpdateRule();
  const deleteRuleMutation = useDeleteRule();
  const validateMutation = useValidateTemplate();

  // Store
  const {
    variables,
    rules,
    preview,
    validationErrors,
    selectedVariable,
    selectedRule,
    isDirty,
    setVariables,
    setRules,
    setSelectedVariable,
    setSelectedRule,
    setValidationErrors,
    setDirty,
    resetStore,
  } = useTemplateSchemaStore();

  // Reset store on mount and when templateId changes
  useEffect(() => {
    resetStore();
    return () => resetStore();
  }, [templateId, resetStore]);

  // UI state
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // Forms state
  const [varName, setVarName] = useState('');
  const [varType, setVarType] = useState<VariableType>(VariableType.STRING);
  const [varRequired, setVarRequired] = useState(false);
  const [varDefaultValue, setVarDefaultValue] = useState('');

  const [ruleType, setRuleType] = useState<RuleType>(RuleType.DIFFICULTY);
  const [ruleTargetVar, setRuleTargetVar] = useState('');
  const [ruleConfigDifficulty, setRuleConfigDifficulty] = useState('MEDIUM');
  const [ruleConfigMin, setRuleConfigMin] = useState('');
  const [ruleConfigMax, setRuleConfigMax] = useState('');
  const [ruleConfigMinLength, setRuleConfigMinLength] = useState('');
  const [ruleConfigMaxLength, setRuleConfigMaxLength] = useState('');
  const [ruleConfigPattern, setRuleConfigPattern] = useState('');

  // Interactive sandbox inputs for testing
  const [sandboxInputsJson, setSandboxInputsJson] = useState('{\n  \n}');
  const [sandboxResult, setSandboxResult] = useState<{ valid: boolean; errors: string[] } | null>(
    null,
  );

  // Sync DB variables to Zustand Store
  useEffect(() => {
    if (dbVariables) {
      setVariables(dbVariables as TemplateVariable[]);
    }
  }, [dbVariables, setVariables]);

  // Sync DB rules to Zustand Store
  useEffect(() => {
    if (dbRules) {
      setRules(dbRules as TemplateRule[]);
    }
  }, [dbRules, setRules]);

  // Run initial validate
  useEffect(() => {
    triggerValidation();
  }, [variables, rules]);

  // Helper to validate and refresh validation status
  const triggerValidation = async () => {
    try {
      let inputs: Record<string, unknown> = {};
      try {
        inputs = JSON.parse(sandboxInputsJson);
      } catch {
        // use default empty object if JSON parsing fails
      }
      const res = await validateMutation.mutateAsync({ templateId, values: inputs });
      setValidationErrors(res.errors);
      setSandboxResult(res);
    } catch {
      // silent validation failure
    }
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(preview);
    toast.success('Schema copied to clipboard');
  };

  // Variable Operations
  const openVariableModal = (variable?: TemplateVariable) => {
    if (variable) {
      setSelectedVariable(variable);
      setVarName(variable.variableName);
      setVarType(variable.variableType);
      setVarRequired(variable.required);
      setVarDefaultValue(variable.defaultValue || '');
    } else {
      setSelectedVariable(null);
      setVarName('');
      setVarType(VariableType.STRING);
      setVarRequired(false);
      setVarDefaultValue('');
    }
    setIsVariableModalOpen(true);
  };

  const saveVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = varName.trim();

    if (!trimmedName) {
      toast.error('Variable name is required');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
      toast.error('Variable name must be alphanumeric and start with a letter or underscore');
      return;
    }

    // Check duplicate name
    const isDuplicate = variables.some(
      (v) =>
        v.variableName.toLowerCase() === trimmedName.toLowerCase() && v.id !== selectedVariable?.id,
    );
    if (isDuplicate) {
      toast.error(`Variable name '${trimmedName}' is already defined`);
      return;
    }

    // Check default value compatibility
    if (varDefaultValue) {
      if (varType === VariableType.NUMBER && isNaN(Number(varDefaultValue))) {
        toast.error('Default value is not a valid number');
        return;
      }
      if (
        varType === VariableType.BOOLEAN &&
        varDefaultValue !== 'true' &&
        varDefaultValue !== 'false'
      ) {
        toast.error('Default value must be "true" or "false"');
        return;
      }
      if (varType === VariableType.ARRAY) {
        try {
          const parsed = JSON.parse(varDefaultValue);
          if (!Array.isArray(parsed)) {
            toast.error('Default value must be a valid JSON array');
            return;
          }
        } catch {
          toast.error('Default value must be a valid JSON array');
          return;
        }
      }
    }

    try {
      const payload = {
        variableName: trimmedName,
        variableType: varType,
        required: varRequired,
        defaultValue: varDefaultValue || null,
      };

      if (selectedVariable) {
        await updateVariableMutation.mutateAsync({
          id: selectedVariable.id,
          templateId,
          payload,
        });
        toast.success('Variable updated successfully');
      } else {
        await createVariableMutation.mutateAsync({
          templateId,
          payload,
        });
        toast.success('Variable created successfully');
      }
      setIsVariableModalOpen(false);
      setDirty(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage || 'Failed to save variable');
    }
  };

  const deleteVariable = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete variable "${name}"? This will delete all rules referencing this variable.`,
      )
    ) {
      try {
        await deleteVariableMutation.mutateAsync({ id, templateId });
        toast.success('Variable deleted successfully');
        setDirty(true);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast.error(errorMessage || 'Failed to delete variable');
      }
    }
  };

  // Rule Operations
  const openRuleModal = (rule?: TemplateRule) => {
    if (rule) {
      setSelectedRule(rule);
      setRuleType(rule.ruleType);
      interface RuleConfigClient {
        variableName?: string;
        difficulty?: string;
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
      }
      const config = rule.ruleConfig as unknown as RuleConfigClient;
      if (rule.ruleType === RuleType.DIFFICULTY) {
        setRuleTargetVar('');
        setRuleConfigDifficulty(config.difficulty || 'MEDIUM');
      } else {
        setRuleTargetVar(config.variableName || '');
        if (rule.ruleType === RuleType.RANGE) {
          setRuleConfigMin(config.min?.toString() || '');
          setRuleConfigMax(config.max?.toString() || '');
        } else if (rule.ruleType === RuleType.LENGTH) {
          setRuleConfigMinLength(config.minLength?.toString() || '');
          setRuleConfigMaxLength(config.maxLength?.toString() || '');
        } else if (rule.ruleType === RuleType.REGEX) {
          setRuleConfigPattern(config.pattern || '');
        }
      }
    } else {
      setSelectedRule(null);
      setRuleType(RuleType.DIFFICULTY);
      setRuleTargetVar('');
      setRuleConfigDifficulty('MEDIUM');
      setRuleConfigMin('');
      setRuleConfigMax('');
      setRuleConfigMinLength('');
      setRuleConfigMaxLength('');
      setRuleConfigPattern('');
    }
    setIsRuleModalOpen(true);
  };

  const getCompatibleRuleTypes = (varName: string): RuleType[] => {
    const variable = variables.find((v) => v.variableName === varName);
    if (!variable) return [];
    if (variable.variableType === VariableType.STRING) return [RuleType.LENGTH, RuleType.REGEX];
    if (variable.variableType === VariableType.NUMBER) return [RuleType.RANGE];
    if (variable.variableType === VariableType.BOOLEAN) return [];
    if (variable.variableType === VariableType.ARRAY) return [RuleType.LENGTH];
    if (variable.variableType === VariableType.CODE) return [RuleType.LENGTH, RuleType.REGEX];
    return [];
  };

  const saveRule = async (e: React.FormEvent) => {
    e.preventDefault();

    let configObj: Record<string, unknown> = {};

    if (ruleType === RuleType.DIFFICULTY) {
      configObj = { difficulty: ruleConfigDifficulty };
    } else {
      if (!ruleTargetVar) {
        toast.error('Target variable is required');
        return;
      }

      const variable = variables.find((v) => v.variableName === ruleTargetVar);
      if (!variable) {
        toast.error('Target variable does not exist');
        return;
      }

      // Compatibility check
      const compatibleTypes = getCompatibleRuleTypes(ruleTargetVar);
      if (!compatibleTypes.includes(ruleType)) {
        toast.error(
          `Rule type ${ruleType} is incompatible with variable type ${variable.variableType}`,
        );
        return;
      }

      if (ruleType === RuleType.RANGE) {
        const min = Number(ruleConfigMin);
        const max = Number(ruleConfigMax);
        if (isNaN(min) || isNaN(max)) {
          toast.error('Min and Max must be numbers');
          return;
        }
        if (min > max) {
          toast.error('Min cannot be greater than Max');
          return;
        }
        configObj = { variableName: ruleTargetVar, min, max };
      } else if (ruleType === RuleType.LENGTH) {
        const minL = Number(ruleConfigMinLength);
        const maxL = Number(ruleConfigMaxLength);
        if (isNaN(minL) || isNaN(maxL)) {
          toast.error('Min Length and Max Length must be numbers');
          return;
        }
        if (minL > maxL) {
          toast.error('Min Length cannot be greater than Max Length');
          return;
        }
        configObj = { variableName: ruleTargetVar, minLength: minL, maxLength: maxL };
      } else if (ruleType === RuleType.REGEX) {
        if (!ruleConfigPattern) {
          toast.error('Regex pattern is required');
          return;
        }
        try {
          new RegExp(ruleConfigPattern);
        } catch {
          toast.error('Invalid regex pattern');
          return;
        }
        configObj = { variableName: ruleTargetVar, pattern: ruleConfigPattern };
      }
    }

    try {
      const payload = {
        ruleType,
        ruleConfig: configObj,
      };

      if (selectedRule) {
        await updateRuleMutation.mutateAsync({
          id: selectedRule.id,
          templateId,
          payload,
        });
        toast.success('Rule updated successfully');
      } else {
        await createRuleMutation.mutateAsync({
          templateId,
          payload,
        });
        toast.success('Rule created successfully');
      }
      setIsRuleModalOpen(false);
      setDirty(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage || 'Failed to save rule');
    }
  };

  const deleteRule = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRuleMutation.mutateAsync({ id, templateId });
        toast.success('Rule deleted successfully');
        setDirty(true);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast.error(errorMessage || 'Failed to delete rule');
      }
    }
  };

  const isValid = validationErrors.length === 0;

  return (
    <div className='flex flex-col space-y-6 mt-4'>
      {/* Navigation */}
      <div className='flex flex-col space-y-2 mb-2'>
        <nav className='flex items-center text-sm text-gray-500 font-medium space-x-2'>
          <Link href='/admin/templates' className='hover:text-gray-900 transition-colors'>
            Template Library
          </Link>
          <ChevronRight className='h-4 w-4' />
          <span className='text-gray-900 dark:text-gray-100'>Template Builder</span>
        </nav>
        <Link
          href='/admin/templates'
          className='inline-flex items-center text-sm text-primary hover:underline w-fit'
        >
          <ArrowLeft className='h-4 w-4 mr-1' />
          Back to Templates
        </Link>
      </div>

      <div className='flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
            Variable Schema Manager
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Manage variable constraints and template rules, then validate inputs.
          </p>
        </div>
        <div className='flex items-center space-x-3'>
          <span className='text-sm font-medium text-gray-500'>Status:</span>
          {isValid ? (
            <Badge className='bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded text-xs flex items-center gap-1.5'>
              <CheckCircle className='h-3.5 w-3.5' /> Valid Schema
            </Badge>
          ) : (
            <Badge className='bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-1 rounded text-xs flex items-center gap-1.5'>
              <XCircle className='h-3.5 w-3.5' /> Invalid Schema
            </Badge>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Side: Builder Panels */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Variables Card */}
          <div className='bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                Variable Schemas
              </h2>
              <Button size='sm' onClick={() => openVariableModal()}>
                <Plus className='h-4 w-4 mr-1.5' /> Add Variable
              </Button>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-800'>
                  <tr>
                    <th className='px-6 py-3 font-semibold'>Variable</th>
                    <th className='px-6 py-3 font-semibold'>Type</th>
                    <th className='px-6 py-3 font-semibold'>Required</th>
                    <th className='px-6 py-3 font-semibold'>Default Value</th>
                    <th className='px-6 py-3 text-right font-semibold'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 dark:divide-gray-800'>
                  {variables.map((variable) => (
                    <tr
                      key={variable.id}
                      className='hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors'
                    >
                      <td className='px-6 py-4 font-mono font-medium text-gray-900 dark:text-gray-100'>
                        {variable.variableName}
                      </td>
                      <td className='px-6 py-4'>
                        <Badge variant='secondary' className='text-xs uppercase'>
                          {variable.variableType}
                        </Badge>
                      </td>
                      <td className='px-6 py-4'>
                        {variable.required ? (
                          <Badge className='bg-amber-500/10 text-amber-500 border border-amber-500/20'>
                            Required
                          </Badge>
                        ) : (
                          <span className='text-gray-400 text-xs'>Optional</span>
                        )}
                      </td>
                      <td className='px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400'>
                        {variable.defaultValue !== null ? variable.defaultValue : '-'}
                      </td>
                      <td className='px-6 py-4 text-right flex justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => openVariableModal(variable)}
                        >
                          <Edit className='h-4 w-4 text-gray-500 hover:text-gray-900' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => deleteVariable(variable.id, variable.variableName)}
                        >
                          <Trash2 className='h-4 w-4 text-rose-500 hover:text-rose-700' />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {variables.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'
                      >
                        No variables defined. Get started by adding a variable schema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rules Card */}
          <div className='bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                Template Rules
              </h2>
              <Button size='sm' onClick={() => openRuleModal()}>
                <Plus className='h-4 w-4 mr-1.5' /> Add Rule
              </Button>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-800'>
                  <tr>
                    <th className='px-6 py-3 font-semibold'>Rule Type</th>
                    <th className='px-6 py-3 font-semibold'>Target Variable</th>
                    <th className='px-6 py-3 font-semibold'>Configuration</th>
                    <th className='px-6 py-3 text-right font-semibold'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 dark:divide-gray-800'>
                  {rules.map((rule) => (
                    <tr
                      key={rule.id}
                      className='hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <Badge className='bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs uppercase'>
                          {rule.ruleType}
                        </Badge>
                      </td>
                      <td className='px-6 py-4 font-mono font-medium text-gray-900 dark:text-gray-100'>
                        {(rule.ruleConfig.variableName as string) || '-'}
                      </td>
                      <td className='px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate'>
                        {JSON.stringify(
                          Object.fromEntries(
                            Object.entries(rule.ruleConfig).filter(([k]) => k !== 'variableName'),
                          ),
                        )}
                      </td>
                      <td className='px-6 py-4 text-right flex justify-end gap-2'>
                        <Button variant='ghost' size='icon' onClick={() => openRuleModal(rule)}>
                          <Edit className='h-4 w-4 text-gray-500 hover:text-gray-900' />
                        </Button>
                        <Button variant='ghost' size='icon' onClick={() => deleteRule(rule.id)}>
                          <Trash2 className='h-4 w-4 text-rose-500 hover:text-rose-700' />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className='px-6 py-12 text-center text-gray-500 dark:text-gray-400'
                      >
                        No validation rules configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test Sandbox Panel */}
          <div className='bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden p-6'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2'>
              <FileCode className='h-5 w-5 text-indigo-500' /> Live Validation Sandbox
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
              Enter JSON inputs to run values validation against the configured variables and rules
              in real-time.
            </p>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col space-y-2'>
                <label className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                  Test Values JSON
                </label>
                <textarea
                  className='w-full h-40 p-3 bg-gray-50 dark:bg-gray-950 font-mono text-sm border border-gray-200 dark:border-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-primary'
                  value={sandboxInputsJson}
                  onChange={(e) => setSandboxInputsJson(e.target.value)}
                />
                <Button size='sm' className='w-fit' onClick={triggerValidation}>
                  Validate Sandbox Values
                </Button>
              </div>

              <div className='flex flex-col space-y-2'>
                <label className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                  Validation Result
                </label>
                <div className='flex-1 p-4 bg-gray-50 dark:bg-gray-950 rounded-md border border-gray-200 dark:border-gray-800 flex flex-col justify-between min-h-[160px]'>
                  <div>
                    {sandboxResult ? (
                      sandboxResult.valid ? (
                        <div className='text-emerald-500 font-semibold flex items-center gap-2 text-sm'>
                          <CheckCircle className='h-5 w-5' /> Sandbox values are valid!
                        </div>
                      ) : (
                        <div className='space-y-2'>
                          <div className='text-rose-500 font-semibold flex items-center gap-2 text-sm'>
                            <XCircle className='h-5 w-5' /> Sandbox values rejected
                          </div>
                          <ul className='list-disc list-inside text-xs text-rose-500 dark:text-rose-400 space-y-1 ml-1'>
                            {sandboxResult.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    ) : (
                      <span className='text-gray-400 text-xs'>Run validation to see results.</span>
                    )}
                  </div>
                  {validationErrors.length > 0 && (
                    <div className='mt-4 p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded flex items-start gap-2 text-xs'>
                      <AlertCircle className='h-4 w-4 shrink-0 mt-0.5' />
                      <div>
                        <strong>Schema Errors Exist:</strong>
                        <ul className='list-disc list-inside ml-1 mt-1'>
                          {validationErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Preview Panel */}
        <div className='space-y-6'>
          <div className='bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden p-6 h-full flex flex-col justify-between min-h-[500px]'>
            <div>
              <div className='flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-3'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  Schema Preview
                </h2>
                <Button variant='ghost' size='icon' onClick={handleCopyPreview}>
                  <Copy className='h-4 w-4 text-gray-500 hover:text-gray-900' />
                </Button>
              </div>

              <pre className='p-4 bg-gray-50 dark:bg-gray-950 font-mono text-xs rounded-md border border-gray-100 dark:border-gray-800 overflow-x-auto text-gray-700 dark:text-gray-300 max-h-[400px]'>
                {preview}
              </pre>
            </div>

            <div className='border-t border-gray-100 dark:border-gray-800 pt-4 mt-6 flex justify-between items-center'>
              <span className='text-sm font-medium text-gray-500'>State:</span>
              <span className='flex items-center gap-1.5 text-sm font-semibold'>
                {isDirty ? (
                  <Badge
                    variant='outline'
                    className='text-amber-500 border-amber-500/30 bg-amber-500/5'
                  >
                    Modified (isDirty)
                  </Badge>
                ) : (
                  <Badge
                    variant='outline'
                    className='text-emerald-500 border-emerald-500/30 bg-emerald-500/5'
                  >
                    Synced (isDirty: false)
                  </Badge>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Variable Form Modal */}
      <Modal isOpen={isVariableModalOpen} onClose={() => setIsVariableModalOpen(false)}>
        <form onSubmit={saveVariable} className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4'>
            {selectedVariable ? 'Edit Variable' : 'Create Variable'}
          </h3>

          <div className='space-y-2'>
            <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
              Variable Name
            </label>
            <Input
              type='text'
              placeholder='e.g., connection_timeout'
              value={varName}
              onChange={(e) => setVarName(e.target.value)}
              required
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
              Variable Type
            </label>
            <select
              className='w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-sm'
              value={varType}
              onChange={(e) => setVarType(e.target.value as VariableType)}
            >
              {Object.values(VariableType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className='flex items-center justify-between py-2 border-y border-gray-100 dark:border-gray-800 my-2'>
            <div>
              <span className='text-sm font-semibold text-gray-700 dark:text-gray-300 block'>
                Required
              </span>
              <span className='text-xs text-gray-500'>Validation fails if value is missing</span>
            </div>
            <Switch checked={varRequired} onCheckedChange={setVarRequired} />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-semibold text-gray-700 dark:text-gray-300 block'>
              Default Value <span className='text-xs font-normal text-gray-400'>(Optional)</span>
            </label>
            <Input
              type='text'
              placeholder={varType === VariableType.ARRAY ? '[1, 2, 3]' : 'e.g., 30'}
              value={varDefaultValue}
              onChange={(e) => setVarDefaultValue(e.target.value)}
            />
          </div>

          <div className='flex justify-end space-x-2 pt-4 border-t'>
            <Button type='button' variant='outline' onClick={() => setIsVariableModalOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>Save Variable</Button>
          </div>
        </form>
      </Modal>

      {/* Rule Form Modal */}
      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)}>
        <form onSubmit={saveRule} className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 mb-4'>
            {selectedRule ? 'Edit Rule' : 'Add Rule'}
          </h3>

          <div className='space-y-2'>
            <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
              Rule Type
            </label>
            <select
              className='w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-sm'
              value={ruleType}
              onChange={(e) => {
                const type = e.target.value as RuleType;
                setRuleType(type);
                if (type === RuleType.DIFFICULTY) {
                  setRuleTargetVar('');
                }
              }}
            >
              {Object.values(RuleType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {ruleType !== RuleType.DIFFICULTY && (
            <div className='space-y-2'>
              <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                Target Variable
              </label>
              <select
                className='w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-sm'
                value={ruleTargetVar}
                onChange={(e) => setRuleTargetVar(e.target.value)}
                required
              >
                <option value=''>-- Select Variable --</option>
                {variables.map((v) => {
                  const compatible = getCompatibleRuleTypes(v.variableName).includes(ruleType);
                  return (
                    <option key={v.id} value={v.variableName} disabled={!compatible}>
                      {v.variableName} ({v.variableType}) {!compatible ? ' [Incompatible]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Dynamic Rule Configurations */}
          {ruleType === RuleType.DIFFICULTY && (
            <div className='space-y-2'>
              <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                Difficulty
              </label>
              <select
                className='w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-sm'
                value={ruleConfigDifficulty}
                onChange={(e) => setRuleConfigDifficulty(e.target.value)}
              >
                <option value='EASY'>EASY</option>
                <option value='MEDIUM'>MEDIUM</option>
                <option value='HARD'>HARD</option>
              </select>
            </div>
          )}

          {ruleType === RuleType.RANGE && (
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                  Min Value
                </label>
                <Input
                  type='number'
                  value={ruleConfigMin}
                  onChange={(e) => setRuleConfigMin(e.target.value)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                  Max Value
                </label>
                <Input
                  type='number'
                  value={ruleConfigMax}
                  onChange={(e) => setRuleConfigMax(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {ruleType === RuleType.LENGTH && (
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                  Min Length
                </label>
                <Input
                  type='number'
                  value={ruleConfigMinLength}
                  onChange={(e) => setRuleConfigMinLength(e.target.value)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                  Max Length
                </label>
                <Input
                  type='number'
                  value={ruleConfigMaxLength}
                  onChange={(e) => setRuleConfigMaxLength(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {ruleType === RuleType.REGEX && (
            <div className='space-y-2'>
              <label className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                Regex Pattern
              </label>
              <Input
                type='text'
                placeholder='e.g., ^[A-Z]+$'
                value={ruleConfigPattern}
                onChange={(e) => setRuleConfigPattern(e.target.value)}
                required
              />
            </div>
          )}

          <div className='flex justify-end space-x-2 pt-4 border-t'>
            <Button type='button' variant='outline' onClick={() => setIsRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type='submit'>Save Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
