'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TestPackagePreview } from '@/modules/workflows/components/TestPackagePreview';

export default function AssemblyPackagePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  if (!id) return null;

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto pb-24'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.push(`/admin/assembly/${id}`)}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Test Package Preview</h1>
          <p className='text-muted-foreground mt-1'>
            View the final execution payload that will be sent to the delivery engine.
          </p>
        </div>
      </div>

      <div className='mt-8'>
        <TestPackagePreview assemblyId={id} />
      </div>
    </div>
  );
}
