'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useConfigPreview } from '@/services/exam-configs';

interface TopicsSummaryTabProps {
  configId: string;
}

export function TopicsSummaryTab({ configId }: TopicsSummaryTabProps) {
  const { data: preview } = useConfigPreview(configId);
  const totalTopics = preview?.totalTopics ?? 0;

  return (
    <div className='space-y-6 max-w-3xl'>
      <div>
        <h3 className='text-lg font-medium'>Topics</h3>
        <p className='text-sm text-muted-foreground'>
          Topics define the high-level subjects covered in this configuration. They are managed independently.
        </p>
      </div>

      <div className='bg-muted/30 border rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4 py-12'>
        <div className='text-4xl font-bold text-foreground'>{totalTopics}</div>
        <p className='text-sm font-medium text-muted-foreground'>Topics currently configured</p>
        <Button asChild variant='outline' className='mt-4'>
          <Link href='/admin/topics' target='_blank'>
            Open Topic Manager <ExternalLink className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </div>
    </div>
  );
}
