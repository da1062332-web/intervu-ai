'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateBlueprint } from '@/services/blueprints';
import toast from 'react-hot-toast';

interface CreateBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBlueprintModal({ isOpen, onClose }: CreateBlueprintModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuestions, setTotalQuestions] = useState<number>(40);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<number>(90);

  const { mutateAsync: createBlueprint, isPending } = useCreateBlueprint();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !code || totalQuestions <= 0 || totalDurationMinutes <= 0) {
      toast.error('Please fill all required fields correctly.');
      return;
    }

    try {
      await createBlueprint({
        name,
        code,
        description,
        totalQuestions,
        totalDurationMinutes,
        isActive: true,
      } as any);
      toast.success('Blueprint created successfully');
      setName('');
      setCode('');
      setDescription('');
      setTotalQuestions(40);
      setTotalDurationMinutes(90);
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to create blueprint');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className='max-w-xl'>
      <div className='mb-4'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Create Blueprint</h2>
        <p className='text-sm text-gray-500 mt-1'>Define a new exam configuration blueprint.</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-1'>
          <Label htmlFor='name'>Blueprint Name *</Label>
          <Input
            id='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. Full Stack Developer L1'
            disabled={isPending}
            required
          />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='code'>Code *</Label>
          <Input
            id='code'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder='e.g. FSD_L1_001'
            disabled={isPending}
            required
          />
        </div>

        <div className='space-y-1'>
          <Label htmlFor='description'>Description</Label>
          <Input
            id='description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Optional details about this blueprint'
            disabled={isPending}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <Label htmlFor='totalQuestions'>Total Questions *</Label>
            <Input
              id='totalQuestions'
              type='number'
              min={1}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              disabled={isPending}
              required
            />
          </div>

          <div className='space-y-1'>
            <Label htmlFor='totalDurationMinutes'>Total Duration (Minutes) *</Label>
            <Input
              id='totalDurationMinutes'
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
            {isPending ? 'Creating...' : 'Create Blueprint'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
