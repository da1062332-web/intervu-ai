import React from 'react';
import { useConfigs } from '@/services/exam-configs/hooks';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import type { ExamConfig } from '@/services/exam-configs/types';

interface ConfigurationSelectionProps {
  onSelect: (config: ExamConfig) => void;
  selectedId?: string;
}

export const ConfigurationSelection: React.FC<ConfigurationSelectionProps> = ({
  onSelect,
  selectedId,
}) => {
  const { data: configs, isLoading, error } = useConfigs();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className='h-6 w-3/4' />
              <Skeleton className='h-4 w-1/2' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-20 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 border border-red-200 bg-red-50 text-red-700 rounded-md'>
        Failed to load configurations. Please try again later.
      </div>
    );
  }

  // Filter for VALIDATED or PUBLISHED configs
  const availableConfigs =
    configs?.filter((c) => c.status === 'VALIDATED' || c.status === 'PUBLISHED') || [];

  if (availableConfigs.length === 0) {
    return (
      <EmptyState
        title='No Validated Configurations'
        description='There are no validated or published exam configurations available for assessment generation.'
      />
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {availableConfigs.map((config) => (
        <Card
          key={config.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedId === config.id ? 'ring-2 ring-primary border-primary' : ''}`}
          onClick={() => onSelect(config)}
        >
          <CardHeader>
            <div className='flex justify-between items-start'>
              <CardTitle className='text-lg'>{config.name}</CardTitle>
              <Badge variant={config.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {config.status}
              </Badge>
            </div>
            <CardDescription>{config.code}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm text-muted-foreground'>
              <div className='flex justify-between'>
                <span>Total Questions:</span>
                <span className='font-medium text-foreground'>{config.totalQuestions}</span>
              </div>
              <div className='flex justify-between'>
                <span>Duration:</span>
                <span className='font-medium text-foreground'>{config.durationMinutes} mins</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant={selectedId === config.id ? 'default' : 'outline'} className='w-full'>
              {selectedId === config.id ? 'Selected' : 'Select'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
