'use client';

import { useState } from 'react';
import { useAdminTopics, useAssignTopic } from '../api/queries';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface AddTopicModalProps {
  sectionId: string;
  isOpen: boolean;
  onClose: () => void;
  existingTopicIds: string[];
}

export function AddTopicModal({
  sectionId,
  isOpen,
  onClose,
  existingTopicIds,
}: AddTopicModalProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const { data: topics = [], isLoading: isLoadingTopics } = useAdminTopics();
  const assignTopic = useAssignTopic(sectionId);

  const availableTopics = topics.filter(
    (topic) => !existingTopicIds.includes(topic.id || topic.topicId),
  );

  const handleAssign = () => {
    if (!selectedTopicId) return;
    assignTopic.mutate(selectedTopicId, {
      onSuccess: () => {
        setSelectedTopicId('');
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className='mb-4'>
        <h2 className='text-lg font-semibold'>Add Topic</h2>
      </div>

      <div className='py-4'>
        <select
          className='w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800'
          value={selectedTopicId}
          onChange={(e) => setSelectedTopicId(e.target.value)}
          disabled={isLoadingTopics || assignTopic.isPending}
        >
          <option value='' disabled>
            {isLoadingTopics ? 'Loading topics...' : 'Select a topic'}
          </option>
          {availableTopics.length === 0 && !isLoadingTopics && (
            <option value='empty' disabled>
              No topics available
            </option>
          )}
          {availableTopics.map((topic) => (
            <option key={topic.id || topic.topicId} value={topic.id || topic.topicId}>
              {topic.topic || topic.name} ({topic.topicCode || topic.code || 'N/A'})
            </option>
          ))}
        </select>
      </div>

      <div className='mt-6 flex justify-end gap-2'>
        <Button variant='outline' onClick={onClose} disabled={assignTopic.isPending}>
          Cancel
        </Button>
        <Button onClick={handleAssign} disabled={!selectedTopicId || assignTopic.isPending}>
          {assignTopic.isPending ? 'Assigning...' : 'Assign'}
        </Button>
      </div>
    </Modal>
  );
}
