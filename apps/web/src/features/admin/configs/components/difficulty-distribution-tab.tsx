'use client';

import React, { useState, useEffect } from 'react';
import {
  useDifficultyDistribution,
  useUpdateDifficultyDistribution,
} from '../hooks/use-difficulty-distribution';
import { UpdateDifficultyDistributionSchema } from '@intervu/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DifficultyDistributionTabProps {
  configId: string;
}

export function DifficultyDistributionTab({ configId }: DifficultyDistributionTabProps) {
  const { data: distribution, isLoading } = useDifficultyDistribution(configId);
  const { mutate: updateDistribution, isPending } = useUpdateDifficultyDistribution(configId);

  const [easyCount, setEasyCount] = useState<number>(0);
  const [mediumCount, setMediumCount] = useState<number>(0);
  const [hardCount, setHardCount] = useState<number>(0);

  useEffect(() => {
    if (distribution) {
      setEasyCount(distribution.easyCount);
      setMediumCount(distribution.mediumCount);
      setHardCount(distribution.hardCount);
    }
  }, [distribution]);

  const totalQuestions = easyCount + mediumCount + hardCount;

  const handleSave = () => {
    if (totalQuestions <= 0) {
      toast.error('Invalid Distribution', { description: 'At least one question must exist.' });
      return;
    }

    const payload = { easyCount, mediumCount, hardCount };
    const validation = UpdateDifficultyDistributionSchema.safeParse(payload);

    if (!validation.success) {
      toast.error('Validation Error', { description: 'Counts cannot be negative.' });
      return;
    }

    updateDistribution(validation.data, {
      onSuccess: () => {
        toast.success('Success', { description: 'Difficulty distribution updated successfully.' });
      },
      onError: (err: Error) => {
        toast.error('Error', { description: err.message || 'Failed to update distribution.' });
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className='space-y-6 max-w-xl'>
      <div>
        <h3 className='text-lg font-medium'>Difficulty Distribution</h3>
        <p className='text-sm text-muted-foreground'>
          Configure the number of Easy, Medium, and Hard questions for this exam configuration.
        </p>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='easy-count'>Easy Questions</Label>
          <Input
            id='easy-count'
            type='number'
            min={0}
            value={easyCount}
            onChange={(e) => setEasyCount(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='medium-count'>Medium Questions</Label>
          <Input
            id='medium-count'
            type='number'
            min={0}
            value={mediumCount}
            onChange={(e) => setMediumCount(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='hard-count'>Hard Questions</Label>
          <Input
            id='hard-count'
            type='number'
            min={0}
            value={hardCount}
            onChange={(e) => setHardCount(Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className='flex items-center justify-between pt-4 border-t'>
        <div className='font-medium text-lg'>
          Total Questions: <span className='text-primary'>{totalQuestions}</span>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Distribution'}
        </Button>
      </div>
    </div>
  );
}
