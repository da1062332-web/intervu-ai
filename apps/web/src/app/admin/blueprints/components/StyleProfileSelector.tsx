'use client';

import { useStyleProfiles } from '@/services/blueprints';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface StyleProfileSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function StyleProfileSelector({ value, onChange, disabled }: StyleProfileSelectorProps) {
  const { data: profiles, isLoading, isError } = useStyleProfiles();

  if (isLoading) {
    return (
      <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
        <Loader2 className='w-4 h-4 animate-spin' />
        <span>Loading style profiles...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='text-sm text-destructive'>
        Failed to load candidate style profiles.
      </div>
    );
  }

  const selectedProfile = profiles?.find((p) => p.id === value);
  const getCharacteristic = (name: string) => {
    return selectedProfile?.characteristics?.find((c) => c.name === name)?.value;
  };

  const theoryVal = Number(getCharacteristic('theoryWeight') ?? 50);
  const practicalVal = Number(getCharacteristic('practicalWeight') ?? 50);
  const bias = getCharacteristic('difficultyBias') as { easy?: number; medium?: number; hard?: number } | undefined;

  const questionLength = getCharacteristic('questionLength') as string | undefined;
  const complexity = getCharacteristic('complexity') as string | undefined;
  const scenarioUsage = getCharacteristic('scenarioUsage') as number | undefined;
  const codeIntensity = getCharacteristic('codeIntensity') as number | undefined;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='style-profile-select'>Candidate Style Profile</Label>
        <select
          id='style-profile-select'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className='w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white border-gray-300'
        >
          <option value=''>-- Select a style profile --</option>
          {profiles?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.profileType})
            </option>
          ))}
        </select>
      </div>

      {selectedProfile && (
        <div className='p-4 border rounded-lg bg-gray-50 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200'>
          <div>
            <h4 className='text-sm font-semibold text-gray-900'>{selectedProfile.name}</h4>
            <p className='text-xs text-muted-foreground mt-0.5'>{selectedProfile.description}</p>
          </div>

          <div className='grid grid-cols-2 gap-4 text-xs'>
            <div className='space-y-1'>
              <span className='font-medium text-gray-500 block'>Question Length:</span>
              <span className='capitalize text-gray-900 font-semibold'>{questionLength ?? 'N/A'}</span>
            </div>
            <div className='space-y-1'>
              <span className='font-medium text-gray-500 block'>Complexity:</span>
              <span className='capitalize text-gray-900 font-semibold'>{complexity ?? 'N/A'}</span>
            </div>
            <div className='space-y-1'>
              <span className='font-medium text-gray-500 block'>Scenario Weight:</span>
              <span className='text-gray-900 font-semibold'>{Math.round((scenarioUsage ?? 0) * 100)}%</span>
            </div>
            <div className='space-y-1'>
              <span className='font-medium text-gray-500 block'>Code Intensity:</span>
              <span className='text-gray-900 font-semibold'>{Math.round((codeIntensity ?? 0) * 100)}%</span>
            </div>
          </div>

          <div className='space-y-2'>
            <span className='text-xs font-medium text-gray-500 block'>Question Mix:</span>
            <div className='h-2.5 w-full bg-gray-200 rounded-full overflow-hidden flex'>
              <div
                className='bg-indigo-600 h-full transition-all duration-300'
                style={{ width: `${theoryVal}%` }}
                title={`Theory: ${theoryVal}%`}
              />
              <div
                className='bg-emerald-600 h-full transition-all duration-300'
                style={{ width: `${practicalVal}%` }}
                title={`Practical: ${practicalVal}%`}
              />
            </div>
            <div className='flex justify-between text-[10px] text-gray-500 font-medium'>
              <span>Theory: {theoryVal}%</span>
              <span>Practical: {practicalVal}%</span>
            </div>
          </div>

          {bias && (
            <div className='space-y-1 text-xs'>
              <span className='font-medium text-gray-500 block'>Target Difficulty Bias:</span>
              <div className='flex items-center space-x-2'>
                <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800'>
                  Easy: {bias.easy ?? 0}%
                </span>
                <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800'>
                  Medium: {bias.medium ?? 0}%
                </span>
                <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800'>
                  Hard: {bias.hard ?? 0}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
