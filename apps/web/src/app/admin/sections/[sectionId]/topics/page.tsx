'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSectionTopics } from '@/features/topic-section-mapping/api/queries';
import { useTopicMappingStore } from '@/features/topic-section-mapping/store/topic-mapping.store';
import { AvailableTopicsPanel } from '@/features/topic-section-mapping/components/AvailableTopicsPanel';
import { TopicMappingTable } from '@/features/topic-section-mapping/components/TopicMappingTable';
import { WeightageEditor } from '@/features/topic-section-mapping/components/WeightageEditor';
import { TopicMappingHealthWidget } from '@/features/topic-section-mapping/components/TopicMappingHealthWidget';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SectionTopicsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const setSelectedSection = useTopicMappingStore((state) => state.setSelectedSection);
  const setAssignedTopics = useTopicMappingStore((state) => state.setAssignedTopics);

  useEffect(() => {
    setSelectedSection(sectionId);
  }, [sectionId, setSelectedSection]);

  const { data: assignedTopics = [], isLoading: isLoadingTopics, isError, refetch } = useSectionTopics(sectionId);

  useEffect(() => {
    if (assignedTopics) {
      setAssignedTopics(assignedTopics);
    }
  }, [assignedTopics, setAssignedTopics]);

  const existingTopicIds = assignedTopics.map((t) => t.topicId);

  return (
    <div className='container mx-auto py-6 space-y-8 max-w-7xl'>
      <div className='flex items-center gap-4'>
        <Link href='#' onClick={(e: React.MouseEvent) => { e.preventDefault(); window.history.back(); }} className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'>
          <ArrowLeft className='w-5 h-5' />
        </Link>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Manage Topics</h1>
          <p className='text-muted-foreground'>Configure topics and weightages for this section.</p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Column - Available Topics */}
        <div className='lg:col-span-1 border rounded-lg bg-background shadow-sm p-6'>
          <AvailableTopicsPanel sectionId={sectionId} existingTopicIds={existingTopicIds} />
        </div>

        {/* Right Column - Configuration & Health */}
        <div className='lg:col-span-2 space-y-8'>
          <div className='border rounded-lg bg-background shadow-sm p-6'>
            <h3 className='text-lg font-medium mb-4'>Assigned Topics</h3>
            <TopicMappingTable 
              sectionId={sectionId} 
              topics={assignedTopics} 
              isLoading={isLoadingTopics} 
              isError={isError} 
              onRetry={() => refetch()} 
            />
          </div>

          <div className='border rounded-lg bg-background shadow-sm p-6'>
            <WeightageEditor sectionId={sectionId} topics={assignedTopics} />
          </div>

          <TopicMappingHealthWidget topics={assignedTopics} />
        </div>
      </div>
    </div>
  );
}
