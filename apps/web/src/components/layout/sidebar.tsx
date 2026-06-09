'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

import { NAV_CONFIG } from '@/config/navigation.config';
import { useLayoutStore } from '@/store/layout.store';
import { useAuthStore } from '@/store/auth.store';
import { useActiveRoute } from '@/hooks/use-active-route';
import { Logo } from '@/components/ui/logo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Sidebar Nav Item ──────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  label: string;
  route: string;
  icon: React.ElementType;
  badge?: string;
  disabled?: boolean;
  collapsed: boolean;
  isActive: (route: string) => boolean;
}

function SidebarNavItem({
  label,
  route,
  icon: Icon,
  badge,
  disabled,
  collapsed,
  isActive,
}: SidebarNavItemProps) {
  const active = isActive(route);

  const itemContent = (
    <Link
      href={disabled ? '#' : route}
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        active
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        disabled && 'pointer-events-none opacity-40',
        collapsed && 'justify-center px-2.5',
      )}
    >
      <Icon
        className={cn(
          'size-[18px] shrink-0 transition-transform duration-200',
          active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
          !collapsed && 'group-hover:scale-110',
        )}
        aria-hidden='true'
      />
      {!collapsed && <span className='truncate leading-none'>{label}</span>}
      {!collapsed && badge && (
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none',
            active
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary/10 text-primary',
          )}
        >
          {badge}
        </span>
      )}
      {/* Active indicator dot */}
      {active && collapsed && (
        <span className='absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary-foreground/60' />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
        <TooltipContent side='right' sideOffset={8} className='font-medium'>
          {label}
          {badge && (
            <span className='ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary'>
              {badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return itemContent;
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

export function Sidebar() {
  const collapsed = useLayoutStore((state) => state.sidebarCollapsed);

  const user = useAuthStore((state) => state.user);
  const { isActive } = useActiveRoute();

  const userInitial = (user?.fullName ?? user?.email ?? 'U')[0].toUpperCase();
  const userName = user?.fullName ?? user?.email ?? 'User';
  const userEmail = user?.email ?? '';

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-card',
        'min-h-screen sticky top-0 h-screen overflow-hidden',
        'transition-[width] duration-300 ease-in-out will-change-[width]',
        collapsed ? 'w-[72px]' : 'w-[240px]',
      )}
      aria-label='Primary navigation'
    >
      {/* ── Logo Header ── */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <Link
          href='/admin/dashboard'
          className='flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-lg'
          aria-label='Go to dashboard'
        >
          <Logo className='size-8 shrink-0' />
          {!collapsed && (
            <span className='font-heading font-bold text-lg tracking-tight truncate'>
              InterVu AI
            </span>
          )}
        </Link>
      </div>

      {/* ── Nav Body ── */}
      <div className='flex-1 overflow-y-auto overflow-x-hidden py-4'>
        <nav className='space-y-6 px-3' aria-label='Sidebar navigation'>
          {NAV_CONFIG.primary.map((group) => (
            <div key={group.heading} className='space-y-1'>
              {!collapsed && (
                <p className='mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70'>
                  {group.heading}
                </p>
              )}
              {collapsed && (
                <div className='mb-2 flex justify-center'>
                  <div className='h-px w-6 bg-border' />
                </div>
              )}
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.route}
                  label={item.label}
                  route={item.route}
                  icon={item.icon}
                  badge={item.badge}
                  disabled={item.disabled}
                  collapsed={collapsed}
                  isActive={isActive}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Bottom Section ── */}
      <div className='shrink-0 border-t border-border p-3 space-y-1'>
        {NAV_CONFIG.secondary.map((item) => (
          <SidebarNavItem
            key={item.route}
            label={item.label}
            route={item.route}
            icon={item.icon}
            badge={item.badge}
            disabled={item.disabled}
            collapsed={collapsed}
            isActive={isActive}
          />
        ))}

        {/* User Profile */}
        {!collapsed ? (
          <div className='mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5'>
            <div
              className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20'
              aria-hidden='true'
            >
              {userInitial}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium leading-none text-foreground'>
                {userName}
              </p>
              <p className='mt-1 truncate text-[11px] leading-none text-muted-foreground'>
                {userEmail}
              </p>
            </div>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className='mt-3 flex justify-center cursor-default'>
                <div className='flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20'>
                  {userInitial}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side='right' sideOffset={8}>
              <p className='font-medium'>{userName}</p>
              <p className='text-xs text-muted-foreground'>{userEmail}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
