'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/admin/layout/navbar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { cn } from '@/lib/utils';

export default function CandidateDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (
    pathname?.includes('/execution') ||
    pathname?.includes('/demo-sandbox') ||
    pathname?.includes('/sandbox') ||
    pathname?.includes('/mock-exam')
  ) {
    return (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <div className='min-h-screen bg-background'>{children}</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className='flex min-h-screen bg-background flex-col'>
        <div className='print:hidden'>
          <Navbar />
        </div>
        <main
          className={cn('flex-1 overflow-x-hidden w-full bg-background')}
          id='main-content'
          aria-label='Main content'
        >
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
