import { Metadata } from 'next';
import { TopicDetailPageClient } from './TopicDetailPageClient';

export const metadata: Metadata = {
  title: 'Topic Details & Concepts | Admin',
  description: 'Manage nested concept nodes and topic properties',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function TopicDetailPage({ params }: PageProps) {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <TopicDetailPageClient topicId={params.id} />
    </div>
  );
}
