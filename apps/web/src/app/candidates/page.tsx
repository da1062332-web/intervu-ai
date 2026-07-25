import { redirect } from 'next/navigation';

export default function CandidatesRedirectPage() {
  redirect('/admin/candidates');
}
