'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { ProfileDetailsCard } from '@/modules/profile/components/ProfileDetailsCard';
import { ActiveSessionsCard } from '@/modules/profile/components/ActiveSessionsCard';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { data: user, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-destructive font-medium">Failed to load profile data.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
      <PageHeader
        title='Profile'
        subtitle='Manage your personal information and account details.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Profile' }]}
      />

      <ProfileDetailsCard user={user} />
      <ActiveSessionsCard />
    </div>
  );
}
