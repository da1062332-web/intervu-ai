'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConfigs } from '@/services/exam-configs';
import { useStyleProfiles, useCreateBlueprint, useBlueprint } from '@/services/blueprints';
import { StyleProfileSelector } from './components/StyleProfileSelector';
import { BlueprintHealthWidget } from './components/BlueprintHealthWidget';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function BlueprintBuilderPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const { data: configs, isLoading: isConfigsLoading } = useConfigs();
  const { data: profiles, isLoading: isProfilesLoading } = useStyleProfiles();
  const { data: existingBlueprint, isLoading: isBlueprintLoading } = useBlueprint(editId || '');
  const { mutateAsync: saveBlueprint, isPending: isSaving } = useCreateBlueprint();

  // Selected config & profile
  const [configId, setConfigId] = useState('');
  const [styleProfileId, setStyleProfileId] = useState('');

  // Section details
  const [qCount, setQCount] = useState(20);
  const [dsPercent, setDsPercent] = useState(60);
  const [algoPercent, setAlgoPercent] = useState(40);
  const [easyPercent, setEasyPercent] = useState(50);
  const [mediumPercent, setMediumPercent] = useState(40);
  const [hardPercent, setHardPercent] = useState(10);

  // Initialize form if editing
  useEffect(() => {
    if (existingBlueprint) {
      setConfigId(existingBlueprint.configId);
      setStyleProfileId(existingBlueprint.styleProfileId);
      const section = existingBlueprint.sections?.[0];
      if (section) {
        setQCount(section.questionCount || 20);
        const ds = section.topicAllocations?.find((t: any) => t.topicId === 'se-ds-001');
        const algo = section.topicAllocations?.find((t: any) => t.topicId === 'se-algo-001');
        if (ds) setDsPercent(ds.percentage);
        if (algo) setAlgoPercent(algo.percentage);

        const diff = section.difficultyAllocation || {};
        setEasyPercent(diff.easy ?? 50);
        setMediumPercent(diff.medium ?? 40);
        setHardPercent(diff.hard ?? 10);
      }
    }
  }, [existingBlueprint]);

  // If config is selected, pre-fill total questions if available
  useEffect(() => {
    if (configId && configs) {
      const selected = configs.find((c) => c.id === configId);
      if (selected) {
        setQCount(selected.totalQuestions);
      }
    }
  }, [configId, configs]);

  const topicSum = dsPercent + algoPercent;
  const difficultySum = easyPercent + mediumPercent + hardPercent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configId || !styleProfileId) {
      return;
    }

    const payload = {
      configId,
      styleProfileId,
      sections: [
        {
          sectionId: 'sec-technical',
          questionCount: qCount,
          topicAllocations: [
            { topicId: 'se-ds-001', percentage: dsPercent },
            { topicId: 'se-algo-001', percentage: algoPercent },
          ],
          difficultyAllocation: {
            easy: easyPercent,
            medium: mediumPercent,
            hard: hardPercent,
          },
          templateTypes: ['mcq'],
        },
      ],
    };

    try {
      await saveBlueprint(payload);
      router.push('/admin/blueprints');
    } catch {
      // toast is already handled in mutation
    }
  };

  const isLoading = isConfigsLoading || isProfilesLoading || (!!editId && isBlueprintLoading);

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-20 space-y-4'>
        <Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
        <span className='text-sm text-muted-foreground'>Loading builder context...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8'>
      {/* Left Columns - Form controls */}
      <div className='lg:col-span-2 space-y-8'>
        <div className='border rounded-lg p-6 bg-white shadow-sm space-y-6'>
          <h3 className='text-base font-semibold text-gray-900 border-b pb-3'>
            1. Mapping & Constraints
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='config-select'>Exam Configuration</Label>
              <select
                id='config-select'
                value={configId}
                onChange={(e) => setConfigId(e.target.value)}
                disabled={!!editId}
                className='w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white border-gray-300'
              >
                <option value=''>-- Select configuration --</option>
                {configs?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <StyleProfileSelector value={styleProfileId} onChange={setStyleProfileId} />
          </div>
        </div>

        <div className='border rounded-lg p-6 bg-white shadow-sm space-y-6'>
          <h3 className='text-base font-semibold text-gray-900 border-b pb-3'>
            2. Section Distribution (Technical)
          </h3>

          <div className='space-y-6'>
            {/* Topic Allocation sliders */}
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label className='font-semibold text-gray-800'>Topic Allocation (%)</Label>
                <span
                  className={`text-xs font-bold ${topicSum === 100 ? 'text-emerald-600' : 'text-amber-500'}`}
                >
                  Sum: {topicSum}% / 100%
                </span>
              </div>

              <div className='space-y-4 border p-4 rounded bg-gray-50'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-xs'>
                    <span className='font-medium text-gray-700'>Data Structures</span>
                    <span className='font-bold text-indigo-600'>{dsPercent}%</span>
                  </div>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    step='5'
                    value={dsPercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDsPercent(val);
                      setAlgoPercent(100 - val);
                    }}
                    className='w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between text-xs'>
                    <span className='font-medium text-gray-700'>Algorithms</span>
                    <span className='font-bold text-indigo-600'>{algoPercent}%</span>
                  </div>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    step='5'
                    value={algoPercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAlgoPercent(val);
                      setDsPercent(100 - val);
                    }}
                    className='w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                  />
                </div>
              </div>
            </div>

            {/* Difficulty Allocation sliders */}
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label className='font-semibold text-gray-800'>Difficulty Mix (%)</Label>
                <span
                  className={`text-xs font-bold ${difficultySum === 100 ? 'text-emerald-600' : 'text-amber-500'}`}
                >
                  Sum: {difficultySum}% / 100%
                </span>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 border p-4 rounded bg-gray-50'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-xs'>
                    <span className='font-medium text-gray-700'>Easy</span>
                    <span className='font-bold text-blue-600'>{easyPercent}%</span>
                  </div>
                  <input
                    type='number'
                    min='0'
                    max='100'
                    value={easyPercent}
                    onChange={(e) => setEasyPercent(Math.min(100, Number(e.target.value)))}
                    className='w-full px-2.5 py-1 border rounded text-sm bg-white font-semibold'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between text-xs'>
                    <span className='font-medium text-gray-700'>Medium</span>
                    <span className='font-bold text-yellow-600'>{mediumPercent}%</span>
                  </div>
                  <input
                    type='number'
                    min='0'
                    max='100'
                    value={mediumPercent}
                    onChange={(e) => setMediumPercent(Math.min(100, Number(e.target.value)))}
                    className='w-full px-2.5 py-1 border rounded text-sm bg-white font-semibold'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between text-xs'>
                    <span className='font-medium text-gray-700'>Hard</span>
                    <span className='font-bold text-red-600'>{hardPercent}%</span>
                  </div>
                  <input
                    type='number'
                    min='0'
                    max='100'
                    value={hardPercent}
                    onChange={(e) => setHardPercent(Math.min(100, Number(e.target.value)))}
                    className='w-full px-2.5 py-1 border rounded text-sm bg-white font-semibold'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Health widget & Save controls */}
      <div className='space-y-6'>
        <BlueprintHealthWidget
          blueprintId={editId || undefined}
          topicSum={topicSum}
          difficultySum={difficultySum}
        />

        <div className='flex flex-col space-y-3'>
          <Button
            type='submit'
            disabled={
              !configId || !styleProfileId || topicSum !== 100 || difficultySum !== 100 || isSaving
            }
            className='w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSaving && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
            Save Exam Blueprint
          </Button>

          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/admin/blueprints')}
            className='w-full'
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
