import { useAuthStore } from '@/store/auth.store';

export function CandidateDashboardHeader() {
  const user = useAuthStore((state) => state.user);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  // Fallback to "Candidate" if user name is not available
  const displayName = user?.fullName || 'Candidate';

  return (
    <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-fade-in-up'>
      <div>
        <h1 className='text-3xl font-heading font-bold tracking-tight text-foreground'>
          Welcome Back
        </h1>
        <p className='text-xl text-muted-foreground mt-1'>{displayName}</p>
      </div>
      <div className='text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border/50'>
        {formattedDate}
      </div>
    </div>
  );
}
