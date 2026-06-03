export interface StatCardData {
  title: string;
  value: string | number;
  trend: string;
  color?: 'primary' | 'blue' | 'emerald' | 'amber' | 'rose';
  iconName?: string;
}

export interface ActivityFeedItem {
  id: string;
  candidateName: string;
  assessmentName: string;
  score?: number;
  status: 'passed' | 'failed' | 'in_progress';
  timestamp: string;
}

export interface CategoryPerformance {
  category: string;
  score: number; // 0 to 100
  passRate: number; // 0 to 100
  candidatesCount: number;
  color: string;
}

export interface TrendDataPoint {
  label: string;
  value: number;
}

export const MOCK_STATS_DATA: StatCardData[] = [
  {
    title: 'Tests Taken',
    value: 1248,
    trend: '+12.5%',
    color: 'primary',
    iconName: 'ClipboardList',
  },
  {
    title: 'Pass Rate',
    value: '72.8%',
    trend: '+4.3%',
    color: 'emerald',
    iconName: 'TrendingUp',
  },
  {
    title: 'Avg. Score',
    value: '78.5%',
    trend: '+1.2%',
    color: 'blue',
    iconName: 'Award',
  },
  {
    title: 'Avg. Duration',
    value: '42 mins',
    trend: '-3.5%',
    color: 'amber',
    iconName: 'Clock',
  },
];

export const MOCK_ACTIVITY_FEED: ActivityFeedItem[] = [
  {
    id: 'act-1',
    candidateName: 'Sarah Connor',
    assessmentName: 'Senior Frontend React Assessment',
    score: 94,
    status: 'passed',
    timestamp: '20 mins ago',
  },
  {
    id: 'act-2',
    candidateName: 'Thomas Anderson',
    assessmentName: 'Middle Node.js Backend Assessment',
    score: 58,
    status: 'failed',
    timestamp: '1 hour ago',
  },
  {
    id: 'act-3',
    candidateName: 'Bruce Wayne',
    assessmentName: 'System Design & Architecture Assessment',
    status: 'in_progress',
    timestamp: '2 hours ago',
  },
  {
    id: 'act-4',
    candidateName: 'Clark Kent',
    assessmentName: 'Lead DevOps & Infrastructure Assessment',
    score: 89,
    status: 'passed',
    timestamp: '4 hours ago',
  },
  {
    id: 'act-5',
    candidateName: 'Diana Prince',
    assessmentName: 'Full-Stack NestJS/Next.js Assessment',
    score: 97,
    status: 'passed',
    timestamp: '1 day ago',
  },
  {
    id: 'act-6',
    candidateName: 'Barry Allen',
    assessmentName: 'Junior Frontend Assessment',
    score: 72,
    status: 'passed',
    timestamp: '1 day ago',
  },
  {
    id: 'act-7',
    candidateName: 'Arthur Curry',
    assessmentName: 'Database Engineer Assessment',
    score: 61,
    status: 'failed',
    timestamp: '2 days ago',
  },
];

export const MOCK_CATEGORY_PERFORMANCE: CategoryPerformance[] = [
  {
    category: 'Frontend Engineering',
    score: 82,
    passRate: 78,
    candidatesCount: 542,
    color: 'indigo',
  },
  {
    category: 'Backend Systems',
    score: 75,
    passRate: 70,
    candidatesCount: 412,
    color: 'emerald',
  },
  {
    category: 'System Design',
    score: 68,
    passRate: 64,
    candidatesCount: 198,
    color: 'blue',
  },
  {
    category: 'DevOps & Cloud',
    score: 71,
    passRate: 67,
    candidatesCount: 96,
    color: 'amber',
  },
];

export const MOCK_TRENDS_7D: TrendDataPoint[] = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 58 },
  { label: 'Wed', value: 48 },
  { label: 'Thu', value: 72 },
  { label: 'Fri', value: 68 },
  { label: 'Sat', value: 24 },
  { label: 'Sun', value: 31 },
];

export const MOCK_TRENDS_30D: TrendDataPoint[] = [
  { label: 'Wk 1', value: 210 },
  { label: 'Wk 2', value: 245 },
  { label: 'Wk 3', value: 290 },
  { label: 'Wk 4', value: 320 },
];
