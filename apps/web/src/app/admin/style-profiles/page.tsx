import { Metadata } from 'next';
import { StyleProfileTable } from '@/features/style-profiles/components/StyleProfileTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Style Profiles | Admin',
  description: 'Manage question generation style profiles and formatting constraints',
};

export default function StyleProfilesPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Style Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Define reusable style profiles that act as hard constraints during AI generation.
          </p>
        </div>
        <Button asChild className="shadow-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 gap-2">
          <Link href="/admin/style-profiles/new">
            <Plus className="h-4 w-4" /> Create Profile
          </Link>
        </Button>
      </div>

      <StyleProfileTable />
    </div>
  );
}
