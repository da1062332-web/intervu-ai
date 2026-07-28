import React from 'react';
import { useResultAnalysis } from '../hooks/results.hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const StrengthWeaknessPanel = ({ attemptId }: { attemptId: string }) => {
  const { data, isLoading, isError } = useResultAnalysis(attemptId);

  if (isLoading) return <Loading />;
  if (isError || !data) return null;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <Card className='border-t-4 border-t-green-500'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle className='text-green-500 w-5 h-5' />
            Key Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.strengths.length === 0 ? (
            <p className='text-sm text-gray-500'>No specific strengths identified yet.</p>
          ) : (
            <ul className='space-y-4'>
              {data.strengths.map((item, i) => (
                <li key={i} className='flex flex-col border-b last:border-0 pb-3 last:pb-0'>
                  <div className='flex justify-between items-center mb-1'>
                    <span className='font-semibold text-gray-800 truncate max-w-[80%]' title={item.topic}>
                      {item.topic}
                    </span>
                    <span className='text-sm font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full'>
                      {item.score}%
                    </span>
                  </div>
                  <span className='text-sm text-gray-600'>{item.remarks}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className='border-t-4 border-t-red-500'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='text-red-500 w-5 h-5' />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.weaknesses.length === 0 ? (
            <p className='text-sm text-gray-500'>No specific weaknesses identified yet.</p>
          ) : (
            <ul className='space-y-4'>
              {data.weaknesses.map((item, i) => (
                <li key={i} className='flex flex-col border-b last:border-0 pb-3 last:pb-0'>
                  <div className='flex justify-between items-center mb-1'>
                    <span className='font-semibold text-gray-800 truncate max-w-[80%]' title={item.topic}>
                      {item.topic}
                    </span>
                    <span className='text-sm font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full'>
                      {item.score}%
                    </span>
                  </div>
                  <span className='text-sm text-gray-600'>{item.remarks}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
