import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TopicDistributionChartProps {
  distribution: Record<string, number>;
}

export function TopicDistributionChart({ distribution }: TopicDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Distribution</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {Object.entries(distribution || {}).map(([topic, count]) => (
          <div key={topic} className='flex justify-between items-center'>
            <span className='capitalize'>{topic}</span>
            <Badge variant='secondary'>{count} Qs</Badge>
          </div>
        ))}
        {Object.keys(distribution || {}).length === 0 && (
          <p className='text-sm text-muted-foreground'>No topic data available</p>
        )}
      </CardContent>
    </Card>
  );
}
