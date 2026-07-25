import { redirect } from 'next/navigation';

export default function CandidateDetailRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/admin/candidates/${params.id}`);
}
