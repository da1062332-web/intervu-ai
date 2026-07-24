'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBlueprintBuilderStore } from '@/store/blueprint-builder.store';
import { useConfigs } from '@/services/exam-configs';
import { useCreateBlueprint } from '@/services/blueprints/hooks';
import { StyleProfileSelector } from '@/app/admin/blueprints/components/StyleProfileSelector';
import { SectionConfigurator } from '@/app/admin/blueprints/components/SectionConfigurator';
import { TopicAllocator } from '@/app/admin/blueprints/components/TopicAllocator';
import { DifficultyAllocator } from '@/app/admin/blueprints/components/DifficultyAllocator';
import { BlueprintHealthWidget } from '@/app/admin/blueprints/components/BlueprintHealthWidget';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import type { BlueprintSectionPayload } from '@/services/blueprints/types';
import toast from 'react-hot-toast';
import { useSections } from '@/services/exam-sections/hooks';

export default function CreateBlueprintPage() {
  const router = useRouter();

  const { selectedConfigId, selectedStyleProfileId, sections, setConfig, setProfile, reset } =
    useBlueprintBuilderStore();

  const { data: configs, isLoading: isConfigsLoading } = useConfigs();
  const { data: configSections } = useSections(selectedConfigId || '');
  const createBlueprint = useCreateBlueprint();

  // Reset store when entering creation flow
  useEffect(() => {
    reset();
  }, [reset]);

  const handleSave = async () => {
    if (!selectedConfigId || !selectedStyleProfileId || sections.length === 0) return;

    try {
      await createBlueprint.mutateAsync({
        configId: selectedConfigId,
        styleProfileId: selectedStyleProfileId,
        sections: sections,
      });
      toast.success('Blueprint created successfully');
      router.push('/admin/blueprints');
    } catch (error: any) {
      const details = error?.response?.data?.error?.details;
      const detailsMsg = Array.isArray(details) ? details.join(', ') : '';
      const errorMsg =
        detailsMsg ||
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to create blueprint';
      toast.error(errorMsg);
    }
  };

  const isReady = () => {
    if (!selectedConfigId || !selectedStyleProfileId || sections.length === 0) return false;

    return sections.every((s: BlueprintSectionPayload) => {
      const topicSum = s.topicAllocations.reduce((acc, t) => acc + (t.percentage || 0), 0);
      const diffSum =
        (s.difficultyAllocation?.easy || 0) +
        (s.difficultyAllocation?.medium || 0) +
        (s.difficultyAllocation?.hard || 0);
      const hasTemplates = s.templateTypes && s.templateTypes.length > 0;
      return topicSum === 100 && diffSum === 100 && hasTemplates;
    });
  };

  return (
    <div className='container mx-auto space-y-8 max-w-5xl animate-fade-in-up pb-8'>
      <SectionHeader 
        title='Create New Blueprint'
        description='Configure an exam blueprint from start to finish.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Blueprints', href: '/admin/blueprints' }, { label: 'New' }]}
      />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Wizard Area */}
        <div className='lg:col-span-2 space-y-8'>
          <div className='border rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm space-y-6'>
            <h2 className='text-xl font-semibold border-b pb-4'>1. General Configuration</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label>Exam Configuration</Label>
                <select
                  value={selectedConfigId}
                  onChange={(e) => setConfig(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md bg-background'
                >
                  <option value=''>-- Select Config --</option>
                  {configs?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {isConfigsLoading && (
                  <p className='text-xs text-muted-foreground'>Loading configs...</p>
                )}
              </div>

              <StyleProfileSelector value={selectedStyleProfileId} onChange={setProfile} />
            </div>
          </div>

          {selectedConfigId && (
            <div className='border rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm space-y-6'>
              <h2 className='text-xl font-semibold border-b pb-4'>2. Section Settings</h2>
              <SectionConfigurator configId={selectedConfigId} />
            </div>
          )}

          {selectedConfigId && sections.length > 0 && (
            <div className='border rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm space-y-6'>
              <h2 className='text-xl font-semibold border-b pb-4'>3. Allocations</h2>

              {sections.map((section: BlueprintSectionPayload) => {
                const sectionName = configSections?.find((s) => s.id === section.sectionId)?.name || section.sectionId;

                return (
                  <div key={section.sectionId} className='space-y-6 pt-4'>
                    <h3 className='font-semibold text-lg text-indigo-600 dark:text-indigo-400'>
                      Section: {sectionName}
                    </h3>
                    <TopicAllocator sectionId={section.sectionId} />
                    <DifficultyAllocator sectionId={section.sectionId} />
                    <hr className='my-4 border-gray-200 dark:border-gray-800' />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          <BlueprintHealthWidget />

          <Button
            className='w-full'
            size='lg'
            onClick={handleSave}
            disabled={!isReady() || createBlueprint.isPending}
          >
            {createBlueprint.isPending && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
            Save Blueprint
          </Button>
          <div className='text-center text-xs text-muted-foreground'>
            <p>Will be saved as Draft status.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
