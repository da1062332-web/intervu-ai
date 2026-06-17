'use client';

import React, { useState, useEffect } from 'react';
import { useRuleFlags, useUpdateRuleFlags } from '../hooks/use-rule-flags';
import { z } from 'zod';
import type { UpdateRuleFlags } from '@intervu/shared';

const UpdateRuleFlagsSchema = z.object({
  negativeMarkingEnabled: z.boolean(),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  calculatorAllowed: z.boolean(),
  sectionLockingEnabled: z.boolean(),
  freeNavigationEnabled: z.boolean(),
});
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface RuleFlagsTabProps {
  configId: string;
  onNext?: () => void;
}

export function RuleFlagsTab({ configId, onNext }: RuleFlagsTabProps) {
  const { data: ruleFlags, isLoading } = useRuleFlags(configId);
  const { mutate: updateRuleFlags, isPending } = useUpdateRuleFlags(configId);

  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [calculatorAllowed, setCalculatorAllowed] = useState(false);
  const [sectionLockingEnabled, setSectionLockingEnabled] = useState(false);
  const [freeNavigationEnabled, setFreeNavigationEnabled] = useState(true);

  useEffect(() => {
    if (ruleFlags) {
      setNegativeMarkingEnabled(ruleFlags.negativeMarkingEnabled);
      setRandomizeQuestions(ruleFlags.randomizeQuestions);
      setRandomizeOptions(ruleFlags.randomizeOptions);
      setCalculatorAllowed(ruleFlags.calculatorAllowed);
      setSectionLockingEnabled(ruleFlags.sectionLockingEnabled);
      setFreeNavigationEnabled(ruleFlags.freeNavigationEnabled);
    }
  }, [ruleFlags]);

  // UI Dependency Rule: If Section Locking ON -> Free Navigation FALSE
  useEffect(() => {
    if (sectionLockingEnabled) {
      setFreeNavigationEnabled(false);
    }
  }, [sectionLockingEnabled]);

  const handleSave = () => {
    const payload = {
      negativeMarkingEnabled,
      randomizeQuestions,
      randomizeOptions,
      calculatorAllowed,
      sectionLockingEnabled,
      freeNavigationEnabled,
    };

    const validation = UpdateRuleFlagsSchema.safeParse(payload);

    if (!validation.success) {
      toast.error('Validation Error', { description: 'Invalid rule flags state.' });
      return;
    }

    // Secondary UI safety check
    if (sectionLockingEnabled && freeNavigationEnabled) {
      toast.error('Invalid Combination', {
        description: 'Cannot enable Free Navigation when Section Locking is enabled.',
      });
      return;
    }

    updateRuleFlags(validation.data, {
      onSuccess: () => {
        toast.success('Success', { description: 'Rule flags updated successfully.' });
        if (onNext) onNext();
      },
      onError: (err: any) => {
        toast.error('Error', {
          description:
            err?.response?.data?.message || err.message || 'Failed to update rule flags.',
        });
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className='space-y-6 max-w-xl'>
      <div>
        <h3 className='text-lg font-medium'>Rule Flags</h3>
        <p className='text-sm text-muted-foreground'>Configure the examination behavior rules.</p>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='negative-marking'>Negative Marking</Label>
            <p className='text-sm text-muted-foreground'>Apply penalties for incorrect answers.</p>
          </div>
          <Switch
            id='negative-marking'
            checked={negativeMarkingEnabled}
            onCheckedChange={setNegativeMarkingEnabled}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='randomize-questions'>Randomize Questions</Label>
            <p className='text-sm text-muted-foreground'>Present questions in a random order.</p>
          </div>
          <Switch
            id='randomize-questions'
            checked={randomizeQuestions}
            onCheckedChange={setRandomizeQuestions}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='randomize-options'>Randomize Options</Label>
            <p className='text-sm text-muted-foreground'>Shuffle multiple-choice options.</p>
          </div>
          <Switch
            id='randomize-options'
            checked={randomizeOptions}
            onCheckedChange={setRandomizeOptions}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='calculator-allowed'>Calculator Allowed</Label>
            <p className='text-sm text-muted-foreground'>
              Enable the on-screen calculator for candidates.
            </p>
          </div>
          <Switch
            id='calculator-allowed'
            checked={calculatorAllowed}
            onCheckedChange={setCalculatorAllowed}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='section-locking'>Section Locking</Label>
            <p className='text-sm text-muted-foreground'>
              Prevent returning to previous sections once submitted.
            </p>
          </div>
          <Switch
            id='section-locking'
            checked={sectionLockingEnabled}
            onCheckedChange={setSectionLockingEnabled}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label
              htmlFor='free-navigation'
              className={sectionLockingEnabled ? 'text-muted-foreground' : ''}
            >
              Free Navigation
            </Label>
            <p className='text-sm text-muted-foreground'>
              Allow candidates to freely navigate between questions.
            </p>
            {sectionLockingEnabled && (
              <p className='text-xs text-destructive font-medium mt-1'>
                Free Navigation is disabled because Section Locking is enabled.
              </p>
            )}
          </div>
          <Switch
            id='free-navigation'
            checked={freeNavigationEnabled}
            onCheckedChange={setFreeNavigationEnabled}
            disabled={sectionLockingEnabled}
          />
        </div>
      </div>

      <div className='flex items-center justify-end pt-4 border-t'>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Rules'}
        </Button>
      </div>
    </div>
  );
}
