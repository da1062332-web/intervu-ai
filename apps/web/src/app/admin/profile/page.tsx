'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { SectionHeader } from '@/components/ui/section-header';
import { ProfileDetailsCard } from '@/modules/profile/components/ProfileDetailsCard';
import { ActiveSessionsCard } from '@/modules/profile/components/ActiveSessionsCard';
import { DetailPageSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import { EditProfileModal } from '@/modules/profile/components/EditProfileModal';

export default function ProfilePage() {
  const { data: user, isLoading, error } = useCurrentUser();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
        <DetailPageSkeleton />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh] space-y-4'>
        <p className='text-destructive font-medium'>Failed to load profile data.</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up pb-8'>
      <SectionHeader
        title='Profile'
        description='Manage your personal information and account details.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Profile' }]}
        actions={
          <Button onClick={() => setIsEditModalOpen(true)}>
            Edit Profile
          </Button>
        }
      />

      <ProfileDetailsCard user={user} />
      <ActiveSessionsCard />
      
      {user && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}
