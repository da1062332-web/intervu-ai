'use client';

import React from 'react';
import { useBlueprints } from '@/services/blueprints/hooks';
import { useConfigWizardStore } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface BlueprintSelectionTabProps {
  configId: string;
}

export function BlueprintSelectionTab({ configId }: BlueprintSelectionTabProps) {
  const { data: blueprints, isLoading } = useBlueprints();
  const selectedBlueprintId = useConfigWizardStore((state) => state.getBlueprintId(configId));
  const setBlueprintId = useConfigWizardStore((state) => state.setBlueprintId);

  if (isLoading) {
    return (
      <div className='space-y-6 max-w-2xl'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    );
  }

  const selectedBlueprint = blueprints?.find((b) => b.id === selectedBlueprintId);

  return (
    <div className='space-y-6 max-w-3xl'>
      <div>
        <h3 className='text-lg font-medium'>Blueprint Selection</h3>
        <p className='text-sm text-muted-foreground'>
          Select a blueprint to define the structure, topics, and templates for this configuration.
        </p>
      </div>

      <div className='space-y-4 mt-6'>
        <div className='flex flex-col space-y-2'>
          <label className='text-sm font-medium text-foreground'>Blueprint</label>
          <select
            className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
            value={selectedBlueprintId || ''}
            onChange={(e) => setBlueprintId(configId, e.target.value)}
          >
            <option value='' disabled>
              ▼ Select Blueprint
            </option>
            {blueprints?.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBlueprint && (
          <div className='bg-muted/30 border rounded-lg p-6 space-y-6'>
            <div>
              <h4 className='text-base font-semibold text-foreground'>Selected Blueprint</h4>
              <p className='text-sm text-muted-foreground mt-1'>{selectedBlueprint.name}</p>
              {selectedBlueprint.description && (
                <p className='text-sm text-muted-foreground mt-1'>
                  {selectedBlueprint.description}
                </p>
              )}
            </div>
            <div className='flex gap-4'>
              <Button asChild variant='outline'>
                <Link href={`/admin/blueprints/${selectedBlueprint.id}`} target='_blank'>
                  View Blueprint Configuration <ExternalLink className='ml-2 h-4 w-4' />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
