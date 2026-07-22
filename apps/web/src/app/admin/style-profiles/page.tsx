import { Metadata } from 'next';
import { StyleProfileTable } from '@/features/style-profiles/components/StyleProfileTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/dashboard/page-header';

export const metadata: Metadata = {
  title: 'Style Profiles | Admin',
  description: 'Manage question generation style profiles and formatting constraints',
};

export default function StyleProfilesPage() {
  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Style Profiles"
        subtitle="Define reusable style profiles that act as hard constraints during AI generation."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Style Profiles' }]}
        action={
          <Button asChild className="shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 gap-2 shrink-0">
            <Link href="/admin/style-profiles/new">
              <Plus className="h-4 w-4" /> Create Profile
            </Link>
          </Button>
        }
      />

      <StyleProfileTable />
    </div>
  );
}
