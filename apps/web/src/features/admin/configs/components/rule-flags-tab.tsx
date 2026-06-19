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

  const { setRules, setDirty } = useConfigRulesStore();

  useEffect(() => {
    if (ruleFlags) {
      setNegativeMarkingEnabled(ruleFlags.negativeMarkingEnabled);
      setSectionCutoffEnabled(ruleFlags.sectionalCutoffEnabled);
      setAdaptiveDifficultyEnabled(ruleFlags.adaptiveDifficultyEnabled);
      setShuffleQuestionsEnabled(ruleFlags.shuffleQuestionsEnabled);
      setShuffleOptionsEnabled(ruleFlags.shuffleOptionsEnabled);
      setAllowSectionNavigation(ruleFlags.allowSectionNavigation);
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
    });
  }, [
    negativeMarkingEnabled,
    sectionalCutoffEnabled,
    adaptiveDifficultyEnabled,
    shuffleQuestionsEnabled,
    shuffleOptionsEnabled,
    allowSectionNavigation,
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className='space-y-6 max-w-xl'>
      <div>
        <h3 className='text-lg font-medium'>Exam Rules</h3>
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
            onCheckedChange={(val: boolean) => handleToggle(setNegativeMarkingEnabled, val)}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='sectional-cutoff'>Sectional Cutoff</Label>
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

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='adaptive-difficulty'>Adaptive Difficulty</Label>
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

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='shuffle-questions'>Shuffle Questions</Label>
            <p className='text-sm text-muted-foreground'>Present questions in a random order.</p>
          </div>
          <Switch
            id='shuffle-questions'
            checked={shuffleQuestionsEnabled}
            onCheckedChange={(val: boolean) => handleToggle(setShuffleQuestionsEnabled, val)}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='shuffle-options'>Shuffle Options</Label>
            <p className='text-sm text-muted-foreground'>Shuffle multiple-choice options.</p>
          </div>
          <Switch
            id='shuffle-options'
            checked={shuffleOptionsEnabled}
            onCheckedChange={(val: boolean) => handleToggle(setShuffleOptionsEnabled, val)}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='allow-section-navigation'>Allow Section Navigation</Label>
            <p className='text-sm text-muted-foreground'>
              Allow candidates to freely navigate between sections during the exam.
            </p>
          </div>
          <Switch
            id='allow-section-navigation'
            checked={allowSectionNavigation}
            onCheckedChange={(val: boolean) => handleToggle(setAllowSectionNavigation, val)}
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
