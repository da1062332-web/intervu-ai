'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { TopicMappingTable } from '@/features/topic-section-mapping/components/TopicMappingTable';
import { AddTopicModal } from '@/features/topic-section-mapping/components/AddTopicModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function SectionTopicsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: topics, isLoading, isError, refetch } = useSectionTopics(sectionId);

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Section Topics</h1>
          <p className='text-muted-foreground'>Manage topics mapped to this section.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Topic</Button>
      </div>

      <div className='border rounded-lg p-4 bg-white shadow-sm'>
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        ) : isError ? (
          <div className='text-center py-10 space-y-4'>
            <p className='text-destructive font-medium'>Unable to load mappings.</p>
            <Button variant='outline' onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : topics && topics.length > 0 ? (
          <TopicMappingTable sectionId={sectionId} topics={topics} />
        ) : (
          <div className='text-center py-10'>
            <h3 className='text-lg font-semibold'>No Topics Assigned</h3>
            <p className='text-muted-foreground mt-2'>Assign your first topic.</p>
            <Button className='mt-4' onClick={() => setIsModalOpen(true)}>
              Assign Topic
            </Button>
          </div>
        )}
      </div>

      <AddTopicModal
        sectionId={sectionId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingTopicIds={topics?.map((t) => t.topicId) || []}
      />
    </div>
  );
}
