'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateBlueprint } from '@/services/blueprints';
import type { BlueprintConfig } from '@/services/blueprints';
import toast from 'react-hot-toast';

interface EditBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: BlueprintConfig | null;
}

export function EditBlueprintModal({ isOpen, onClose, blueprint }: EditBlueprintModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuestions, setTotalQuestions] = useState<number>(40);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<number>(90);

  useEffect(() => {
    if (blueprint) {
      setName(blueprint.name || '');
      setCode(blueprint.code || '');
      setDescription(blueprint.description || '');
      setTotalQuestions(blueprint.totalQuestions || 40);
      setTotalDurationMinutes(blueprint.totalDurationMinutes || 90);
    }
  }, [blueprint]);

  const { mutateAsync: updateBlueprint, isPending } = useUpdateBlueprint();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blueprint) return;

    if (!name || !code || totalQuestions <= 0 || totalDurationMinutes <= 0) {
      toast.error('Please fill all required fields correctly.');
      return;
    }

    try {
      await updateBlueprint({
        id: blueprint.id,
        data: {
          name,
          code,
          description,
          totalQuestions,
          totalDurationMinutes,
        },
      });
      toast.success('Blueprint updated successfully');
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to update blueprint');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-xl'>
      <div className='mb-4'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Edit Blueprint</h2>
        <p className='text-sm text-gray-500 mt-1'>Update the metadata for this exam blueprint.</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-1'>
          <Label htmlFor='edit-name'>Blueprint Name *</Label>
          <Input
            id='edit-name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='edit-code'>Code *</Label>
          <Input
            id='edit-code'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='edit-description'>Description</Label>
          <Input
            id='edit-description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <Label htmlFor='edit-totalQuestions'>Total Questions *</Label>
            <Input
              id='edit-totalQuestions'
              type='number'
              min={1}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              disabled={isPending}
              required
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='edit-totalDurationMinutes'>Total Duration (Minutes) *</Label>
            <Input
              id='edit-totalDurationMinutes'
              type='number'
              min={1}
              value={totalDurationMinutes}
              onChange={(e) => setTotalDurationMinutes(Number(e.target.value))}
              disabled={isPending}
              required
            />
          </div>
        </div>

        <div className='mt-6 flex justify-end space-x-3'>
          <Button variant='outline' type='button' onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
