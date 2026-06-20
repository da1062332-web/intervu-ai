'use client';

import { useBlueprintBuilderStore } from '@/store/blueprint-builder.store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { BlueprintSectionPayload } from '@/services/blueprints/types';

interface DifficultyAllocatorProps {
  sectionId: string;
}

export function DifficultyAllocator({ sectionId }: DifficultyAllocatorProps) {
  const sectionsState = useBlueprintBuilderStore((state) => state.sections);
  const updateSection = useBlueprintBuilderStore((state) => state.updateSection);

  const sectionState = sectionsState.find((s) => s.sectionId === sectionId) as
    | BlueprintSectionPayload
    | undefined;

  const difficulty = sectionState?.difficultyAllocation || { easy: 0, medium: 0, hard: 0 };

  const totalAllocated = (difficulty.easy || 0) + (difficulty.medium || 0) + (difficulty.hard || 0);
  const isValid = totalAllocated === 100;

  const handleUpdate = (level: 'easy' | 'medium' | 'hard', value: number) => {
    updateSection(sectionId, {
      difficultyAllocation: {
        ...difficulty,
        [level]: value,
      },
    });
  };

  return (
    <div className='space-y-4 border p-4 rounded-md bg-white dark:bg-gray-900'>
      <div className='flex justify-between items-center'>
        <Label className='font-semibold text-gray-800 dark:text-gray-200'>Difficulty Mix (%)</Label>
        <span className={`text-xs font-bold ${isValid ? 'text-emerald-600' : 'text-red-500'}`}>
          Sum: {totalAllocated}% / 100%
        </span>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='space-y-2'>
          <div className='flex justify-between text-xs'>
            <span className='font-medium text-gray-700 dark:text-gray-300'>Easy</span>
            <span className='font-bold text-blue-600'>{difficulty.easy}%</span>
          </div>
          <Input
            type='number'
            min='0'
            max='100'
            value={difficulty.easy || ''}
            onChange={(e) => handleUpdate('easy', parseInt(e.target.value) || 0)}
            placeholder='0'
          />
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between text-xs'>
            <span className='font-medium text-gray-700 dark:text-gray-300'>Medium</span>
            <span className='font-bold text-yellow-600'>{difficulty.medium}%</span>
          </div>
          <Input
            type='number'
            min='0'
            max='100'
            value={difficulty.medium || ''}
            onChange={(e) => handleUpdate('medium', parseInt(e.target.value) || 0)}
            placeholder='0'
          />
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between text-xs'>
            <span className='font-medium text-gray-700 dark:text-gray-300'>Hard</span>
            <span className='font-bold text-red-600'>{difficulty.hard}%</span>
          </div>
          <Input
            type='number'
            min='0'
            max='100'
            value={difficulty.hard || ''}
            onChange={(e) => handleUpdate('hard', parseInt(e.target.value) || 0)}
            placeholder='0'
          />
        </div>
      </div>
    </div>
  );
}
