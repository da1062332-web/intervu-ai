import { Metadata } from 'next';
import { ProgressDashboard } from '@/modules/candidate/pages/ProgressDashboard';

export const metadata: Metadata = {
  title: 'Progress Dashboard | SkillitriX',
  description: 'Track your skill development and assessment progress.',
};

export default function ProgressRoute() {
  return <ProgressDashboard />;
}
