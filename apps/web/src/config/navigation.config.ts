import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  TrendingUp,
  User,
  Settings,
} from 'lucide-react';

import type { NavConfig } from '@/types/navigation.types';

/**
 * Central navigation configuration for the InterVu AI dashboard.
 * Single source of truth for routes, labels, and icons.
 */
export const NAV_CONFIG: NavConfig = {
  primary: [
    {
      heading: 'Overview',
      items: [
        {
          label: 'Dashboard',
          route: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Tests',
          route: '/tests',
          icon: ClipboardList,
        },
        {
          label: 'Results',
          route: '/results',
          icon: BarChart3,
        },
        {
          label: 'Analytics',
          route: '/analytics',
          icon: TrendingUp,
        },
      ],
    },
    {
      heading: 'Account',
      items: [
        {
          label: 'Profile',
          route: '/profile',
          icon: User,
        },
      ],
    },
  ],
  secondary: [
    {
      label: 'Settings',
      route: '/settings',
      icon: Settings,
    },
  ],
};

/**
 * Flat list of all routes for easy route-matching lookups.
 */
export const ALL_NAV_ITEMS = [
  ...NAV_CONFIG.primary.flatMap((g) => g.items),
  ...NAV_CONFIG.secondary,
];

/**
 * Find the nav item that matches a given pathname.
 */
export function getActiveNavItem(pathname: string) {
  return ALL_NAV_ITEMS.find(
    (item) =>
      pathname === item.route ||
      (item.route !== '/dashboard' && pathname.startsWith(item.route))
  );
}

/**
 * Get the page title for a given pathname.
 */
export function getPageTitle(pathname: string): string {
  const item = getActiveNavItem(pathname);
  return item?.label ?? 'Dashboard';
}
