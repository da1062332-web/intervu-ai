import { ComingSoon } from '@/components/ui/coming-soon';

export default function CandidateProfilePage() {
  return (
    <div className='animate-fade-in-up'>
      <div className='mb-8'>
        <h1 className='text-3xl font-heading font-bold tracking-tight text-foreground'>
          My Profile
        </h1>
        <p className='text-muted-foreground mt-2'>Manage your personal information and resume.</p>
      </div>
      <ComingSoon title='Profile Management Coming Soon' />
    </div>
  );
}
