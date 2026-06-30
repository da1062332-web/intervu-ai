'use client';

import { useState } from 'react';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { AuthUser } from '@/types/auth.types';
import { Button } from '@/components/ui/button';
import { EditProfileModal } from './EditProfileModal';

interface ProfileDetailsCardProps {
  user: AuthUser;
}

export function ProfileDetailsCard({ user }: ProfileDetailsCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const userName = user.name || user.fullName || 'Not set';
  const userInitial = (userName !== 'Not set' ? userName : user.email)[0].toUpperCase();
  const userEmail = user.email || 'Not set';
  
  // Format createdAt date if available
  const memberSince = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : '—';

  return (
    <>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-heading font-bold tracking-tight text-foreground'>
            My Profile
          </h1>
          <p className='text-muted-foreground mt-1'>Manage your personal information and account details.</p>
        </div>
        <Button onClick={() => setIsEditModalOpen(true)} size='sm' className='shrink-0'>
          Edit Profile
        </Button>
      </div>

      <div className='space-y-6'>
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
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className='rounded-2xl border border-border bg-card shadow-sm divide-y divide-border'>
          {[
            { icon: User, label: 'Full Name', value: userName },
            { icon: Mail, label: 'Email Address', value: userEmail },
            { icon: Shield, label: 'Account Role', value: user.role },
            { icon: Calendar, label: 'Member Since', value: memberSince },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className='flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors'>
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

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={user} 
      />
    </>
  );
}
