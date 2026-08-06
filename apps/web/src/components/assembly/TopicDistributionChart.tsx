import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTopics } from '@/services/topics/hooks';

interface TopicDistributionChartProps {
  distribution: Record<string, number>;
}

export function TopicDistributionChart({ distribution }: TopicDistributionChartProps) {
  const { data: topics } = useTopics(false);

  const getTopicDisplayName = (key: string) => {
    if (!key) return 'General';
    const found = topics?.find((t) => t.id === key || t.code === key);
    return found ? found.name : key;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Distribution</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {Object.entries(distribution || {}).map(([topic, count]) => (
          <div key={topic} className='flex justify-between items-center gap-2'>
            <span className='capitalize font-medium text-sm'>{getTopicDisplayName(topic)}</span>
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
