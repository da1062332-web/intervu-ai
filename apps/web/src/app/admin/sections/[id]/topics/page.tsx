'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { TopicMappingTable } from '@/features/topic-section-mapping/components/TopicMappingTable';
import { AvailableTopicsPanel } from '@/features/topic-section-mapping/components/AvailableTopicsPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { SectionTopicResponse } from '@intervu-ai/contracts';

export default function SectionTopicsPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id as string;

  const { data, isLoading, isError, refetch } = useSectionTopics(sectionId);
  // data might be wrapped in an api success response depending on how the hook is mapped, but usually apiClient unwraps it if it's `{ success: true, data }`
  // Looking at useSectionTopics: queryFn: () => apiClient.request<SectionTopicResponse[]>(...)
  const topics: SectionTopicResponse[] = Array.isArray(data) ? data : (data as any)?.data || [];

  const existingTopicIds = topics.map((t) => t.topicId);

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <Button
            variant='ghost'
            className='mb-2 -ml-4 text-muted-foreground'
            onClick={() => router.back()}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Config
          </Button>
          <h1 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-white'>
            Topic Mapping
          </h1>
          <p className='text-muted-foreground mt-2'>Assign topics and concepts to this section.</p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-card border rounded-lg p-6 shadow-sm'>
            <h2 className='text-xl font-semibold mb-4'>Assigned Topics</h2>
            <TopicMappingTable
              sectionId={sectionId}
              topics={topics}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
            />
          </div>
        </div>
        <div className='lg:col-span-1'>
          <div className='bg-card border rounded-lg p-6 shadow-sm sticky top-6'>
            <AvailableTopicsPanel sectionId={sectionId} existingTopicIds={existingTopicIds} />
          </div>
        </div>
      </div>
    </div>
  );
}
