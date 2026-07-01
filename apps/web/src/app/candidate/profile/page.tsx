'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { ProfileDetailsCard } from '@/modules/profile/components/ProfileDetailsCard';
import { ActiveSessionsCard } from '@/modules/profile/components/ActiveSessionsCard';
import { Loading } from '@/components/ui/loading';

export default function CandidateProfilePage() {
  const { data: user, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-[50vh]'>
        <Loading size='md' />
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
    <div className='animate-fade-in-up max-w-4xl mx-auto'>
      <ProfileDetailsCard user={user} />
      <ActiveSessionsCard />
    </div>
  );
}
