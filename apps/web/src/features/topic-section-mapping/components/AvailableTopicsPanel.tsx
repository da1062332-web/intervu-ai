'use client';

import { useState } from 'react';
import { useAdminTopics, useAssignTopic } from '../api/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

interface AvailableTopicsPanelProps {
  sectionId: string;
  existingTopicIds: string[];
}

export function AvailableTopicsPanel({ sectionId, existingTopicIds }: AvailableTopicsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: topics = [], isLoading: isLoadingTopics, isError, refetch } = useAdminTopics();
  const assignTopic = useAssignTopic(sectionId);

  const availableTopics = topics.filter(
    (topic) => !existingTopicIds.includes(topic.id || topic.topicId),
  );

  const filteredTopics = availableTopics.filter((topic) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (topic.topic || topic.name || '').toLowerCase();
    const code = (topic.topicCode || topic.code || '').toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  const handleAssign = (topicId: string) => {
    assignTopic.mutate(topicId);
  };

  if (isError) {
    return (
      <div className='p-6 border rounded-lg bg-red-50 dark:bg-red-900/10 text-center'>
        <p className='text-red-600 mb-4'>Unable to load available topics.</p>
        <Button onClick={() => refetch()} variant='outline'>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-medium'>Available Topics</h3>
        <div className='relative w-64'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search topics...'
            className='pl-8'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className='border rounded-lg overflow-hidden'>
        {isLoadingTopics ? (
          <div className='p-4 space-y-4'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className='p-8 text-center text-muted-foreground'>
            {availableTopics.length === 0 ? 'No Topics Available' : 'No matching topics found.'}
          </div>
        ) : (
          <ul className='divide-y'>
            {filteredTopics.map((topic) => {
              const id = topic.id || topic.topicId;
              const isAssigning = assignTopic.isPending && assignTopic.variables === id;
              return (
                <li key={id} className='flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50'>
                  <div>
                    <p className='font-medium'>{topic.topic || topic.name}</p>
                    <p className='text-sm text-muted-foreground'>{topic.topicCode || topic.code}</p>
                  </div>
                  <Button 
                    size='sm' 
                    onClick={() => handleAssign(id)}
                    disabled={assignTopic.isPending}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Topic'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
