'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, Bell } from 'lucide-react';

import { authApi } from '@/services/api/auth.api';
import { notifySuccess } from '@/services/notifications/toast';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await authApi.logout();
    notifySuccess('You have been logged out.');
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300">
      <div className="flex items-center">
        <h2 className="text-xl font-heading font-semibold hidden md:block">Welcome back</h2>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            if (!document.startViewTransition) {
              setTheme(nextTheme);
              return;
            }
            document.startViewTransition(() => {
              setTheme(nextTheme);
            });
          }}
          className="rounded-full"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="h-8 w-px bg-border mx-1"></div>

        <div className="flex items-center gap-3 pl-1">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-medium leading-none">{user?.fullName || 'User'}</span>
            <span className="text-xs text-muted-foreground mt-1">{user?.email || 'user@example.com'}</span>
          </div>
          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
            {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void handleLogout()}
            className="text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
