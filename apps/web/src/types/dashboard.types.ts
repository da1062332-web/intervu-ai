export interface StatCardData {
  label: string;
  value: string | number;
  /** Optional previous value to compute trend */
  previousValue?: string | number;
  /** Explicit trend override */
  trend?: 'up' | 'down' | 'neutral';
  /** Percentage change string, e.g. "+12%" */
  trendLabel?: string;
  color?: 'primary' | 'blue' | 'emerald' | 'amber' | 'rose';
}

export interface DashboardCardProps {
  title: string;
  description: string;
  iconName?: string;
  actionLabel?: string;
  onAction?: () => void;
  color?: 'primary' | 'blue' | 'emerald' | 'amber' | 'rose';
  /** Whether the card is currently loading */
  loading?: boolean;
  children?: React.ReactNode;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** Small variant for inline use */
  compact?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: React.ReactNode;
}

export interface DashboardStats {
  testsTaken: number;
  averageScore: number;
  completionRate: number;
  totalSessions: number;
}

export interface AnalyticsSummary {
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  overallRating: number;
}

export interface RecentActivity {
  id: string;
  type: 'interview' | 'assessment' | 'system' | string;
  title: string;
  description: string;
  timestamp: string;
}
