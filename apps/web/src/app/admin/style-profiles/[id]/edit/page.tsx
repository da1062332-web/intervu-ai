'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useStyleProfile } from '@/services/blueprints/hooks';
import { StyleProfileForm } from '@/features/style-profiles/components/StyleProfileForm';
import { Loader2 } from 'lucide-react';

export default function EditStyleProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: profile, isLoading, isError } = useStyleProfile(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading style profile details...</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h4 className="font-semibold text-lg text-destructive">Failed to load Style Profile</h4>
        <p className="text-sm text-muted-foreground mt-1">
          The requested style profile could not be found or retrieved.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <StyleProfileForm initialData={profile} isEdit={true} />
    </div>
  );
}
