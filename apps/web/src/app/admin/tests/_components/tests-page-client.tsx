'use client';

import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

/**
 * Client-only interactive shell for the Tests page.
 * Extracted so that the parent page.tsx can remain a Server Component
 * and export `metadata` for SEO.
 */
export function TestsPageClient() {
  return (
    <div className='space-y-6'>
      {/* Toolbar */}
      <div className='flex items-center gap-2 justify-end'>
        <Button variant='outline' size='sm' className='gap-2' id='filter-tests-btn'>
          <Filter className='size-4' />
          Filter
        </Button>
        <Button asChild size='sm' className='gap-2' id='new-test-btn'>
          <Link href='/tests/new'>
            <Plus className='size-4' />
            New Test
          </Link>
        </Button>
      </div>

      {/* Search bar */}
      <div className='relative'>
        <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
        <input
          type='search'
          placeholder='Search tests…'
          className='h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow'
          id='tests-search'
          aria-label='Search tests'
        />
      </div>

      {/* Empty state */}
      <div className='rounded-2xl border border-dashed border-border bg-muted/20 min-h-[400px] flex items-center justify-center'>
        <EmptyState
          title='No tests created yet'
          description='Create your first AI-powered interview assessment to start evaluating candidates.'
          actionLabel='Create your first test'
          actionHref='/tests/new'
        />
      </div>
    </div>
  );
}
