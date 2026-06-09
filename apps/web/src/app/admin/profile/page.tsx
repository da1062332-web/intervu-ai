'use client';

import { User, Mail, Shield, Calendar } from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  const userInitial = (user?.fullName ?? user?.email ?? 'U')[0].toUpperCase();
  const userName = user?.fullName ?? 'Not set';
  const userEmail = user?.email ?? 'Not set';

  return (
    <div className='space-y-6 max-w-2xl'>
      <PageHeader
        title='Profile'
        subtitle='Manage your personal information and account details.'
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
        action={
          <Button id='edit-profile-btn' size='sm'>
            Edit Profile
          </Button>
        }
      />

      {/* Avatar + name card */}
      <div className='rounded-2xl border border-border bg-card p-6 shadow-sm'>
        <div className='flex items-center gap-5'>
          <div className='flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary text-3xl font-bold border border-primary/20 shrink-0'>
            {userInitial}
          </div>
          <div>
            <h2 className='text-xl font-heading font-semibold text-foreground'>{userName}</h2>
            <p className='text-sm text-muted-foreground mt-0.5'>{userEmail}</p>
            <span className='mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'>
              <Shield className='size-3' />
              {user?.role ?? 'CANDIDATE'}
            </span>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className='rounded-2xl border border-border bg-card shadow-sm divide-y divide-border'>
        {[
          { icon: User, label: 'Full Name', value: userName },
          { icon: Mail, label: 'Email Address', value: userEmail },
          { icon: Shield, label: 'Account Role', value: user?.role ?? 'CANDIDATE' },
          { icon: Calendar, label: 'Member Since', value: '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className='flex items-center gap-4 px-6 py-4'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted'>
              <Icon className='size-4 text-muted-foreground' aria-hidden='true' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                {label}
              </p>
              <p className='mt-0.5 text-sm font-medium text-foreground truncate'>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
