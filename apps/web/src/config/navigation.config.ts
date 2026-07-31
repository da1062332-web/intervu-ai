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
  MessageSquare,
  Database,
  Archive,
  Download,
  LineChart,
  Sparkles,
  GitBranch,
  Users,
  Activity,
} from 'lucide-react';

import type { NavConfig } from '@/types/navigation.types';

export const ADMIN_NAV_CONFIG: NavConfig = {
  primary: [
    {
      heading: 'Overview',
      items: [
        { label: 'Dashboard', route: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Activity Feed', route: '/admin/activities', icon: Activity },
        { label: 'Analytics', route: '/admin/analytics/generation', icon: TrendingUp },
        { label: 'Reports', route: '/admin/reports/candidates', icon: FileText },
      ],
    },
    {
      heading: 'Configuration',
      items: [
        { label: 'Configs', route: '/admin/configurations', icon: FileCog },
        { label: 'Style Profiles', route: '/admin/style-profiles', icon: Settings },
        { label: 'Validation Rules', route: '/admin/system-validation', icon: ShieldCheck },
      ],
    },
    {
      heading: 'Content Creation',
      items: [
        { label: 'Topics', route: '/admin/topics', icon: BookOpen },
        { label: 'Templates', route: '/admin/templates', icon: FileText },
        { label: 'Manual Questions', route: '/admin/manual-questions', icon: FileText },
        { label: 'Datasets', route: '/admin/datasets', icon: Database },
      ],
    },
    {
      heading: 'Assessment Builder',
      items: [
        { label: 'Recent Assessments', route: '/admin/assessments', icon: Briefcase },
        { label: 'Assessment Generator', route: '/admin/assessment-builder', icon: FileCog },
        { label: 'Blueprints', route: '/admin/blueprints', icon: Layers },
        { label: 'Test Assembly', route: '/admin/assembly', icon: ClipboardList },
      ],
    },
    {
      heading: 'Question Generation',
      items: [
        { label: 'Question Generator', route: '/admin/question-generation', icon: Sparkles },
        { label: 'Question Bank', route: '/admin/question-bank', icon: Database },
        { label: 'Generation Failures', route: '/admin/generation/failures', icon: Archive },
      ],
    },
    {
      heading: 'Execution & Review',
      items: [
        { label: 'Recent Test Attempts', route: '/admin/results', icon: BarChart3 },
        { label: 'Assembly Monitor', route: '/admin/assembly/monitoring', icon: ShieldCheck },
        { label: 'Review Queue', route: '/admin/review', icon: MessageSquare },
        { label: 'Candidates', route: '/admin/candidates', icon: Users },
      ],
    },
    {
      heading: 'Account',
      items: [
        { label: 'Profile', route: '/admin/profile', icon: User },
        { label: 'Settings', route: '/admin/settings', icon: Settings },
      ],
    },
  ],
  secondary: [],
};

export const CANDIDATE_NAV_CONFIG: NavConfig = {
  primary: [
    {
      heading: 'Candidate',
      items: [
        { label: 'Dashboard', route: '/candidate/dashboard', icon: LayoutDashboard },
        { label: 'Assessments', route: '/candidate/tests', icon: Briefcase },
        { label: 'Results', route: '/candidate/results', icon: BarChart3 },
        { label: 'Progress', route: '/candidate/progress', icon: LineChart },
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
  const exactMatch = ALL_NAV_ITEMS.find((item) => pathname === item.route);
  if (exactMatch) return exactMatch;

  return ALL_NAV_ITEMS.find(
    (item) =>
      item.route !== '/admin/dashboard' &&
      item.route !== '/candidate/dashboard' &&
      pathname.startsWith(item.route),
  );
}

export function getPageTitle(pathname: string): string {
  const item = getActiveNavItem(pathname);
  return item?.label ?? 'Dashboard';
}
