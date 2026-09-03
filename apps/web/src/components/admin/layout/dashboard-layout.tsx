'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { useAuthStore } from '@/store/auth.store';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.role === 'PLAN_MANAGER') {
      const allowed = ['/admin/billing', '/admin/profile', '/admin/settings'];
      if (!allowed.some((prefix) => pathname.startsWith(prefix))) {
        router.replace('/admin/billing');
      }
    }
  }, [user, pathname, router]);

  if (
    pathname.includes('/execution') ||
    pathname.includes('/demo-sandbox') ||
    pathname.includes('/sandbox') ||
    pathname.includes('/mock-exam')
  ) {
    return <div className='min-h-screen bg-background'>{children}</div>;
  }

  return (
    <div className='flex min-h-screen bg-background'>
      {/* ── Desktop Sidebar ── */}
      <div className='print:hidden'>
        <Sidebar />
      </div>

      {/* ── Mobile Navigation Drawer ── */}
      <MobileNav />

      {/* ── Main Content Area ── */}
      <div
        className={cn('flex flex-1 flex-col min-w-0', 'transition-all duration-300 ease-in-out')}
      >
        {/* ── Top Navigation Bar ── */}
        <div className='print:hidden'>
          <Navbar />
        </div>

        {/* ── Page Content ── */}
        <main
          className='flex-1 overflow-auto p-4 sm:p-6 lg:p-4 animate-fade-in-up mx-auto w-full max-w-7xl'
          id='main-content'
          aria-label='Main content'
        >
          {children}
        </main>
      </div>
    </div>
  );
}
