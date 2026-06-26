import { ComingSoon } from '@/components/ui/coming-soon';

export default function CandidateInterviewsPage() {
  return (
    <div className='animate-fade-in-up'>
      <div className='mb-8'>
        <h1 className='text-3xl font-heading font-bold tracking-tight text-foreground'>
          My Interviews
        </h1>
        <p className='text-muted-foreground mt-2'>
          Manage and review your upcoming and past live interviews.
        </p>
      </div>
      <ComingSoon title='Live Interviews Coming Soon' />
    </div>
  );
}
