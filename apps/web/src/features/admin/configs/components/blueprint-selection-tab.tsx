'use client';

import React from 'react';
import { useBlueprints } from '@/services/blueprints/hooks';
import { useConfigWizardStore } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { StyleProfileSelector } from '@/app/admin/blueprints/components/StyleProfileSelector';
import { apiClient } from '@/services/api/client';

interface BlueprintSelectionTabProps {
  configId: string;
}

export function BlueprintSelectionTab({ configId }: BlueprintSelectionTabProps) {
  const { data: blueprints, isLoading } = useBlueprints();
  const selectedBlueprintId = useConfigWizardStore((state) => state.getBlueprintId(configId));
  const setBlueprintId = useConfigWizardStore((state) => state.setBlueprintId);
  const selectedStyleProfileId = useConfigWizardStore((state) => state.getStyleProfileId(configId)) || '';
  const setStyleProfileId = useConfigWizardStore((state) => state.setStyleProfileId);

  const handleStyleProfileChange = async (val: string) => {
    setStyleProfileId(configId, val);
    try {
      const res = await apiClient.request<any>('/blueprints', {
        method: 'POST',
        body: {
          configId,
          styleProfileId: val,
          sections: [],
        },
      });
      if (res?.data?.id || res?.data?.blueprintId) {
        setBlueprintId(configId, res.data.id || res.data.blueprintId);
      }
    } catch (err) {
      console.warn('Immediate blueprint binding pending publish:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedBlueprint = blueprints?.find((b) => b.id === selectedBlueprintId);

  return (
    <div className='max-w-4xl mx-auto space-y-8 py-4'>
      <div className='space-y-1'>
        <h3 className='text-2xl font-semibold tracking-tight'>Blueprint Selection</h3>
        <p className='text-muted-foreground'>
          Select a blueprint to define the structure, topics, and templates for this configuration.
        </p>
      </div>

      <div className='p-6 border rounded-xl bg-card shadow-sm space-y-6'>
        <div className='flex flex-col space-y-2'>
          <label className='text-sm font-medium text-foreground'>Blueprint</label>
          <select
            className='h-12 rounded-lg border border-input bg-background px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-ring'
            value={selectedBlueprintId || ''}
            onChange={(e) => setBlueprintId(configId, e.target.value)}
          >
            <option value=''>
              ✨ Auto-Generate Blueprint Matching Sections (Default)
            </option>
            {blueprints?.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.name || bp.displayName || bp.title || `Blueprint (${bp.id.slice(0, 8)})`}
              </option>
            ))}
          </select>
        </div>

        {!selectedBlueprintId && (
          <div className='bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-6 space-y-4'>
            <div>
              <h4 className='text-base font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-2'>
                ✨ Auto-Generate Blueprint Mode
              </h4>
              <p className='text-sm text-muted-foreground mt-1'>
                The system will automatically build and bind a blueprint matching your section structure and topic allocations upon publishing.
              </p>
            </div>
            <div className='pt-2 max-w-md'>
              <StyleProfileSelector
                value={selectedStyleProfileId}
                onChange={(val) => handleStyleProfileChange(val)}
              />
            </div>
          </div>
        )}

        {selectedBlueprint && (
          <div className='bg-muted/10 border rounded-lg p-6 space-y-4'>
            <div>
              <h4 className='text-lg font-semibold text-foreground'>{selectedBlueprint.name}</h4>
              {selectedBlueprint.description && (
                <p className='text-sm text-muted-foreground mt-1'>
                  {selectedBlueprint.description}
                </p>
              )}
            </div>
            <div className='pt-2'>
              <Button asChild variant='outline' className='shadow-sm'>
                <Link href={`/admin/blueprints/${selectedBlueprint.id}`} target='_blank'>
                  View Blueprint Details <ExternalLink className='ml-2 h-4 w-4' />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
