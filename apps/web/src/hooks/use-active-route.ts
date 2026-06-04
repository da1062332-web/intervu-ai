'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useLayoutStore } from '@/store/layout.store';
import { getActiveNavItem, getPageTitle } from '@/config/navigation.config';

/**
 * Custom hook that tracks the active route and syncs navigation memory.
 *
 * Returns:
 * - `pathname`       – current route
 * - `pageTitle`      – resolved display title for the current route
 * - `activeNavItem`  – the matching nav config item (or undefined)
 * - `isActive(route)` – utility to check if a route is active
 */
export function useActiveRoute() {
  const pathname = usePathname();
  const setLastVisitedRoute = useLayoutStore(
    (state) => state.setLastVisitedRoute
  );

  // Sync navigation memory on every route change
  useEffect(() => {
    setLastVisitedRoute(pathname);
  }, [pathname, setLastVisitedRoute]);

  const activeNavItem = getActiveNavItem(pathname);
  const pageTitle = getPageTitle(pathname);

  const isActive = (route: string): boolean => {
    if (route === '/dashboard') return pathname === route;
    return pathname === route || pathname.startsWith(route + '/');
  };

  const isExactActive = (route: string): boolean => pathname === route;

  return {
    pathname,
    pageTitle,
    activeNavItem,
    isActive,
    isExactActive,
  };
}
