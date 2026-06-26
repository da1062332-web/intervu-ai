import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CoverageChartProps {
  coveragePercentage: number;
}

export function CoverageChart({ coveragePercentage }: CoverageChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blueprint Coverage</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm font-medium'>Overall Match</span>
          <span className='text-sm font-medium'>{coveragePercentage}%</span>
        </div>
        <Progress value={coveragePercentage} className='h-2' />
      </CardContent>
    </Card>
  );
}
