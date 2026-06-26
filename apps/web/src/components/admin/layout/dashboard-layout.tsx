'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className='flex min-h-screen bg-background'>
      {/* ── Desktop Sidebar ── */}
      <Sidebar />

      {/* ── Mobile Navigation Drawer ── */}
      <MobileNav />

      {/* ── Main Content Area ── */}
      <div
        className={cn('flex flex-1 flex-col min-w-0', 'transition-all duration-300 ease-in-out')}
      >
        {/* ── Top Navigation Bar ── */}
        <Navbar />

        {/* ── Page Content ── */}
        <main
          className='flex-1 overflow-auto p-4 sm:p-6 lg:p-8 animate-fade-in-up mx-auto w-full max-w-7xl'
          id='main-content'
          aria-label='Main content'
        >
          {children}
        </main>
      </div>
    </div>
  );
}
