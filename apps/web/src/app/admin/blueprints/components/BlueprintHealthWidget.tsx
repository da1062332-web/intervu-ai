'use client';

import { useBlueprintBuilderStore } from '@/store/blueprint-builder.store';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useConfigs } from '@/services/exam-configs';
import { useStyleProfiles } from '@/services/blueprints/hooks';
import type { BlueprintSectionPayload } from '@/services/blueprints/types';

interface BlueprintHealthWidgetProps {
  blueprintId?: string;
  topicSum?: number; // legacy backwards compatibility
  difficultySum?: number; // legacy backwards compatibility
}

export function BlueprintHealthWidget(props: BlueprintHealthWidgetProps) {
  const { selectedConfigId, selectedStyleProfileId, sections } = useBlueprintBuilderStore();
  const { data: configs } = useConfigs();
  const { data: profiles } = useStyleProfiles();

  const configSelected = !!selectedConfigId && configs?.some(c => c.id === selectedConfigId);
  const profileSelected = !!selectedStyleProfileId && profiles?.some(p => p.id === selectedStyleProfileId);
  const sectionsConfigured = sections.length > 0;

  const topicAllocationValid = sections.length > 0 && sections.every((s: BlueprintSectionPayload) => {
    const sum = s.topicAllocations.reduce((acc, t) => acc + (t.percentage || 0), 0);
    return sum === 100;
  });

  const difficultyAllocationValid = sections.length > 0 && sections.every((s: BlueprintSectionPayload) => {
    const diff = s.difficultyAllocation;
    const sum = (diff?.easy || 0) + (diff?.medium || 0) + (diff?.hard || 0);
    return sum === 100;
  });

  const templateTypesSelected = sections.length > 0 && sections.every((s: BlueprintSectionPayload) => {
    return s.templateTypes && s.templateTypes.length > 0;
  });

  const isReady = configSelected && profileSelected && sectionsConfigured && topicAllocationValid && difficultyAllocationValid && templateTypesSelected;

  return (
    <div className='p-6 border rounded-lg bg-background shadow-sm space-y-4'>
      <h3 className='text-lg font-medium'>Blueprint Health</h3>
      
      <ul className='space-y-3'>
        <li className='flex items-center gap-3'>
          {configSelected ? <CheckCircle2 className='w-5 h-5 text-green-500' /> : <XCircle className='w-5 h-5 text-red-500' />}
          <span className={configSelected ? 'text-foreground' : 'text-muted-foreground'}>Config Selected</span>
        </li>
        <li className='flex items-center gap-3'>
          {profileSelected ? <CheckCircle2 className='w-5 h-5 text-green-500' /> : <XCircle className='w-5 h-5 text-red-500' />}
          <span className={profileSelected ? 'text-foreground' : 'text-muted-foreground'}>Style Profile Selected</span>
        </li>
        <li className='flex items-center gap-3'>
          {sectionsConfigured ? <CheckCircle2 className='w-5 h-5 text-green-500' /> : <XCircle className='w-5 h-5 text-red-500' />}
          <span className={sectionsConfigured ? 'text-foreground' : 'text-muted-foreground'}>Sections Configured</span>
        </li>
        <li className='flex items-center gap-3'>
          {topicAllocationValid ? <CheckCircle2 className='w-5 h-5 text-green-500' /> : <XCircle className='w-5 h-5 text-red-500' />}
          <span className={topicAllocationValid ? 'text-foreground' : 'text-muted-foreground'}>Topic Allocation (100%)</span>
        </li>
        <li className='flex items-center gap-3'>
          {difficultyAllocationValid ? <CheckCircle2 className='w-5 h-5 text-green-500' /> : <XCircle className='w-5 h-5 text-red-500' />}
          <span className={difficultyAllocationValid ? 'text-foreground' : 'text-muted-foreground'}>Difficulty Mix (100%)</span>
        </li>
        <li className='flex items-center gap-3'>
          {templateTypesSelected ? <CheckCircle2 className='w-5 h-5 text-green-500' /> : <XCircle className='w-5 h-5 text-red-500' />}
          <span className={templateTypesSelected ? 'text-foreground' : 'text-muted-foreground'}>Template Types Selected</span>
        </li>
      </ul>

      <div className={`p-3 rounded-md border mt-4 ${isReady ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className={`font-semibold flex items-center gap-2 ${isReady ? 'text-green-700' : 'text-red-700'}`}>
          {isReady ? (
            <><CheckCircle2 className='w-4 h-4' /> Generation Ready</>
          ) : (
            <><XCircle className='w-4 h-4' /> Invalid Blueprint</>
          )}
        </p>
      </div>
    </div>
  );
}
