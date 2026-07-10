import React, { useState } from 'react';
import { TemplateSection } from './TemplateSection';
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
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface Variable {
  id: string;
  name: string;
  dataType: string;
  generationRule: string;
  valueRange: string;
}

export function VariableBuilderSection() {
  // Temporary local state
  // TODO: Replace with Variable CRUD APIs (POST, PATCH, DELETE)
  const [variables, setVariables] = useState<Variable[]>([
    {
      id: '1',
      name: 'oldPrice',
      dataType: 'Integer',
      generationRule: 'Random',
      valueRange: '100-500',
    },
    {
      id: '2',
      name: 'newPrice',
      dataType: 'Integer',
      generationRule: 'Formula',
      valueRange: 'oldPrice * 1.2',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Variable, 'id'>>({
    name: '',
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
        name: variable.name,
        dataType: variable.dataType,
        generationRule: variable.generationRule,
        valueRange: variable.valueRange,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        dataType: 'Integer',
        generationRule: 'Random',
        valueRange: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setError(null);
    if (!formData.name.trim()) {
      setError('Variable Name is required');
      return;
    }
    if (!formData.generationRule) {
      setError('Generation Rule is required');
      return;
    }

    const duplicate = variables.find((v) => v.name === formData.name && v.id !== editingId);
    if (duplicate) {
      setError('A variable with this name already exists');
      return;
    }

    if (editingId) {
      // TODO: Replace with PATCH /templates/:id/variables/:varId
      setVariables((prev) =>
        prev.map((v) => (v.id === editingId ? { ...formData, id: editingId } : v)),
      );
    } else {
      // TODO: Replace with POST /templates/:id/variables
      const newVar: Variable = { ...formData, id: Math.random().toString(36).substr(2, 9) };
      setVariables((prev) => [...prev, newVar]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    // TODO: Replace with DELETE /templates/:id/variables/:varId
    setVariables((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <TemplateSection
      title='Variable Builder'
      description='Define the variables that will be used in the question statement and solution logic.'
      actions={
        <Button onClick={() => openModal()} size='sm'>
          <Plus className='w-4 h-4 mr-2' />
          Add Variable
        </Button>
      }
    >
      <div className='border rounded-md overflow-x-auto shadow-sm'>
        <Table>
          <TableHeader className='bg-gray-50 dark:bg-gray-900'>
            <TableRow>
              <TableHead scope='col'>Variable Name</TableHead>
              <TableHead scope='col'>Data Type</TableHead>
              <TableHead scope='col'>Generation Rule</TableHead>
              <TableHead scope='col'>Value / Range</TableHead>
              <TableHead scope='col' className='text-right'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                  No variables defined. Click "Add Variable" to create one.
                </TableCell>
              </TableRow>
            ) : (
              variables.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className='font-mono text-sm'>{v.name}</TableCell>
                  <TableCell>
                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
                      {v.dataType}
                    </span>
                  </TableCell>
                  <TableCell>{v.generationRule}</TableCell>
                  <TableCell className='font-mono text-xs'>{v.valueRange}</TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => openModal(v)}
                      aria-label={`Edit ${v.name}`}
                    >
                      <Edit2 className='w-4 h-4 text-gray-500 hover:text-indigo-600' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDelete(v.id)}
                      aria-label={`Delete ${v.name}`}
                    >
                      <Trash2 className='w-4 h-4 text-gray-500 hover:text-red-600' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className='space-y-4 max-w-md w-full'>
          <h2 className='text-xl font-semibold'>{editingId ? 'Edit Variable' : 'Add Variable'}</h2>

          {error && <div className='p-3 bg-red-50 text-red-700 rounded-md text-sm'>{error}</div>}

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='varName'>Variable Name *</Label>
              <Input
                id='varName'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g. oldPrice'
                aria-invalid={error && error.includes('Name') ? 'true' : 'false'}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='varDataType'>Data Type *</Label>
              <select
                id='varDataType'
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                className='flex h-10 w-full rounded-md border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value='Integer'>Integer</option>
                <option value='Decimal'>Decimal</option>
                <option value='Text'>Text</option>
                <option value='Boolean'>Boolean</option>
              </select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='varGenRule'>Generation Rule *</Label>
              <select
                id='varGenRule'
                value={formData.generationRule}
                onChange={(e) => setFormData({ ...formData, generationRule: e.target.value })}
                className='flex h-10 w-full rounded-md border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value='Random'>Random</option>
                <option value='Formula'>Formula</option>
                <option value='Static'>Static</option>
                <option value='Allow'>Allow (Provided in Request)</option>
              </select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='varValue'>Value / Range</Label>
              <Input
                id='varValue'
                value={formData.valueRange}
                onChange={(e) => setFormData({ ...formData, valueRange: e.target.value })}
                placeholder={
                  formData.generationRule === 'Random' ? 'e.g. 10-100' : 'e.g. 42 or expression'
                }
              />
            </div>
          </div>

          <div className='flex justify-end gap-2 mt-6'>
            <Button variant='outline' onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Variable'}</Button>
          </div>
        </div>
      </Modal>
    </TemplateSection>
  );
}
