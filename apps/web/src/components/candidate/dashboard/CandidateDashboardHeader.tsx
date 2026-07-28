import { useAuthStore } from '@/store/auth.store';
import { SectionHeader } from '@/components/ui/section-header';
import { Calendar } from 'lucide-react';

export function CandidateDashboardHeader() {
  const user = useAuthStore((state) => state.user);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  // Fallback to "Candidate" if user name is not available
  const displayName = user?.name || user?.fullName || 'Candidate';

  return (
    <SectionHeader
      title={`Welcome back, ${displayName} 👋`}
      description='Here is an overview of your active evaluations, performance analytics, and recommended assessments.'
      actions={
        <div className='flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-card/80 px-3.5 py-2 rounded-lg border border-border/60 shadow-2xs'>
          <Calendar className='size-3.5 text-primary/80' />
          <span>{formattedDate}</span>
        </div>
      }
    />
  );
}
