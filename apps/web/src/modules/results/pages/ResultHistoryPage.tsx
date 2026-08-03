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

  const items: any[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray((data as any)?.results)
          ? (data as any).results
          : [];

  const totalPages = (data as any)?.meta?.totalPages || (data as any)?.totalPages || Math.max(1, Math.ceil(items.length / 10));

  if (isError || !data || items.length === 0) {
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
    if (!items || items.length === 0) return [];
    let result = [...items];

    if (searchQuery) {
      result = result.filter((r) =>
        (r.assessmentName || r.testName || 'Assessment').toLowerCase().includes(searchQuery.toLowerCase()),
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
        return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime();
      if (sortBy === 'date-asc')
        return new Date(a.createdAt || Date.now()).getTime() - new Date(b.createdAt || Date.now()).getTime();
      if (sortBy === 'score-desc') return (b.score || b.percentage || 0) - (a.score || a.percentage || 0);
      if (sortBy === 'score-asc') return (a.score || a.percentage || 0) - (b.score || b.percentage || 0);
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

      {/* Filter & Search Bar */}
      <Card className='rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xs p-4'>
        <CardContent className='p-0 flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='relative w-full md:w-80'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              type='text'
              placeholder='Search by test name...'
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className='pl-9 rounded-xl border-border/60 bg-background text-sm font-medium focus:ring-1 focus:ring-primary'
            />
          </div>

          <div className='flex flex-wrap items-center gap-3 w-full md:w-auto justify-end'>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className='h-10 px-3 py-1.5 rounded-xl border border-border/60 bg-background text-foreground text-xs font-semibold focus:ring-1 focus:ring-primary cursor-pointer'
            >
              <option value='ALL'>All Statuses</option>
              <option value='COMPLETED'>Completed</option>
              <option value='QUALIFIED'>Qualified</option>
              <option value='NOT_QUALIFIED'>Not Qualified</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className='h-10 px-3 py-1.5 rounded-xl border border-border/60 bg-background text-foreground text-xs font-semibold focus:ring-1 focus:ring-primary cursor-pointer'
            >
              <option value='date-desc'>Newest First</option>
              <option value='date-asc'>Oldest First</option>
              <option value='score-desc'>Highest Score</option>
              <option value='score-asc'>Lowest Score</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className='space-y-4'>
        {filteredData.length === 0 ? (
          <Card className='rounded-2xl border-border/60 bg-card text-card-foreground p-8 text-center shadow-2xs'>
            <CardContent className='p-0 flex flex-col items-center justify-center space-y-3'>
              <FileText className='w-10 h-10 text-muted-foreground opacity-50' />
              <h4 className='font-bold text-foreground text-base'>No matching results found</h4>
              <p className='text-xs text-muted-foreground max-w-sm'>
                Try adjusting your search query or filter selection to find your past assessment attempts.
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={handleResetFilters}
                className='rounded-xl font-bold text-xs mt-2 border-border/60'
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((result: any, idx: number) => {
            const perc = Math.round(result.percentage || result.score || 0);
            const isQual = result.qualification && result.qualification !== 'NOT_QUALIFIED';

            return (
              <Card
                key={result.id || result.attemptId || idx}
                onClick={() => navigate(`/candidate/results/${result.attemptId || result.id}`)}
                className='rounded-2xl border-border/60 bg-card text-card-foreground p-5 shadow-2xs hover:shadow-xs hover:border-primary/50 transition-all cursor-pointer group'
              >
                <CardContent className='p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                  <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform'>
                      {perc}%
                    </div>
                    <div>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <h3 className='font-bold text-foreground text-base group-hover:text-primary transition-colors'>
                          {result.assessmentName || result.testName || result.examName || 'Corporate Assessment'}
                        </h3>
                        {result.qualification && (
                          <Badge
                            className={`text-[10px] uppercase font-bold tracking-wider rounded-lg px-2 py-0.5 ${
                              isQual
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}
                          >
                            {result.qualification.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className='flex items-center gap-4 text-xs text-muted-foreground font-medium mt-1.5 flex-wrap'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='w-3.5 h-3.5 text-muted-foreground' />
                          {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className='flex items-center gap-1'>
                          <TrendingUp className='w-3.5 h-3.5 text-muted-foreground' />
                          Score: {result.score || 0}
                        </span>
                        {result.attemptId && (
                          <span className='opacity-70 font-mono text-[11px]'>
                            ID: {result.attemptId.slice(0, 8).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 self-end sm:self-center shrink-0'>
                    <Button
                      size='sm'
                      className='rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs px-4 py-2 flex items-center gap-1.5 transition-all z-10 relative'
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/candidate/results/${result.attemptId || result.id}`);
                      }}
                    >
                      View Result
                      <ChevronRight className='w-4 h-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between border-t border-border/60 pt-6 mt-8'>
          <div className='text-sm text-muted-foreground font-medium'>
            Showing page <span className='text-foreground font-semibold'>{page}</span> of{' '}
            <span className='text-foreground font-semibold'>{totalPages}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className='h-9 font-semibold rounded-xl'
            >
              <ChevronLeft className='size-4 mr-1' />
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className='h-9 font-semibold rounded-xl'
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
