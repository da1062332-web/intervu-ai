import React, { useState } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useParams } from 'next/navigation';
import { 
  useTemplateRules, 
  useTemplateVariables,
  useCreateRule, 
  useUpdateRule, 
  useDeleteRule 
} from '@/services/templates/hooks';

interface Constraint {
  id: string;
  variableName: string;
  operator: string;
  value: string;
}

export function ConstraintBuilderSection() {
  const { id: templateId } = useParams() as { id: string };

  const { data: rulesResponse, isLoading: isLoadingRules } = useTemplateRules(templateId);
  const { data: variablesResponse } = useTemplateVariables(templateId);
  
  const rawVariables = Array.isArray(variablesResponse) ? variablesResponse : (variablesResponse?.data || []);
  const availableVariables = rawVariables;

  const rawRules = Array.isArray(rulesResponse) ? rulesResponse : (rulesResponse?.data || []);
  const constraints: Constraint[] = rawRules.map((r: any) => {
    return {
      id: r.id,
      variableName: r.ruleConfig?.variableName || '',
      operator: r.ruleConfig?.operator || '>',
      value: r.ruleConfig?.value || ''
    };
  });

  const { mutate: createRule, isPending: isCreating } = useCreateRule();
  const { mutate: updateRule, isPending: isUpdating } = useUpdateRule();
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteRule();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Constraint, 'id'>>({
    variableName: '',
    operator: '>',
    value: '',
  });
  const [error, setError] = useState<string | null>(null);

  const openModal = (constraint?: Constraint) => {
    setError(null);
    if (constraint) {
      setEditingId(constraint.id);
      setFormData({
        variableName: constraint.variableName,
        operator: constraint.operator,
        value: constraint.value,
      });
    } else {
      setEditingId(null);
      setFormData({
        variableName: '',
        operator: '>',
        value: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setError(null);
    if (!formData.variableName.trim()) {
      setError('Variable Name is required');
      return;
    }
    if (!formData.value.trim()) {
      setError('Value is required');
      return;
    }
    const getRuleType = (op: string) => {
      if (op === 'Regex') return 'REGEX';
      if (op === 'Formula' || op === 'Custom') return 'DIFFICULTY'; // Fallback
      return 'RANGE';
    };

    const ruleType = getRuleType(formData.operator);
    const ruleConfig: any = {
      variableName: formData.variableName,
      operator: formData.operator,
      value: formData.value
    };

    if (ruleType === 'RANGE') {
      const numVal = Number(formData.value);
      if (!isNaN(numVal)) {
        if (formData.operator === '>') {
          ruleConfig.min = numVal;
          ruleConfig.max = Number.MAX_SAFE_INTEGER;
        } else if (formData.operator === '>=') {
          ruleConfig.min = numVal;
          ruleConfig.max = Number.MAX_SAFE_INTEGER;
        } else if (formData.operator === '<') {
          ruleConfig.min = Number.MIN_SAFE_INTEGER;
          ruleConfig.max = numVal;
        } else if (formData.operator === '<=') {
          ruleConfig.min = Number.MIN_SAFE_INTEGER;
          ruleConfig.max = numVal;
        } else if (formData.operator === '=') {
          ruleConfig.min = numVal;
          ruleConfig.max = numVal;
        } else {
          ruleConfig.min = Number.MIN_SAFE_INTEGER;
          ruleConfig.max = Number.MAX_SAFE_INTEGER;
        }
      } else {
        ruleConfig.min = Number.MIN_SAFE_INTEGER;
        ruleConfig.max = Number.MAX_SAFE_INTEGER;
      }
    } else if (ruleType === 'REGEX') {
      ruleConfig.pattern = formData.value;
    }

    const payload = {
      ruleType,
      ruleConfig
    };

    const extractError = (err: any, fallback: string) => {
      const msg = err?.response?.data?.message || err?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      return msg || fallback;
    };

    if (editingId) {
      updateRule({
        templateId,
        ruleId: editingId,
        payload,
      }, {
        onSuccess: () => setIsModalOpen(false),
        onError: (err: any) => setError(extractError(err, 'Failed to update constraint'))
      });
    } else {
      createRule({
        templateId,
        payload,
      }, {
        onSuccess: () => setIsModalOpen(false),
        onError: (err: any) => setError(extractError(err, 'Failed to create constraint'))
      });
    }
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this constraint?')) {
      deleteRule({ templateId, ruleId });
    }
  };

  return (
    <TemplateSection
      title="Constraint Builder"
      description="Define logical constraints and rules that variables must satisfy during test generation."
      actions={
        <Button onClick={() => openModal()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Constraint
        </Button>
      }
    >
      <div className="border rounded-md overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900">
            <TableRow>
              <TableHead scope="col">Variable</TableHead>
              <TableHead scope="col">Operator</TableHead>
              <TableHead scope="col">Value / Expression</TableHead>
              <TableHead scope="col" className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRules ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : constraints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No constraints defined. Click "Add Constraint" to create one.
                </TableCell>
              </TableRow>
            ) : (
              constraints.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm font-medium text-indigo-700 dark:text-indigo-400">
                    {c.variableName}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      {c.operator}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{c.value}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModal(c)} aria-label={`Edit constraint for ${c.variableName}`} disabled={isDeleting}>
                      <Edit2 className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} aria-label={`Delete constraint for ${c.variableName}`} disabled={isDeleting}>
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-4 max-w-md w-full">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Constraint' : 'Add Constraint'}</h2>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="constraintVarName">Variable Name *</Label>
              <select
                id="constraintVarName"
                value={formData.variableName}
                onChange={e => setFormData({ ...formData, variableName: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select a variable</option>
                {availableVariables.map((v: any) => (
                  <option key={v.id} value={v.variableName}>{v.variableName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraintOp">Operator *</Label>
              <select
                id="constraintOp"
                value={formData.operator}
                onChange={e => setFormData({ ...formData, operator: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                <option value=">">&gt; (Greater than)</option>
                <option value="<">&lt; (Less than)</option>
                <option value=">=">&gt;= (Greater or equal)</option>
                <option value="<=">&lt;= (Less or equal)</option>
                <option value="=">= (Equals)</option>
                <option value="!=">!= (Not equals)</option>
                <option value="Regex">Regex</option>
                <option value="Formula">Formula</option>
                <option value="Custom">Custom Logic</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraintValue">Value / Expression *</Label>
              <Input
                id="constraintValue"
                value={formData.value}
                onChange={e => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.operator === 'Regex' ? '^\\d+$' : 'e.g. oldPrice or 100'}
                aria-invalid={error && error.includes('Value') ? 'true' : 'false'}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Constraint'}
            </Button>
          </div>
        </div>
      </Modal>
    </TemplateSection>
  );
}
