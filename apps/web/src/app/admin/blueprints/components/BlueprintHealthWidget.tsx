'use client';

import { useValidateBlueprint } from '@/services/blueprints';
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface BlueprintHealthWidgetProps {
  blueprintId?: string;
  topicSum: number;
  difficultySum: number;
}

export function BlueprintHealthWidget({ blueprintId, topicSum, difficultySum }: BlueprintHealthWidgetProps) {
  const { mutateAsync: validate, isPending } = useValidateBlueprint();
  const [dbValidation, setDbValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const runDbValidation = async () => {
    if (!blueprintId) return;
    try {
      const res = await validate(blueprintId);
      setDbValidation(res);
    } catch {
      setDbValidation({ valid: false, errors: ['Failed to contact validation engine'] });
    }
  };

  useEffect(() => {
    if (blueprintId) {
      runDbValidation();
    }
  }, [blueprintId]);

  // Calculate frontend score
  const isTopicValid = topicSum === 100;
  const isDifficultyValid = difficultySum === 100;
  const isDbValid = dbValidation ? dbValidation.valid : true;

  let score = 0;
  if (isTopicValid) score += 35;
  if (isDifficultyValid) score += 35;
  if (isDbValid) score += 30;

  const isReady = isTopicValid && isDifficultyValid && isDbValid;

  return (
    <div className='border rounded-lg p-6 bg-white shadow-sm space-y-6'>
      <div className='flex justify-between items-center border-b pb-4'>
        <div>
          <h3 className='text-sm font-semibold text-gray-900'>Blueprint Health Analyzer</h3>
          <p className='text-xs text-muted-foreground mt-0.5'>Real-time schema and contract verification</p>
        </div>
        {blueprintId && (
          <button
            onClick={runDbValidation}
            disabled={isPending}
            className='p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-50'
            title='Recalculate DB availability'
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className='flex items-center space-x-6'>
        {/* Dial Mockup */}
        <div className='relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-indigo-100 transition-all duration-500'>
          <div
            className='absolute inset-0 rounded-full border-4 border-indigo-600 transition-all duration-500'
            style={{
              clipPath: `polygon(50% 50%, -50% -50%, ${score >= 25 ? '150%' : '50%'} ${score >= 50 ? '150%' : '50%'}, ${score >= 75 ? '-50%' : '50%'} ${score >= 75 ? '150%' : '50%'}, -50% -50%)`,
            }}
          />
          <span className='text-lg font-bold text-gray-900'>{score}%</span>
        </div>

        <div className='flex-1 space-y-3 text-xs'>
          <div className='flex items-center justify-between'>
            <span className='font-medium text-gray-500'>Topic Distribution (100%):</span>
            <div className='flex items-center space-x-1.5'>
              <span className='font-semibold text-gray-900'>{topicSum}%</span>
              {isTopicValid ? (
                <CheckCircle2 className='w-4 h-4 text-emerald-600' />
              ) : (
                <AlertCircle className='w-4 h-4 text-amber-500' />
              )}
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <span className='font-medium text-gray-500'>Difficulty Distribution (100%):</span>
            <div className='flex items-center space-x-1.5'>
              <span className='font-semibold text-gray-900'>{difficultySum}%</span>
              {isDifficultyValid ? (
                <CheckCircle2 className='w-4 h-4 text-emerald-600' />
              ) : (
                <AlertCircle className='w-4 h-4 text-amber-500' />
              )}
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <span className='font-medium text-gray-500'>DB Template Match:</span>
            <div className='flex items-center space-x-1.5'>
              <span className='font-semibold text-gray-900'>
                {dbValidation ? (dbValidation.valid ? 'Ready' : 'Incomplete') : 'Pending save'}
              </span>
              {isDbValid ? (
                <CheckCircle2 className='w-4 h-4 text-emerald-600' />
              ) : (
                <AlertCircle className='w-4 h-4 text-red-500' />
              )}
            </div>
          </div>
        </div>
      </div>

      {dbValidation && dbValidation.errors.length > 0 && (
        <div className='p-3 border border-red-200 rounded bg-red-50 space-y-1.5 animate-in fade-in duration-200'>
          <span className='text-xs font-semibold text-red-800 block'>Validation issues found:</span>
          <ul className='list-disc pl-4 text-[10px] text-red-700 space-y-1'>
            {dbValidation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div
        className={`p-3 rounded-lg text-center transition-all duration-300 ${
          isReady
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
            : 'bg-amber-50 text-amber-800 border border-amber-200 font-medium'
        }`}
      >
        {isReady ? '🎉 Blueprint is Generation Ready' : '⚠️ Adjust settings to enable generation'}
      </div>
    </div>
  );
}
