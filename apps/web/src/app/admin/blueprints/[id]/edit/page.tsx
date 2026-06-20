'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBlueprintBuilderStore } from '@/store/blueprint-builder.store';
import { useBlueprint, useUpdateBlueprint } from '@/services/blueprints/hooks';
import { useSections } from '@/services/exam-sections/hooks';
import { StyleProfileSelector } from '@/app/admin/blueprints/components/StyleProfileSelector';
import { SectionConfigurator } from '@/app/admin/blueprints/components/SectionConfigurator';
import { TopicAllocator } from '@/app/admin/blueprints/components/TopicAllocator';
import { DifficultyAllocator } from '@/app/admin/blueprints/components/DifficultyAllocator';
import { BlueprintHealthWidget } from '@/app/admin/blueprints/components/BlueprintHealthWidget';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { BlueprintSectionPayload } from '@/services/blueprints/types';

export default function EditBlueprintPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { selectedConfigId, selectedStyleProfileId, sections, setProfile, initFromExisting } =
    useBlueprintBuilderStore();

  const { data: blueprint, isLoading: isBlueprintLoading, isError } = useBlueprint(id);
  const updateBlueprint = useUpdateBlueprint();
  const { data: configSections, isLoading: isSectionsLoading } = useSections(blueprint?.code || '');

  useEffect(() => {
    if (blueprint && configSections) {
      // Reconstruct sections payload from blueprint structure
      const reconstructedSections: BlueprintSectionPayload[] = blueprint.topics
        ? blueprint.topics.reduce((acc: BlueprintSectionPayload[], topic) => {
            const matchedSection = configSections.find((s) => s.name === topic.sectionName);
            const sectionId =
              matchedSection?.id || topic.sectionName.toLowerCase().replace(/\s+/g, '-');

            let section = acc.find((s) => s.sectionId === sectionId);
            if (!section) {
              section = {
                sectionId: sectionId,
                questionCount: 0,
                topicAllocations: [],
                difficultyAllocation: { easy: 0, medium: 0, hard: 0 },
                templateTypes: ['mcq'],
              };
              acc.push(section);
            }

            section.topicAllocations.push({
              topicId: topic.topicName, // Fallback, normally topicId
              percentage: topic.weightage,
            });

            // Just taking difficulty from first topic as a proxy if it's section-level
            section.difficultyAllocation = {
              easy: topic.difficultyDistribution.easyCount, // This might need percentage conversion, simplifying for MVP
              medium: topic.difficultyDistribution.mediumCount,
              hard: topic.difficultyDistribution.hardCount,
            };

            section.questionCount += topic.questionCount;

            return acc;
          }, [])
        : [];

      initFromExisting(
        blueprint.code, // or configId if available
        blueprint.styleProfileId || '',
        reconstructedSections,
      );
    }
  }, [blueprint, configSections, initFromExisting]);

  const handleSave = async () => {
    if (!selectedConfigId || !selectedStyleProfileId || sections.length === 0) return;

    try {
      await updateBlueprint.mutateAsync({
        id,
        data: {
          configId: selectedConfigId,
          styleProfileId: selectedStyleProfileId,
          sections: sections,
        },
      });
      router.push(`/admin/blueprints/${id}`);
    } catch (error) {
      // toast is handled in mutation hook
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

  if (isBlueprintLoading || isSectionsLoading) {
    return (
      <div className='container mx-auto py-6 space-y-8 max-w-5xl'>
        <Skeleton className='h-12 w-1/3' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (isError || !blueprint) {
    return (
      <div className='container mx-auto py-12 text-center max-w-5xl'>
        <h2 className='text-lg font-medium text-red-600 mb-2'>
          Unable to load blueprint for editing.
        </h2>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-8 max-w-5xl'>
      <div className='flex items-center gap-4'>
        <Link
          href={`/admin/blueprints/${id}`}
          className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
        >
          <ArrowLeft className='w-5 h-5' />
        </Link>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Edit Blueprint: {blueprint.name}</h1>
          <p className='text-muted-foreground'>Modify your blueprint allocations.</p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Wizard Area */}
        <div className='lg:col-span-2 space-y-8'>
          <div className='border rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm space-y-6'>
            <h2 className='text-xl font-semibold border-b pb-4'>1. General Configuration</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <span className='text-sm font-medium'>Exam Configuration</span>
                <div className='p-2 border rounded-md bg-gray-50 text-gray-500'>
                  {blueprint.name} (Locked)
                </div>
              </div>

              <StyleProfileSelector value={selectedStyleProfileId} onChange={setProfile} />
            </div>
          </div>

          <div className='border rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm space-y-6'>
            <h2 className='text-xl font-semibold border-b pb-4'>2. Section Settings</h2>
            <SectionConfigurator configId={selectedConfigId} />
          </div>

          {sections.length > 0 && (
            <div className='border rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm space-y-6'>
              <h2 className='text-xl font-semibold border-b pb-4'>3. Allocations</h2>

              {sections.map((section: BlueprintSectionPayload) => (
                <div key={section.sectionId} className='space-y-6 pt-4'>
                  <h3 className='font-medium text-lg text-indigo-600 dark:text-indigo-400'>
                    Section ID: {section.sectionId}
                  </h3>
                  <TopicAllocator sectionId={section.sectionId} />
                  <DifficultyAllocator sectionId={section.sectionId} />
                  <hr className='my-4 border-gray-200 dark:border-gray-800' />
                </div>
              ))}
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
            disabled={!isReady() || updateBlueprint.isPending}
          >
            {updateBlueprint.isPending && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
