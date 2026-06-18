'use client';

import { useState } from 'react';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { useRemoveTopic } from '../api/queries';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface TopicMappingTableProps {
  sectionId: string;
  topics: SectionTopicResponse[];
}

export function TopicMappingTable({ sectionId, topics }: TopicMappingTableProps) {
  const [topicToRemove, setTopicToRemove] = useState<string | null>(null);
  const removeTopic = useRemoveTopic(sectionId);

  const handleConfirmRemove = () => {
    if (!topicToRemove) return;
    removeTopic.mutate(topicToRemove, {
      onSettled: () => setTopicToRemove(null),
    });
  };

  return (
    <div>
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-sm border-collapse'>
          <thead>
            <tr className='border-b'>
              <th className='p-4 font-medium'>Topic Name</th>
              <th className='p-4 font-medium'>Topic Code</th>
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
