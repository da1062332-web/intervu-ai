'use client';

import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, ShieldCheck } from 'lucide-react';

export function CandidateInfo() {
  const user = useAuthStore((state) => state.user);

  const displayName = user?.fullName || 'Candidate';
  const displayEmail = user?.email || 'candidate@intervu.ai';

  return (
    <Card className='glass-card border border-border/60 shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
          <User className='size-5 text-indigo-500' />
          Candidate Profile
        </CardTitle>
        <CardDescription>Verified account details for the session</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/20'>
          <User className='size-4 text-muted-foreground shrink-0' />
          <div className='flex-1 min-w-0'>
            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>Full Name</p>
            <p className='text-sm font-semibold text-foreground truncate mt-0.5'>{displayName}</p>
          </div>
        </div>

        <div className='flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/20'>
          <Mail className='size-4 text-muted-foreground shrink-0' />
          <div className='flex-1 min-w-0'>
            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>Email Address</p>
            <p className='text-sm font-semibold text-foreground truncate mt-0.5'>{displayEmail}</p>
          </div>
        </div>

        <div className='flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/20'>
          <ShieldCheck className='size-4 text-indigo-500 shrink-0' />
          <div className='flex-1 min-w-0'>
            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>Verification Status</p>
            <p className='text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5'>Authorized Role: Candidate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
