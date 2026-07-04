'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useConfigPreview } from '@/services/exam-configs';

interface TemplatesSummaryTabProps {
  configId: string;
}

export function TemplatesSummaryTab({ configId }: TemplatesSummaryTabProps) {
  const { data: preview } = useConfigPreview(configId);
  const totalTemplates = preview?.totalTemplates ?? 0;

  return (
    <div className='space-y-6 max-w-3xl'>
      <div>
        <h3 className='text-lg font-medium'>Templates</h3>
        <p className='text-sm text-muted-foreground'>
          Templates are the standard questions used in your assessments. They are managed independently.
        </p>
      </div>

      <div className='bg-muted/30 border rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4 py-12'>
        <div className='text-4xl font-bold text-foreground'>{totalTemplates}</div>
        <p className='text-sm font-medium text-muted-foreground'>Templates currently available</p>
        <Button asChild variant='outline' className='mt-4'>
          <Link href='/admin/templates' target='_blank'>
            Open Template Manager <ExternalLink className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </div>
    </div>
  );
}
