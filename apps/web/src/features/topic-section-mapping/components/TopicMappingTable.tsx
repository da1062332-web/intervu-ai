'use client';

import React, { useState, useCallback } from 'react';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { useRemoveTopic } from '../api/queries';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as ShadcnTableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { useTopicMappingStore } from '../store/topic-mapping.store';
import { RefreshCw, BookX } from 'lucide-react';

interface TopicMappingTableProps {
  sectionId: string;
  topics: SectionTopicResponse[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const MemoizedTopicRow = React.memo(
  ({
    topic,
    weightage,
    onRemove,
    isRemoving,
  }: {
    topic: SectionTopicResponse;
    weightage?: number;
    onRemove: (id: string) => void;
    isRemoving: boolean;
  }) => {
    return (
      <ShadcnTableRow className='hover:bg-gray-50 dark:hover:bg-gray-800/50'>
        <TableCell className='font-medium'>
          {(topic as any).topicName ||
            (topic as any).topic ||
            (topic as any).name ||
            'Unnamed Topic'}
        </TableCell>
        <TableCell>{(topic as any).topicCode || (topic as any).code || '-'}</TableCell>
        <TableCell>{weightage !== undefined ? `${weightage}%` : '-'}</TableCell>
        <TableCell className='text-muted-foreground'>
          {topic.createdAt ? new Date(topic.createdAt).toLocaleDateString() : 'N/A'}
        </TableCell>
        <TableCell className='text-right'>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => onRemove(topic.topicId)}
            disabled={isRemoving}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        </TableCell>
      </ShadcnTableRow>
    );
  },
);
MemoizedTopicRow.displayName = 'MemoizedTopicRow';

export const TopicMappingTable = React.memo(
  ({ sectionId, topics, isLoading, isError, onRetry }: TopicMappingTableProps) => {
    const [topicToRemove, setTopicToRemove] = useState<string | null>(null);
    const removeTopic = useRemoveTopic(sectionId);
    const weightages = useTopicMappingStore((state) => state.weightages);

    const handleConfirmRemove = useCallback(() => {
      if (!topicToRemove) return;
      removeTopic.mutate(topicToRemove, {
        onSettled: () => setTopicToRemove(null),
      });
    }, [topicToRemove, removeTopic]);

    if (isError) {
      return (
        <div className='p-8 text-center border rounded-lg bg-red-50 dark:bg-red-900/10'>
          <p className='text-red-600 mb-4'>Unable to load topic mappings.</p>
          <Button onClick={onRetry} variant='outline'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Retry
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className='space-y-4 border rounded-lg p-4'>
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>
      );
    }

    if (topics.length === 0) {
      return (
        <div className='p-8'>
          <EmptyState
            title='No Topics Assigned'
            description='No topics have been mapped to this section yet.'
            icon={<BookX className='w-8 h-8 text-gray-400' />}
          />
        </div>
      );
    }

    return (
      <div>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <ShadcnTableRow>
                <TableHead scope='col'>Topic Name</TableHead>
                <TableHead scope='col'>Topic Code</TableHead>
                <TableHead scope='col'>Weightage</TableHead>
                <TableHead scope='col'>Created At</TableHead>
                <TableHead scope='col' className='text-right'>
                  Actions
                </TableHead>
              </ShadcnTableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <MemoizedTopicRow
                  key={topic.topicId}
                  topic={topic}
                  weightage={weightages[topic.topicId]}
                  onRemove={setTopicToRemove}
                  isRemoving={removeTopic.isPending && removeTopic.variables === topic.topicId}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <Modal isOpen={!!topicToRemove} onClose={() => setTopicToRemove(null)}>
          <div className='mb-4'>
            <h2 className='text-lg font-semibold'>Remove Topic Mapping?</h2>
            <p className='text-sm text-gray-500 mt-1'>
              This topic will no longer belong to this section.
            </p>
          </div>
          <div className='mt-6 flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setTopicToRemove(null)}
              disabled={removeTopic.isPending}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleConfirmRemove}
              disabled={removeTopic.isPending}
            >
              Remove
            </Button>
          </div>
        </Modal>
      </div>
    );
  },
);
TopicMappingTable.displayName = 'TopicMappingTable';
