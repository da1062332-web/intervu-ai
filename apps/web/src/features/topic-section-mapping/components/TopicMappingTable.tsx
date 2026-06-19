'use client';

import { useState } from 'react';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { useRemoveTopic } from '../api/queries';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopicMappingStore } from '../store/topic-mapping.store';
import { RefreshCw } from 'lucide-react';

interface TopicMappingTableProps {
  sectionId: string;
  topics: SectionTopicResponse[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function TopicMappingTable({
  sectionId,
  topics,
  isLoading,
  isError,
  onRetry,
}: TopicMappingTableProps) {
  const [topicToRemove, setTopicToRemove] = useState<string | null>(null);
  const removeTopic = useRemoveTopic(sectionId);
  const weightages = useTopicMappingStore((state) => state.weightages);

  const handleConfirmRemove = () => {
    if (!topicToRemove) return;
    removeTopic.mutate(topicToRemove, {
      onSettled: () => setTopicToRemove(null),
    });
  };

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
      <div className='p-8 text-center border rounded-lg text-muted-foreground bg-gray-50/50 dark:bg-gray-800/50'>
        No Topics Assigned To This Section
      </div>
    );
  }

  return (
    <div>
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-sm border-collapse'>
          <thead>
            <tr className='border-b'>
              <th className='p-4 font-medium'>Topic Name</th>
              <th className='p-4 font-medium'>Topic Code</th>
              <th className='p-4 font-medium'>Weightage</th>
              <th className='p-4 font-medium'>Created At</th>
              <th className='p-4 font-medium text-right'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => (
              <tr
                key={topic.topicId}
                className='border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              >
                <td className='p-4 font-medium'>{topic.topicName}</td>
                <td className='p-4'>{topic.topicCode}</td>
                <td className='p-4'>
                  {weightages[topic.topicId] !== undefined ? `${weightages[topic.topicId]}%` : '-'}
                </td>
                <td className='p-4 text-gray-500'>
                  {topic.createdAt ? new Date(topic.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className='p-4 text-right'>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => setTopicToRemove(topic.topicId)}
                    disabled={removeTopic.isPending && removeTopic.variables === topic.topicId}
                  >
                    {removeTopic.isPending && removeTopic.variables === topic.topicId
                      ? 'Removing...'
                      : 'Remove'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
}
