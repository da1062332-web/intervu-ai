import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DifficultyDistributionChartProps {
  distribution: Record<string, number>;
}

export function DifficultyDistributionChart({ distribution }: DifficultyDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Difficulty Distribution</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {Object.entries(distribution || {}).map(([diff, count]) => (
          <div key={diff} className='flex justify-between items-center'>
            <span className='capitalize'>{diff}</span>
            <Badge variant='secondary'>{count} Qs</Badge>
          </div>
        ))}
        {Object.keys(distribution || {}).length === 0 && (
          <p className='text-sm text-muted-foreground'>No difficulty data available</p>
        )}
      </CardContent>
    </Card>
  );
}
