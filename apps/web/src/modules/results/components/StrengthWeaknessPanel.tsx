import React from 'react';
import { useResultAnalysis } from '../hooks/results.hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const StrengthWeaknessPanel = ({ attemptId }: { attemptId: string }) => {
  const { data, isLoading, isError } = useResultAnalysis(attemptId);

  if (isLoading) return <Loading />;
  if (isError || !data) return null;

  const cleanRemarks = (str: string) => {
    if (!str) return '';
    return str
      .replace(/no answers were submitted for this topic\s*\(\s*0%\s*accuracy\s*\)\.?/gi, 'Topic requires foundational concept practice.')
      .replace(/\s*\(\s*\d+%\s*accuracy\s*\)/gi, '')
      .replace(/\s*\(\s*0%\s*accuracy\s*\)/gi, '')
      .trim();
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <Card className='border-t-4 border-t-emerald-500'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle className='text-emerald-500 w-5 h-5' />
            Key Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.strengths.length === 0 ? (
            <p className='text-sm text-gray-500 dark:text-slate-400'>No specific strengths identified yet.</p>
          ) : (
            <ul className='space-y-4'>
              {data.strengths.map((item, i) => (
                <li key={i} className='flex flex-col border-b border-gray-200 dark:border-slate-800 last:border-0 pb-3 last:pb-0'>
                  <div className='flex justify-between items-center mb-1'>
                    <span className='font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[80%]' title={item.topic}>
                      {item.topic}
                    </span>
                    <span className='text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md'>
                      Strong Area
                    </span>
                  </div>
                  <span className='text-sm text-gray-600 dark:text-slate-400'>{cleanRemarks(item.remarks)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className='border-t-4 border-t-amber-500'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='text-amber-500 w-5 h-5' />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.weaknesses.length === 0 ? (
            <p className='text-sm text-gray-500 dark:text-slate-400'>No specific weaknesses identified yet.</p>
          ) : (
            <ul className='space-y-4'>
              {data.weaknesses.map((item, i) => (
                <li key={i} className='flex flex-col border-b border-gray-200 dark:border-slate-800 last:border-0 pb-3 last:pb-0'>
                  <div className='flex justify-between items-center mb-1'>
                    <span className='font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[80%]' title={item.topic}>
                      {item.topic}
                    </span>
                    <span className='text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md'>
                      Needs Practice
                    </span>
                  </div>
                  <span className='text-sm text-gray-600 dark:text-slate-400'>{cleanRemarks(item.remarks)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
