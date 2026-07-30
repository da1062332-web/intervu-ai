'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCandidateResults } from '../hooks/results.hooks';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, TrendingUp, Search, ChevronRight, ChevronLeft, Award } from 'lucide-react';

export const ResultHistoryPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const navigate = router.push;
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, isError } = useCandidateResults(user?.id || '', page, 10);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (page !== 1) setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    if (page !== 1) setPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    if (page !== 1) setPage(1);
  };

  if (isLoading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'>
        <SectionHeader
          title='Assessment History'
          description='View and track all your completed assessment results, attempt history, and scores.'
          breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Results & History' }]}
        />
        <Skeleton className='h-20 w-full rounded-xl border border-border/60' />
        <div className='space-y-4 pt-2'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className='h-28 w-full rounded-xl border border-border/60' />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data || data.data.length === 0) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'>
        <SectionHeader
          title='Assessment History'
          description='View and track all your completed assessment results, attempt history, and scores.'
          breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Results & History' }]}
        />
        <EmptyState
          title='No Results Found'
          description="You haven't completed any assessments yet. Visit the Assessment Catalog to start practicing!"
          actionLabel='Browse Assessments'
          actionHref='/candidate/tests'
        />
      </div>
    );
  }

  const filteredData = (() => {
    if (!data?.data) return [];
    let result = [...data.data];

    if (searchQuery) {
      result = result.filter((r) =>
        r.assessmentName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((r) => {
        const s = (r as any).status || 'COMPLETED';
        return s === statusFilter;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'date-desc')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'date-asc')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'score-desc') return b.score - a.score;
      if (sortBy === 'score-asc') return a.score - b.score;
      return 0;
    });

    return result;
  })();

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSortBy('date-desc');
    setPage(1);
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'>
      <SectionHeader
        title='Assessment History'
        description='View and track all your completed assessment results, attempt history, and scores.'
        breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Results & History' }]}
      />

      {/* Modern Filter Toolbar */}
      <Card className='bg-card/80 border border-border/60 shadow-xs'>
        <CardContent className='p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5'>
          <div className='relative flex-1 min-w-[240px] max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70' />
            <Input
              placeholder='Search by assessment name...'
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className='pl-9 h-9 bg-background/60 border-border/60 focus-visible:bg-background text-xs sm:text-sm transition-all'
            />
          </div>

          <div className='flex items-center gap-2 flex-wrap'>
            <select
              className='h-9 rounded-md border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all'
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label='Filter by status'
            >
              <option value='ALL'>All Statuses</option>
              <option value='COMPLETED'>Completed Only</option>
              <option value='FAILED'>Unsuccessful Attempt</option>
            </select>

            <select
              className='h-9 rounded-md border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all'
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label='Sort results'
            >
              <option value='date-desc'>Newest First</option>
              <option value='date-asc'>Oldest First</option>
              <option value='score-desc'>Highest Score</option>
              <option value='score-asc'>Lowest Score</option>
            </select>

            <Badge variant='secondary' className='text-xs font-semibold px-3 py-1 h-9 flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 shrink-0'>
              {filteredData.length} {filteredData.length === 1 ? 'result' : 'results'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className='space-y-3.5'>
        {filteredData.length === 0 ? (
          <EmptyState
            title='No matching results'
            description='We could not find any results matching your current search or status filter.'
            actionLabel='Reset Filters'
            onAction={handleResetFilters}
          />
        ) : (
          filteredData.map((result) => {
            const statusText = (result as any).status || 'COMPLETED';
            const isHigh = result.percentage >= 70;
            const isMid = result.percentage >= 40 && result.percentage < 70;

            return (
              <Card key={result.id} className='hover:bg-card/90 transition-all duration-200 border border-border/60 group shadow-xs'>
                <CardContent className='p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                  <div className='flex items-start sm:items-center gap-4 flex-1'>
                    <div className='bg-primary/10 text-primary p-3 rounded-xl shrink-0 hidden sm:flex items-center justify-center border border-primary/20'>
                      <FileText className='size-5' />
                    </div>
                    <div className='space-y-1.5'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <h3 className='font-bold text-base md:text-lg text-foreground group-hover:text-primary transition-colors'>
                          {result.assessmentName}
                        </h3>
                        <Badge variant='outline' className='text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 border-border/60'>
                          {statusText}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-4 text-xs font-semibold text-muted-foreground'>
                        <div className='flex items-center gap-1.5'>
                          <Calendar className='size-3.5 text-primary/80' />
                          <span>{new Date(result.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <TrendingUp className='size-3.5 text-emerald-500' />
                          <span>Score: {Math.round(result.score)}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t border-border/40 sm:border-0'>
                    <div className='flex flex-col items-end'>
                      <span className='text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider'>
                        Percentage
                      </span>
                      <Badge
                        variant='outline'
                        className={`text-sm font-extrabold px-3 py-1 mt-0.5 ${
                          isHigh
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : isMid
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {result.percentage}%
                      </Badge>
                    </div>

                    <Button
                      size='sm'
                      className='text-xs font-semibold transition-transform group-hover:translate-x-0.5'
                      onClick={() => navigate(`/candidate/results/${result.attemptId}`)}
                    >
                      View Report
                      <ChevronRight className='ml-1 size-3.5' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {data.meta.totalPages > 1 && (
        <div className='flex items-center justify-between border-t border-border/60 pt-6 mt-8'>
          <div className='text-sm text-muted-foreground font-medium'>
            Showing page <span className='text-foreground font-semibold'>{page}</span> of{' '}
            <span className='text-foreground font-semibold'>{data.meta.totalPages}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className='h-9 font-semibold'
            >
              <ChevronLeft className='size-4 mr-1' />
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={page === data.meta.totalPages}
              onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
              className='h-9 font-semibold'
            >
              Next
              <ChevronRight className='size-4 ml-1' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
