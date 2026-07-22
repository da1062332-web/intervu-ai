'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { ProfileDetailsCard } from '@/modules/profile/components/ProfileDetailsCard';
import { ActiveSessionsCard } from '@/modules/profile/components/ActiveSessionsCard';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { Button } from '@/components/ui/button';
import { EditProfileModal } from '@/modules/profile/components/EditProfileModal';

export default function ProfilePage() {
  const { data: user, isLoading, error } = useCurrentUser();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return <AnimatedLoader variant='page' />;
  }

  if (error || !user) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh] space-y-4'>
        <p className='text-destructive font-medium'>Failed to load profile data.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
      <PageHeader
        title='Profile'
        subtitle='Manage your personal information and account details.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Profile' }]}
        action={
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
