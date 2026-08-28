import { Metadata } from 'next';
import { CandidateHistoryPage } from '@/modules/candidate/pages/CandidateHistoryPage';

export const metadata: Metadata = {
  title: 'Assessment History | SkillitriX',
  description: 'View your previous assessment results and progress.',
};

export default function HistoryRoute() {
  return <CandidateHistoryPage />;
}
