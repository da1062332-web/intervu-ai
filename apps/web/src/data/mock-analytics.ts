export interface StatData {
  title: string;
  value: number | string;
  trend: string;
}

export interface ActivityData {
  id: string;
  type: 'interview' | 'assessment' | 'system';
  title: string;
  description: string;
  timestamp: string;
}

export interface PerformanceData {
  category: string;
  score: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export const mockOverviewStats: StatData[] = [
  { title: 'Tests Taken', value: 1245, trend: '+12%' },
  { title: 'Average Score', value: '78%', trend: '+5%' },
  { title: 'Pass Rate', value: '64%', trend: '-2%' },
  { title: 'Active Candidates', value: 342, trend: '+18%' },
];

export const mockRecentActivity: ActivityData[] = [
  {
    id: '1',
    type: 'interview',
    title: 'Technical Interview Completed',
    description: 'John Doe completed the Senior Frontend Developer interview.',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'assessment',
    title: 'New Assessment Created',
    description: 'Backend Engineering Q3 assessment has been published.',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    type: 'system',
    title: 'Weekly Report Generated',
    description: 'Your weekly performance report is ready.',
    timestamp: '1 day ago',
  },
];

export const mockPerformanceMetrics: PerformanceData[] = [
  { category: 'React & Next.js', score: 85 },
  { category: 'TypeScript', score: 72 },
  { category: 'System Design', score: 68 },
  { category: 'Algorithms', score: 90 },
];

export const mockTrendData: ChartData[] = [
  { name: 'Mon', value: 120 },
  { name: 'Tue', value: 150 },
  { name: 'Wed', value: 180 },
  { name: 'Thu', value: 160 },
  { name: 'Fri', value: 210 },
  { name: 'Sat', value: 90 },
  { name: 'Sun', value: 110 },
];
