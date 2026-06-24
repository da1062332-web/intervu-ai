import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  TrendingUp,
  User,
  Settings,
  FileCog,
  Briefcase,
  PlayCircle,
  Layers,
  BookOpen,
  ShieldCheck,
  FileText,
} from 'lucide-react';

import type { NavConfig } from '@/types/navigation.types';

export const ADMIN_NAV_CONFIG: NavConfig = {
  primary: [
    {
      heading: 'Overview',
      items: [
        { label: 'Dashboard', route: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Configs', route: '/admin/configs', icon: FileCog },
        { label: 'Topics', route: '/admin/topics', icon: BookOpen },
        { label: 'Templates', route: '/admin/templates', icon: FileText },
        { label: 'Blueprints', route: '/admin/blueprints', icon: Layers },
        { label: 'Validation', route: '/admin/system-validation', icon: ShieldCheck },
        { label: 'Assembly', route: '/admin/assembly', icon: ClipboardList },
        { label: 'Results', route: '/admin/results', icon: BarChart3 },
        { label: 'Analytics', route: '/admin/analytics', icon: TrendingUp },
      ],
    },

    {
      heading: 'Account',
      items: [{ label: 'Profile', route: '/admin/profile', icon: User }],
    },
  ],
  secondary: [{ label: 'Settings', route: '/admin/settings', icon: Settings }],
};

export const CANDIDATE_NAV_CONFIG: NavConfig = {
  primary: [
    {
      heading: 'Candidate',
      items: [
        { label: 'Dashboard', route: '/candidate/dashboard', icon: LayoutDashboard },
        { label: 'Assessments', route: '/candidate/tests', icon: Briefcase },
        { label: 'Interviews', route: '/candidate/interviews', icon: PlayCircle },
        { label: 'Results', route: '/candidate/results', icon: BarChart3 },
      ],
    },
    {
      heading: 'Account',
      items: [{ label: 'Profile', route: '/candidate/profile', icon: User }],
    },
  ],
  secondary: [{ label: 'Settings', route: '/candidate/settings', icon: Settings }],
};

export const NAV_CONFIG = ADMIN_NAV_CONFIG; // For backwards compatibility if any other place imports it

export const ALL_NAV_ITEMS = [
  ...ADMIN_NAV_CONFIG.primary.flatMap((g) => g.items),
  ...ADMIN_NAV_CONFIG.secondary,
  ...CANDIDATE_NAV_CONFIG.primary.flatMap((g) => g.items),
  ...CANDIDATE_NAV_CONFIG.secondary,
];

export function getActiveNavItem(pathname: string) {
  return ALL_NAV_ITEMS.find(
    (item) =>
      pathname === item.route ||
      (item.route !== '/admin/dashboard' &&
        item.route !== '/candidate/dashboard' &&
        pathname.startsWith(item.route)),
  );
}

export function getPageTitle(pathname: string): string {
  const item = getActiveNavItem(pathname);
  return item?.label ?? 'Dashboard';
}
