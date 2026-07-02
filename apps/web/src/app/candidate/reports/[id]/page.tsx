import { Metadata } from 'next';
import { CandidateReportPage } from '@/modules/candidate/pages/CandidateReportPage';

export const metadata: Metadata = {
  title: 'Assessment Report | Intervu',
  description: 'View your detailed assessment report.',
};

export default function ReportRoute({ params }: { params: { id: string } }) {
  return <CandidateReportPage attemptId={params.id} />;
}
