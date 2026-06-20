import { Metadata } from 'next';
import { TopicsPageClient } from './TopicsPageClient';

export const metadata: Metadata = {
  title: 'Topic Registry | Admin',
  description: 'Manage and register topics and concepts',
};

export default function TopicsPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <TopicsPageClient />
    </div>
  );
}
