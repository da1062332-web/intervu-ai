'use client';

import { useState } from 'react';
import { SectionBuilder } from '@/modules/exam-config/components/section-builder';
import { cn } from '@/lib/utils';
import { useConfig } from '@/services/exam-configs';
import { Skeleton } from '@/components/ui/skeleton';

interface ConfigPageClientProps {
  configId: string;
}

export function ConfigPageClient({ configId }: ConfigPageClientProps) {
  const [activeTab, setActiveTab] = useState('sections');
  const { data: config, isLoading, isError } = useConfig(configId);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'sections', label: 'Sections' },
    { id: 'rules', label: 'Rules' },
    { id: 'preview', label: 'Preview' },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/4 mt-2" />
        <Skeleton className="h-12 w-full mt-8" />
        <Skeleton className="h-64 w-full mt-8" />
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center py-12 border rounded-md">
          <h3 className="text-lg font-medium text-red-600 mb-2">Configuration Not Found</h3>
          <p className="text-muted-foreground">The exam configuration you are looking for does not exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{config.name}</h1>
        <p className="text-muted-foreground mt-2">Manage the settings, sections, and rules for this exam.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'general' && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <p className="text-gray-500 dark:text-gray-400">General settings placeholder</p>
          </div>
        )}
        
        {activeTab === 'sections' && (
          <SectionBuilder configId={configId} />
        )}
        
        {activeTab === 'rules' && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <p className="text-gray-500 dark:text-gray-400">Rules configuration placeholder</p>
          </div>
        )}
        
        {activeTab === 'preview' && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <p className="text-gray-500 dark:text-gray-400">Preview placeholder</p>
          </div>
        )}
      </div>
    </div>
  );
}
