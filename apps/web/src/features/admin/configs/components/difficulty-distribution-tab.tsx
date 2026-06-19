'use client';

import React, { useState, useEffect } from 'react';
import {
  useDifficultyDistribution,
  useSaveDistribution,
} from '../hooks/use-difficulty-distribution';
import { useConfigRulesStore } from '@/store/config-rules.store';
import { z } from 'zod';
import type { UpdateDifficultyDistributionDto } from '@intervu/shared';

const UpdateDifficultyDistributionSchema = z.object({
  easyPercentage: z.number().int().min(0).max(100),
  mediumPercentage: z.number().int().min(0).max(100),
  hardPercentage: z.number().int().min(0).max(100),
});
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DifficultyDistributionTabProps {
  configId: string;
}

export function DifficultyDistributionTab({ configId }: DifficultyDistributionTabProps) {
  const { data: distribution, isLoading } = useDifficultyDistribution(configId);
  const { mutate: saveDistribution, isPending } = useSaveDistribution(configId);

  const [easyPercentage, setEasyPercentage] = useState<number>(0);
  const [mediumPercentage, setMediumPercentage] = useState<number>(0);
  const [hardPercentage, setHardPercentage] = useState<number>(0);

  const { setDistribution, setDirty } = useConfigRulesStore();

  useEffect(() => {
    if (distribution) {
      setEasyPercentage(distribution.easyPercentage);
      setMediumPercentage(distribution.mediumPercentage);
      setHardPercentage(distribution.hardPercentage);
    }
  }, [distribution]);

  const totalPercentage = easyPercentage + mediumPercentage + hardPercentage;
  const isValid = totalPercentage === 100;

  const handlePercentageChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    const parsed = Math.max(0, Math.min(100, parseInt(value) || 0));
    setter(parsed);
    setDirty(true);
  };

  useEffect(() => {
    setDistribution({
      easyPercentage,
      mediumPercentage,
      hardPercentage,
    });
  }, [easyPercentage, mediumPercentage, hardPercentage, setDistribution]);

  const handleSave = () => {
    if (totalPercentage !== 100) {
      toast.error('Invalid Distribution', {
        description: `Total percentage must equal 100%. Current: ${totalPercentage}%`,
      });
      return;
    }

    const payload = { easyPercentage, mediumPercentage, hardPercentage };
    const validation = UpdateDifficultyDistributionSchema.safeParse(payload);

    if (!validation.success) {
      toast.error('Validation Error', { description: 'Percentages must be between 0 and 100.' });
      return;
    }

    saveDistribution(validation.data, {
      onSuccess: () => {
        toast.success('Success', { description: 'Difficulty distribution updated successfully.' });
        setDirty(false);
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
          Configure the percentage distribution of Easy, Medium, and Hard questions. The total must equal 100%.
        </p>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='easy-percentage'>Easy %</Label>
          <Input
            id='easy-percentage'
            type='number'
            min={0}
            max={100}
            value={easyPercentage}
            onChange={(e) => handlePercentageChange(e.target.value, setEasyPercentage)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='medium-percentage'>Medium %</Label>
          <Input
            id='medium-percentage'
            type='number'
            min={0}
            max={100}
            value={mediumPercentage}
            onChange={(e) => handlePercentageChange(e.target.value, setMediumPercentage)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='hard-percentage'>Hard %</Label>
          <Input
            id='hard-percentage'
            type='number'
            min={0}
            max={100}
            value={hardPercentage}
            onChange={(e) => handlePercentageChange(e.target.value, setHardPercentage)}
          />
        </div>
      </div>

      <div className='flex items-center justify-between pt-4 border-t'>
        <div className='font-medium text-lg flex items-center space-x-2'>
          <span>Total:</span>
          <span className={isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {totalPercentage}%
          </span>
          <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${
            isValid 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isValid ? '✓ VALID' : '✗ INVALID'}
          </span>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Distribution'}
        </Button>
      </div>
    </div>
  );
}
