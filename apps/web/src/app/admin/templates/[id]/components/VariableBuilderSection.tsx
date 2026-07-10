import React, { useState } from 'react';
import { TemplateSection } from './TemplateSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useParams } from 'next/navigation';
import { 
  useTemplateVariables, 
  useCreateVariable, 
  useUpdateVariable, 
  useDeleteVariable 
} from '@/services/templates/hooks';

interface Variable {
  id: string;
  variableName: string;
  dataType: string;
  generationRule: string;
  valueRange: string;
}

export function VariableBuilderSection() {
  const { id: templateId } = useParams() as { id: string };
  
  const { data: variablesResponse, isLoading: isLoadingVariables } = useTemplateVariables(templateId);
  const rawVariables = Array.isArray(variablesResponse) ? variablesResponse : (variablesResponse?.data || []);
  const variables: Variable[] = rawVariables.map((v: any) => {
    let dataType = 'Text';
    if (v.variableType === 'NUMBER') dataType = 'Integer';
    if (v.variableType === 'BOOLEAN') dataType = 'Boolean';

    return {
      id: v.id,
      variableName: v.variableName,
      dataType,
      generationRule: 'Static',
      valueRange: String(v.defaultValue || '')
    };
  });

  const { mutate: createVar, isPending: isCreating } = useCreateVariable();
  const { mutate: updateVar, isPending: isUpdating } = useUpdateVariable();
  const { mutate: deleteVar, isPending: isDeleting } = useDeleteVariable();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Variable, 'id'>>({
    variableName: '',
    dataType: 'Integer',
    generationRule: 'Random',
    valueRange: '',
  });
  const [error, setError] = useState<string | null>(null);

  const openModal = (variable?: Variable) => {
    setError(null);
    if (variable) {
      setEditingId(variable.id);
      setFormData({
        variableName: variable.variableName,
        dataType: variable.dataType,
        generationRule: variable.generationRule,
        valueRange: variable.valueRange,
      });
    } else {
      setEditingId(null);
      setFormData({
        variableName: '',
        dataType: 'Integer',
        generationRule: 'Random',
        valueRange: '',
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
    if (!formData.generationRule) {
      setError('Generation Rule is required');
      return;
    }
    
    const duplicate = variables.find(v => v.variableName === formData.variableName && v.id !== editingId);
    if (duplicate) {
      setError('A variable with this name already exists');
      return;
    }

    const getVariableType = (uiType: string) => {
      if (uiType === 'Integer' || uiType === 'Decimal') return 'NUMBER';
      if (uiType === 'Boolean') return 'BOOLEAN';
      return 'STRING';
    };

    const varType = getVariableType(formData.dataType);
    let finalDefaultValue: any = null;
    
    if (formData.valueRange !== '') {
      if (varType === 'NUMBER') {
        const num = Number(formData.valueRange);
        finalDefaultValue = isNaN(num) ? formData.valueRange : num;
      } else if (varType === 'BOOLEAN') {
        finalDefaultValue = formData.valueRange === 'true' || formData.valueRange === '1';
      } else {
        finalDefaultValue = formData.valueRange;
      }
    }

    const payload = {
      variableName: formData.variableName,
      variableType: varType,
      required: false,
      defaultValue: finalDefaultValue
    };

    const extractError = (err: any, fallback: string) => {
      const msg = err?.response?.data?.message || err?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      return msg || fallback;
    };

    if (editingId) {
      updateVar({
        templateId,
        variableId: editingId,
        payload,
      }, {
        onSuccess: () => setIsModalOpen(false),
        onError: (err: any) => setError(extractError(err, 'Failed to update variable'))
      });
    } else {
      createVar({
        templateId,
        payload,
      }, {
        onSuccess: () => setIsModalOpen(false),
        onError: (err: any) => setError(extractError(err, 'Failed to create variable'))
      });
    }
  };

  const handleDelete = (varId: string) => {
    if (confirm('Are you sure you want to delete this variable?')) {
      deleteVar({ templateId, variableId: varId });
    }
  };

  return (
    <TemplateSection
      title="Variable Builder"
      description="Define the variables that will be used in the question statement and solution logic."
      actions={
        <Button onClick={() => openModal()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Variable
        </Button>
      }
    >
      <div className="border rounded-md overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900">
            <TableRow>
              <TableHead scope="col">Variable Name</TableHead>
              <TableHead scope="col">Data Type</TableHead>
              <TableHead scope="col">Generation Rule</TableHead>
              <TableHead scope="col">Value / Range</TableHead>
              <TableHead scope="col" className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingVariables ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : variables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No variables defined. Click "Add Variable" to create one.
                </TableCell>
              </TableRow>
            ) : (
              variables.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-sm">{v.variableName}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {v.dataType}
                    </span>
                  </TableCell>
                  <TableCell>{v.generationRule}</TableCell>
                  <TableCell className="font-mono text-xs">{v.valueRange}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModal(v)} aria-label={`Edit ${v.variableName}`} disabled={isDeleting}>
                      <Edit2 className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)} aria-label={`Delete ${v.variableName}`} disabled={isDeleting}>
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
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Variable' : 'Add Variable'}</h2>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="varName">Variable Name *</Label>
              <Input
                id="varName"
                value={formData.variableName}
                onChange={e => setFormData({ ...formData, variableName: e.target.value })}
                placeholder="e.g. oldPrice"
                aria-invalid={error && error.includes('Name') ? 'true' : 'false'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="varDataType">Data Type *</Label>
              <select
                id="varDataType"
                value={formData.dataType}
                onChange={e => setFormData({ ...formData, dataType: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Integer">Integer</option>
                <option value="Decimal">Decimal</option>
                <option value="Text">Text</option>
                <option value="Boolean">Boolean</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="varGenRule">Generation Rule *</Label>
              <select
                id="varGenRule"
                value={formData.generationRule}
                onChange={e => setFormData({ ...formData, generationRule: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Random">Random</option>
                <option value="Formula">Formula</option>
                <option value="Static">Static</option>
                <option value="Allow">Allow (Provided in Request)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="varValue">Value / Range</Label>
              <Input
                id="varValue"
                value={formData.valueRange}
                onChange={e => setFormData({ ...formData, valueRange: e.target.value })}
                placeholder={formData.generationRule === 'Random' ? 'e.g. 10-100' : 'e.g. 42 or expression'}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Variable'}
            </Button>
          </div>
        </div>
      </Modal>
    </TemplateSection>
  );
}
