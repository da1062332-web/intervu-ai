import { Metadata } from 'next';
import { ConfigHeader } from '@/components/admin/config/config-header';
import { BlueprintBuilderPageClient } from '../BlueprintBuilderPageClient';

export const metadata: Metadata = {
  title: 'Blueprint Builder | Admin',
  description: 'Visually design topic and difficulty distributions for exams',
};

export default function BlueprintBuilderPage() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <ConfigHeader
        title='Blueprint Visual Builder'
        description='Configure topics, difficulty weights, and style metrics with real-time health updates.'
      />
      <BlueprintBuilderPageClient />
    </div>
  );
}
