import { Metadata } from 'next';
import { CandidateReportPage } from '@/modules/candidate/pages/CandidateReportPage';

export const metadata: Metadata = {
  title: 'Assessment Report | Intervu',
  description: 'View your detailed assessment report.',
};

export default async function ReportRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CandidateReportPage attemptId={resolvedParams.id} />;
}
