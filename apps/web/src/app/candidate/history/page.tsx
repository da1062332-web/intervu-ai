import { Metadata } from 'next';
import { CandidateHistoryPage } from '@/modules/candidate/pages/CandidateHistoryPage';

export const metadata: Metadata = {
  title: 'Assessment History | Intervu',
  description: 'View your previous assessment results and progress.',
};

export default function HistoryRoute() {
  return <CandidateHistoryPage />;
}
