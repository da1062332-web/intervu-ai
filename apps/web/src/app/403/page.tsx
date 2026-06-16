'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function ForbiddenPage() {
  const router = useRouter();
  const { role } = useAuth();

  const dashboardHref = role === 'CANDIDATE' ? '/candidate/dashboard' : '/admin/dashboard';

  return (
    <div className='min-h-screen w-full flex flex-col items-center justify-center bg-background p-4'>
      <div className='max-w-md w-full text-center space-y-8 animate-fade-in-up'>
        <div className='flex justify-center'>
          <div className='relative'>
            <div className='absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full blur-xl scale-150' />
            <div className='relative bg-background border-4 border-red-100 dark:border-red-900/30 h-24 w-24 rounded-full flex items-center justify-center shadow-lg'>
              <ShieldAlert className='w-10 h-10 text-red-500' />
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <h1 className='text-4xl font-heading font-bold tracking-tight text-foreground'>
            Access Denied
          </h1>
          <p className='text-muted-foreground text-lg'>
            You do not have permission to access this resource.
          </p>
        </div>

        <div className='pt-6 flex flex-col sm:flex-row gap-4 justify-center'>
          <Button variant='outline' onClick={() => router.back()} className='gap-2 h-11'>
            <ArrowLeft className='w-4 h-4' />
            Go Back
          </Button>
          <Button
            asChild
            className='gap-2 h-11 bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-md'
          >
            <Link href={dashboardHref}>
              <Home className='w-4 h-4' />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
