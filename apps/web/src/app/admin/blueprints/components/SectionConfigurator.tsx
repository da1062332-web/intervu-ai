'use client';

import { useSections } from '@/services/exam-sections/hooks';
import { useBlueprintBuilderStore } from '@/store/blueprint-builder.store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

interface SectionConfiguratorProps {
  configId: string;
}

const TEMPLATE_OPTIONS = [
  { id: 'mcq', label: 'MCQ' },
  { id: 'coding', label: 'Coding' },
  { id: 'subjective', label: 'Subjective' },
  { id: 'case_study', label: 'Case Study' },
];

export function SectionConfigurator({ configId }: SectionConfiguratorProps) {
  const { data: sections, isLoading, isError } = useSections(configId);
  const sectionsState = useBlueprintBuilderStore((state) => state.sections);
  const updateSection = useBlueprintBuilderStore((state) => state.updateSection);

  useEffect(() => {
    // Initialize sections if they don't exist in store yet
    if (sections && sections.length > 0) {
      sections.forEach((section) => {
        const existing = sectionsState.find((s) => s.sectionId === section.id);
        if (!existing) {
          updateSection(section.id, {
            questionCount: section.questionCount || 20,
            templateTypes: ['mcq'],
          });
        }
      });
    }
  }, [sections, sectionsState, updateSection]);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
    );
  }

  if (isError || !sections || sections.length === 0) {
    return <p className='text-muted-foreground'>No sections found for this config.</p>;
  }

  return (
    <div className='space-y-6'>
      {sections.map((section) => {
        const sectionState = sectionsState.find((s) => s.sectionId === section.id) || {
          questionCount: 0,
          templateTypes: [] as string[],
        };

        const toggleTemplateType = (typeId: string, checked: boolean) => {
          const currentTypes = sectionState.templateTypes || [];
          const nextTypes = checked
            ? [...currentTypes, typeId]
            : currentTypes.filter((t) => t !== typeId);

          updateSection(section.id, { templateTypes: nextTypes });
        };

        return (
          <div
            key={section.id}
            className='p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50 space-y-4'
          >
            <div className='flex justify-between items-center'>
              <h4 className='font-medium text-lg'>{section.name}</h4>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label>Question Count</Label>
                <Input
                  type='number'
                  min='1'
                  value={sectionState.questionCount}
                  onChange={(e) =>
                    updateSection(section.id, { questionCount: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label>Template Types</Label>
                <div className='grid grid-cols-2 gap-2 mt-2'>
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <div key={opt.id} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`${section.id}-${opt.id}`}
                        checked={(sectionState.templateTypes || []).includes(opt.id)}
                        onCheckedChange={(checked: boolean | 'indeterminate') =>
                          toggleTemplateType(opt.id, checked === true)
                        }
                      />
                      <label
                        htmlFor={`${section.id}-${opt.id}`}
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
