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

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className='max-w-2xl mx-auto space-y-8 py-4'>
      <div className='space-y-1'>
        <h3 className='text-2xl font-semibold tracking-tight'>Difficulty Distribution</h3>
        <p className='text-muted-foreground'>
          Configure the percentage distribution of Easy, Medium, and Hard questions. The total must
          equal 100%.
        </p>
      </div>

      <div className='grid gap-6 p-6 border rounded-xl bg-card shadow-sm'>
        <div className='flex items-center gap-4'>
          <Label htmlFor='easy-percentage' className='w-24 text-right font-medium'>Easy %</Label>
          <div className='flex-1'>
            <Input
              id='easy-percentage'
              type='number'
              min={0}
              max={100}
              className='text-lg font-medium'
              value={easyPercentage}
              onChange={(e) => handlePercentageChange(e.target.value, setEasyPercentage)}
            />
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <Label htmlFor='medium-percentage' className='w-24 text-right font-medium'>Medium %</Label>
          <div className='flex-1'>
            <Input
              id='medium-percentage'
              type='number'
              min={0}
              max={100}
              className='text-lg font-medium'
              value={mediumPercentage}
              onChange={(e) => handlePercentageChange(e.target.value, setMediumPercentage)}
            />
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <Label htmlFor='hard-percentage' className='w-24 text-right font-medium'>Hard %</Label>
          <div className='flex-1'>
            <Input
              id='hard-percentage'
              type='number'
              min={0}
              max={100}
              className='text-lg font-medium'
              value={hardPercentage}
              onChange={(e) => handlePercentageChange(e.target.value, setHardPercentage)}
            />
          </div>
        </div>
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30'>
        <div className='font-medium text-lg flex items-center space-x-3'>
          <span className='text-muted-foreground'>Total Distribution:</span>
          <span
            className={`text-2xl font-bold ${
              isValid ? 'text-green-600 dark:text-green-400' : 'text-destructive'
            }`}
          >
            {totalPercentage}%
          </span>
          <span
            className={`text-sm px-3 py-1 rounded-full font-semibold shadow-sm ${
              isValid
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {isValid ? '✓ VALID' : '✗ INVALID'}
          </span>
        </div>
        <Button onClick={handleSave} disabled={isPending || !isValid} size="lg" className='w-full sm:w-auto font-semibold shadow-sm'>
          {isPending ? 'Saving...' : 'Save Distribution'}
        </Button>
      </div>
    </div>
  );
}
