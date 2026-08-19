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
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';
import type { ExamConfig } from '@/services/exam-configs/types';

export interface ConfigurationSelectionProps {
  onSelect?: (config: ExamConfig) => void;
  selectedId?: string;
  filterStatus?: Array<ExamConfig['status']> | null;
  renderActions?: (config: ExamConfig) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export const ConfigurationSelection: React.FC<ConfigurationSelectionProps> = ({
  onSelect,
  selectedId,
  filterStatus,
  renderActions,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
}) => {
  const { data: configs, isLoading, error } = useConfigs();

  if (isLoading) {
    return (
      <div className='py-8'>
        <AnimatedLoader variant='section' />
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

  // If filterStatus is not explicitly set, default to VALIDATED or PUBLISHED when acting as selection
  const activeFilter =
    filterStatus !== undefined
      ? filterStatus
      : renderActions
        ? null
        : (['VALIDATED', 'PUBLISHED'] as Array<ExamConfig['status']>);

  const availableConfigs = activeFilter
    ? configs?.filter((c) => activeFilter.includes(c.status)) || []
    : configs || [];

  if (availableConfigs.length === 0) {
    return (
      <EmptyState
        title={
          emptyTitle ||
          (activeFilter ? 'No Validated Configurations' : 'No Exam Configurations Found')
        }
        description={
          emptyDescription ||
          (activeFilter
            ? 'There are no validated or published exam configurations available for assessment generation.'
            : 'An Exam Configuration defines the test structure (sections, question counts, duration). You need at least one before proceeding.')
        }
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        className='py-12 border border-dashed'
      />
    );
  }

  const getStatusBadge = (status: ExamConfig['status']) => {
    switch (status) {
      case 'ACTIVE':
      case 'PUBLISHED':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'>
            {status === 'ACTIVE' ? 'Active' : 'Published'}
          </Badge>
        );
      case 'VALIDATED':
        return (
          <Badge variant='secondary' className='bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'>
            Validated
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge variant='secondary' className='bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'>
            Draft
          </Badge>
        );
      default:
        return <Badge variant='secondary'>{status || 'Archived'}</Badge>;
    }
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {availableConfigs.map((config) => (
        <Card
          key={config.id}
          className={`flex flex-col transition-all duration-200 hover:shadow-md ${
            onSelect ? 'cursor-pointer' : ''
          } ${selectedId === config.id ? 'ring-2 ring-primary border-primary' : ''}`}
          onClick={() => onSelect?.(config)}
        >
          <CardHeader>
            <div className='flex justify-between items-start mb-2'>
              <div className='flex items-center gap-2 text-primary'>
                <FileText className='h-4 w-4' />
                <span className='text-xs font-mono font-medium'>{config.code || 'N/A'}</span>
              </div>
              {getStatusBadge(config.status)}
            </div>
            <CardTitle className='text-base line-clamp-1'>{config.name || 'Untitled'}</CardTitle>
            <CardDescription className='text-xs'>
              {config.totalQuestions} Questions • {config.durationMinutes} Mins
            </CardDescription>
          </CardHeader>
          <CardContent className='flex-1'>
            <div className='space-y-1.5 text-xs text-muted-foreground'>
              {config.role && <p>Role: {config.role}</p>}
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
          <CardFooter className={renderActions ? 'flex-col gap-2 pt-4 border-t bg-muted/20' : 'pt-2'}>
            {renderActions ? (
              renderActions(config)
            ) : (
              <Button
                variant={selectedId === config.id ? 'default' : 'outline'}
                className='w-full'
              >
                {selectedId === config.id ? 'Selected' : 'Select'}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

