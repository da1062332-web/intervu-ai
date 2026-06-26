import { ComingSoon } from '@/components/ui/coming-soon';

export default function CandidateSettingsPage() {
  return (
    <div className='animate-fade-in-up'>
      <div className='mb-8'>
        <h1 className='text-3xl font-heading font-bold tracking-tight text-foreground'>
          Settings
        </h1>
        <p className='text-muted-foreground mt-2'>
          Manage your account settings and preferences.
        </p>
      </div>
      <ComingSoon title='Account Settings Coming Soon' />
    </div>
  );
}
