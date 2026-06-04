import type { LucideIcon } from 'lucide-react';

// ─── Single Nav Item ─────────────────────────────────────────────────────────

export interface NavItem {
  /** Display label */
  label: string;
  /** Next.js route path */
  route: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Optional badge text (e.g. "New", "3") */
  badge?: string;
  /** Disable the item */
  disabled?: boolean;
  /** External link (opens in new tab) */
  external?: boolean;
}

// ─── Nav Group ───────────────────────────────────────────────────────────────

export interface NavGroup {
  /** Section heading (e.g. "Overview", "Account") */
  heading: string;
  /** Items within this group */
  items: NavItem[];
}

// ─── Full Navigation Config ───────────────────────────────────────────────────

export interface NavConfig {
  /** Primary nav groups shown in the sidebar body */
  primary: NavGroup[];
  /** Bottom/secondary items (e.g. Settings) */
  secondary: NavItem[];
}
