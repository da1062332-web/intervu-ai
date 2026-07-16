'use client';

import React, { useState, useEffect } from 'react';
import { useRuleFlags, useSaveRules } from '../hooks/use-rule-flags';
import { useConfigRulesStore } from '@/store/config-rules.store';
import { z } from 'zod';
import type { UpdateRuleFlags } from '@intervu/shared';

const UpdateRuleFlagsSchema = z.object({
  negativeMarkingEnabled: z.boolean(),
  sectionalCutoffEnabled: z.boolean(),
  adaptiveDifficultyEnabled: z.boolean(),
  shuffleQuestionsEnabled: z.boolean(),
  shuffleOptionsEnabled: z.boolean(),
  allowSectionNavigation: z.boolean(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
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
  const { mutate: saveRules, isPending } = useSaveRules(configId);

  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
  const [sectionalCutoffEnabled, setSectionCutoffEnabled] = useState(false);
  const [adaptiveDifficultyEnabled, setAdaptiveDifficultyEnabled] = useState(false);
  const [shuffleQuestionsEnabled, setShuffleQuestionsEnabled] = useState(false);
  const [shuffleOptionsEnabled, setShuffleOptionsEnabled] = useState(false);
  const [allowSectionNavigation, setAllowSectionNavigation] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);

  const { setRules, setDirty } = useConfigRulesStore();

  useEffect(() => {
    if (ruleFlags) {
      setNegativeMarkingEnabled(ruleFlags.negativeMarkingEnabled);
      setSectionCutoffEnabled(ruleFlags.sectionalCutoffEnabled);
      setAdaptiveDifficultyEnabled(ruleFlags.adaptiveDifficultyEnabled);
      setShuffleQuestionsEnabled(ruleFlags.shuffleQuestionsEnabled);
      setShuffleOptionsEnabled(ruleFlags.shuffleOptionsEnabled);
      setAllowSectionNavigation(ruleFlags.allowSectionNavigation);
      if (ruleFlags.maxAttempts !== undefined) {
        setMaxAttempts(ruleFlags.maxAttempts);
      }
    }
  }, [ruleFlags]);

  // Sync to Zustand store on state changes
  useEffect(() => {
    setRules({
      negativeMarkingEnabled,
      sectionalCutoffEnabled,
      adaptiveDifficultyEnabled,
      shuffleQuestionsEnabled,
      shuffleOptionsEnabled,
      allowSectionNavigation,
      maxAttempts,
    });
  }, [
    negativeMarkingEnabled,
    sectionalCutoffEnabled,
    adaptiveDifficultyEnabled,
    shuffleQuestionsEnabled,
    shuffleOptionsEnabled,
    allowSectionNavigation,
    maxAttempts,
    setRules,
  ]);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    setDirty(true);
  };

  const handleSave = () => {
    const payload = {
      negativeMarkingEnabled,
      sectionalCutoffEnabled,
      adaptiveDifficultyEnabled,
      shuffleQuestionsEnabled,
      shuffleOptionsEnabled,
      allowSectionNavigation,
      maxAttempts,
    };

    const validation = UpdateRuleFlagsSchema.safeParse(payload);

    if (!validation.success) {
      toast.error('Validation Error', { description: 'Invalid rule flags state.' });
      return;
    }

    saveRules(validation.data, {
      onSuccess: () => {
        setDirty(false);
        if (onNext) onNext();
      },
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4'>
      <div className='space-y-1'>
        <h3 className='text-2xl font-semibold tracking-tight'>Exam Rules</h3>
        <p className='text-muted-foreground'>
          Configure the examination rules and constraints for this config.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl bg-card shadow-sm'>
        <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
          <div className='space-y-0.5 pr-4'>
            <Label htmlFor='negative-marking' className='text-base'>Negative Marking</Label>
            <p className='text-sm text-muted-foreground'>Apply penalties for incorrect answers.</p>
          </div>
          <Switch
            id='negative-marking'
            checked={negativeMarkingEnabled}
            onCheckedChange={(val: boolean) => handleToggle(setNegativeMarkingEnabled, val)}
          />
        </div>

        <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
          <div className='space-y-0.5 pr-4'>
            <Label htmlFor='sectional-cutoff' className='text-base'>Sectional Cutoff</Label>
            <p className='text-sm text-muted-foreground'>
              Enable minimum qualification score per section.
            </p>
          </div>
          <Switch
            id='sectional-cutoff'
            checked={sectionalCutoffEnabled}
            onCheckedChange={(val: boolean) => handleToggle(setSectionCutoffEnabled, val)}
          />
        </div>

        <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
          <div className='space-y-0.5 pr-4'>
            <Label htmlFor='adaptive-difficulty' className='text-base'>Adaptive Difficulty</Label>
            <p className='text-sm text-muted-foreground'>
              Vary question difficulty based on candidate performance.
            </p>
          </div>
          <Switch
            id='adaptive-difficulty'
            checked={adaptiveDifficultyEnabled}
            onCheckedChange={(val: boolean) => handleToggle(setAdaptiveDifficultyEnabled, val)}
          />
        </div>

        <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
          <div className='space-y-0.5 pr-4'>
            <Label htmlFor='shuffle-questions' className='text-base'>Shuffle Questions</Label>
            <p className='text-sm text-muted-foreground'>Present questions in a random order.</p>
          </div>
          <Switch
            id='shuffle-questions'
            checked={shuffleQuestionsEnabled}
            onCheckedChange={(val: boolean) => handleToggle(setShuffleQuestionsEnabled, val)}
          />
        </div>

        <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
          <div className='space-y-0.5 pr-4'>
            <Label htmlFor='shuffle-options' className='text-base'>Shuffle Options</Label>
            <p className='text-sm text-muted-foreground'>Shuffle multiple-choice options.</p>
          </div>
          <Switch
            id='shuffle-options'
            checked={shuffleOptionsEnabled}
            onCheckedChange={(val: boolean) => handleToggle(setShuffleOptionsEnabled, val)}
          />
        </div>

        <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
          <div className='space-y-0.5 pr-4'>
            <Label htmlFor='allow-section-navigation' className='text-base'>Section Navigation</Label>
            <p className='text-sm text-muted-foreground'>
              Allow candidates to freely navigate between sections.
            </p>
          </div>
          <Switch
            id='allow-section-navigation'
            checked={allowSectionNavigation}
            onCheckedChange={(val: boolean) => handleToggle(setAllowSectionNavigation, val)}
          />
        </div>

        <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors md:col-span-2'>
          <div className='space-y-0.5 pr-4'>
            <Label htmlFor='max-attempts' className='text-base'>Maximum Attempts</Label>
            <p className='text-sm text-muted-foreground'>
              Maximum number of times a candidate can attempt this exam (1-10).
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <input
              id='max-attempts'
              type='number'
              min={1}
              max={10}
              value={maxAttempts}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setMaxAttempts(val);
                  setDirty(true);
                }
              }}
              className='flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            />
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between p-4 rounded-lg bg-muted/30'>
        <span className='text-sm text-muted-foreground'>Make sure to save your changes before proceeding.</span>
        <Button onClick={handleSave} disabled={isPending} size="lg" className='shadow-sm'>
          {isPending ? 'Saving...' : 'Save Rules'}
        </Button>
      </div>
    </div>
  );
}
