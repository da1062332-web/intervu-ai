'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { NAV_CONFIG } from '@/config/navigation.config';
import { useLayoutStore } from '@/store/layout.store';
import { useAuthStore } from '@/store/auth.store';
import { useActiveRoute } from '@/hooks/use-active-route';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ─── Mobile Nav Item ──────────────────────────────────────────────────────────

interface MobileNavItemProps {
  label: string;
  route: string;
  icon: React.ElementType;
  badge?: string;
  disabled?: boolean;
  active: boolean;
  onSelect: () => void;
}

function MobileNavItem({
  label,
  route,
  icon: Icon,
  badge,
  disabled,
  active,
  onSelect,
}: MobileNavItemProps) {
  return (
    <Link
      href={disabled ? '#' : route}
      onClick={disabled ? undefined : onSelect}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200',
        active
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <Icon className='size-5 shrink-0' aria-hidden='true' />
      <span className='flex-1'>{label}</span>
      {badge && (
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            active
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary/10 text-primary',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

// ─── Mobile Trigger Button ────────────────────────────────────────────────────

export function MobileNavTrigger() {
  const toggleMobileNav = useLayoutStore((state) => state.toggleMobileNav);

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={toggleMobileNav}
      className='md:hidden rounded-xl'
      aria-label='Open navigation menu'
    >
      <Menu className='size-5' />
    </Button>
  );
}

// ─── Mobile Navigation Drawer ─────────────────────────────────────────────────

export function MobileNav() {
  const mobileNavOpen = useLayoutStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useLayoutStore((state) => state.setMobileNavOpen);
  const user = useAuthStore((state) => state.user);
  const { isActive, pathname } = useActiveRoute();

  // Close drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  const userInitial = (user?.fullName ?? user?.email ?? 'U')[0].toUpperCase();
  const userName = user?.fullName ?? user?.email ?? 'User';
  const userEmail = user?.email ?? '';

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent
        side='left'
        className='w-[300px] p-0 flex flex-col gap-0'
        aria-label='Mobile navigation'
      >
        {/* ── Header ── */}
        <SheetHeader className='h-16 flex-row items-center border-b border-border px-5'>
          <SheetTitle asChild>
            <Link
              href='/admin/dashboard'
              className='flex items-center gap-2.5'
              onClick={() => setMobileNavOpen(false)}
            >
              <Logo className='size-8 shrink-0' />
              <span className='font-heading font-bold text-lg tracking-tight'>InterVu AI</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* ── Nav Body ── */}
        <div className='flex-1 overflow-y-auto py-4 px-3'>
          <nav className='space-y-6' aria-label='Mobile navigation'>
            {NAV_CONFIG.primary.map((group) => (
              <div key={group.heading} className='space-y-1'>
                <p className='mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70'>
                  {group.heading}
                </p>
                {group.items.map((item) => (
                  <MobileNavItem
                    key={item.route}
                    label={item.label}
                    route={item.route}
                    icon={item.icon}
                    badge={item.badge}
                    disabled={item.disabled}
                    active={isActive(item.route)}
                    onSelect={() => setMobileNavOpen(false)}
                  />
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* ── Bottom Section ── */}
        <div className='shrink-0 border-t border-border px-3 py-3 space-y-1'>
          {NAV_CONFIG.secondary.map((item) => (
            <MobileNavItem
              key={item.route}
              label={item.label}
              route={item.route}
              icon={item.icon}
              badge={item.badge}
              disabled={item.disabled}
              active={isActive(item.route)}
              onSelect={() => setMobileNavOpen(false)}
            />
          ))}

          {/* User info */}
          <div className='mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20'>
              {userInitial}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold text-foreground'>{userName}</p>
              <p className='mt-0.5 truncate text-xs text-muted-foreground'>{userEmail}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
