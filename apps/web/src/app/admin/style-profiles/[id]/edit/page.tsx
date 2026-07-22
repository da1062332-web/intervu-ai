'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStyleProfile } from '@/services/blueprints/hooks';
import { StyleProfileForm } from '@/features/style-profiles/components/StyleProfileForm';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';

export default function EditStyleProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: profile, isLoading, isError } = useStyleProfile(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl h-[50vh]">
        <AnimatedLoader variant="page" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl h-[50vh]">
        <EmptyState
          variant="error"
          title="Failed to load Style Profile"
          description="The requested style profile could not be found or retrieved."
          actionLabel="Go Back"
          onAction={() => router.push('/admin/style-profiles')}
          className="border rounded-md"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <StyleProfileForm initialData={profile} isEdit={true} />
    </div>
  );
}
