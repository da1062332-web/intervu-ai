'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, Bell, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { authApi } from '@/services/api/auth.api';
import { notifySuccess } from '@/services/notifications/toast';
import { useAuthStore } from '@/store/auth.store';
import { useLayoutStore } from '@/store/layout.store';
import { useActiveRoute } from '@/hooks/use-active-route';
import { Button } from '@/components/ui/button';
import { MobileNavTrigger } from '@/components/admin/layout/mobile-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme } = useTheme();
  const { pageTitle } = useActiveRoute();
  const collapsed = useLayoutStore((state) => state.sidebarCollapsed);
  const toggleCollapsed = useLayoutStore((state) => state.toggleSidebarCollapsed);

  const handleLogout = async () => {
    await authApi.logout();
    notifySuccess('You have been logged out.');
    router.replace('/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }
    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
  };

  const userInitial = (user?.fullName ?? user?.email ?? 'U')[0].toUpperCase();
  const userName = user?.fullName ?? user?.email ?? 'User';
  const userEmail = user?.email ?? '';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-16 shrink-0',
        'flex items-center justify-between gap-4 px-4 sm:px-6',
        'border-b border-border bg-background/80 backdrop-blur-md',
        'transition-all duration-300',
      )}
      role='banner'
    >
      {/* ── Left: Sidebar toggle (desktop) + Mobile trigger + Page title ── */}
      <div className='flex items-center gap-1'>
        {/* Mobile hamburger — only visible on mobile */}
        <MobileNavTrigger />

        {/* Sidebar collapse toggle — only visible on desktop */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleCollapsed}
              className='hidden md:inline-flex rounded-xl text-muted-foreground hover:text-foreground'
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className='size-[18px]' />
              ) : (
                <PanelLeftClose className='size-[18px]' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className='hidden md:block mx-1 h-5 w-px bg-border' aria-hidden='true' />

        {/* Page title */}
        <h1 className='text-lg font-heading font-semibold text-foreground leading-none ml-1'>
          {pageTitle}
        </h1>
      </div>

      {/* ── Right: Actions ── */}
      <div className='flex items-center gap-1.5'>
        {/* Theme toggle */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleTheme}
              className='rounded-xl text-muted-foreground hover:text-foreground'
              aria-label='Toggle color theme'
            >
              <Sun className='size-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
              <Moon className='absolute size-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='rounded-xl text-muted-foreground hover:text-foreground relative'
              aria-label='View notifications'
            >
              <Bell className='size-4.5' />
              {/* Notification dot — replace with real count */}
              <span
                className='absolute top-2 right-2 size-1.5 rounded-full bg-primary'
                aria-hidden='true'
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className='mx-1.5 h-6 w-px bg-border' aria-hidden='true' />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-2 py-1.5',
                'text-sm font-medium text-foreground',
                'border border-transparent hover:border-border hover:bg-accent',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
              aria-label='Open user menu'
            >
              <div
                className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20'
                aria-hidden='true'
              >
                {userInitial}
              </div>
              <div className='hidden sm:flex flex-col text-left'>
                <span className='text-sm font-medium leading-none truncate max-w-[120px]'>
                  {userName}
                </span>
              </div>
              <ChevronDown className='hidden sm:block size-3.5 text-muted-foreground shrink-0' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56' sideOffset={8}>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col gap-0.5'>
                <span className='text-sm font-semibold'>{userName}</span>
                <span className='text-xs text-muted-foreground truncate'>{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href='/profile' className='cursor-pointer'>
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/settings' className='cursor-pointer'>
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-destructive focus:text-destructive cursor-pointer'
              onClick={() => void handleLogout()}
            >
              <LogOut className='mr-2 size-4' />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
