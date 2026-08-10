'use client';

import React, { useState, useMemo } from 'react';
import { useRecentActivities } from '@/modules/admin-analytics/hooks/useRecentActivities';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TimelineSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import {
  Activity,
  FileText,
  Settings,
  User,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function getActivityConfig(type: string) {
  switch (type.toLowerCase()) {
    case 'assessment':
    case 'assessment_started':
    case 'assessment_completed':
      return {
        icon: <FileText className='size-4 text-blue-600 dark:text-blue-400' />,
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'default' as const,
        label: 'Assessment',
      };
    case 'system':
      return {
        icon: <Settings className='size-4 text-amber-600 dark:text-amber-400' />,
        bg: 'bg-amber-50 dark:bg-amber-900/30',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'secondary' as const,
        label: 'System',
      };
    case 'user':
      return {
        icon: <User className='size-4 text-emerald-600 dark:text-emerald-400' />,
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'outline' as const,
        label: 'User',
      };
    default:
      return {
        icon: <Activity className='size-4 text-primary' />,
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        badge: 'secondary' as const,
        label: type || 'General',
      };
  }
}

export default function AdminActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useRecentActivities({
    page,
    limit,
    search: searchQuery,
    type: selectedType,
    sortOrder,
  });

  const filteredActivities = response?.data || [];
  const totalPages = response?.totalPages || 1;
  const totalItems = response?.total || 0;

  return (
    <div className='space-y-6 container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl animate-fade-in-up pb-12'>
      <SectionHeader
        title='Activity Feed'
        description='Monitor platform events, recent candidate test sessions, and system administrative audits.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Activities' }]}
        actions={
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isFetching}
            className='gap-2'
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <Card className='rounded-xl shadow-sm border border-border'>
        <CardHeader className='p-5 border-b bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <CardTitle className='text-base font-semibold text-foreground flex items-center gap-2'>
              <Activity className='size-4 text-primary' />
              System Event Log
            </CardTitle>
            <CardDescription className='text-xs text-muted-foreground mt-1'>
              Showing chronological platform actions and state transformations.
            </CardDescription>
          </div>

          <div className='flex flex-wrap items-center gap-3 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search activities...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className='w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder-muted-foreground'
              />
            </div>

            <div className='flex items-center gap-2 border border-input rounded-lg px-2.5 py-1.5 bg-background'>
              <Filter className='size-3.5 text-muted-foreground' />
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className='bg-transparent text-xs text-foreground focus:outline-none font-medium'
              >
                <option value='all'>All Event Types</option>
                <option value='assessment'>Assessments</option>
                <option value='system'>System</option>
                <option value='user'>User Actions</option>
              </select>
            </div>

            <div className='flex items-center gap-2 border border-input rounded-lg px-2.5 py-1.5 bg-background'>
              <ArrowUpDown className='size-3.5 text-muted-foreground' />
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc');
                  setPage(1);
                }}
                className='bg-transparent text-xs text-foreground focus:outline-none font-medium'
              >
                <option value='desc'>Newest First</option>
                <option value='asc'>Oldest First</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-6'>
          {isLoading ? (
            <div className='py-6'>
              <TimelineSkeleton className='min-h-[400px]' />
            </div>
          ) : isError ? (
            <div className='py-12'>
              <EmptyState
                variant='error'
                title='Failed to load activity stream'
                description='An error occurred while fetching system activities. Please try refreshing.'
                actionLabel='Try Again'
                onAction={refetch}
              />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className='py-12'>
              <EmptyState
                variant='no-data'
                title='No matching activities'
                description='We found no activities corresponding to your active filters or search terms.'
                actionLabel='Reset Filters'
                onAction={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSortOrder('desc');
                  setPage(1);
                }}
              />
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='relative pl-6 sm:pl-8 before:absolute before:inset-y-0 before:left-3 sm:before:left-4 before:w-0.5 before:bg-border/60 space-y-8'>
                {filteredActivities.map((activity, index) => {
                  const config = getActivityConfig(activity.activityType);
                  return (
                    <div key={index} className='relative group flex items-start gap-4'>
                      <span
                        className={cn(
                          'absolute left-[-1.5rem] sm:left-[-1.75rem] top-1 flex size-8 sm:size-9 items-center justify-center rounded-full border shadow-sm transition-transform group-hover:scale-110',
                          config.bg,
                          config.border,
                        )}
                      >
                        {config.icon}
                      </span>

                      <div className='flex-1 bg-card/60 hover:bg-card rounded-xl p-4 border border-border/50 shadow-sm transition-all'>
                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-3'>
                          <div className='flex items-center gap-2.5'>
                            <h4 className='text-sm font-semibold text-foreground'>
                              {activity.title}
                            </h4>
                            <Badge
                              variant={config.badge}
                              className='text-[10px] uppercase tracking-wider font-semibold py-0'
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <time className='text-xs text-muted-foreground font-medium flex items-center gap-1.5'>
                            <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                            <span>&bull;</span>
                            <span>
                              {new Date(activity.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </time>
                        </div>

                        <div className='pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                          <p className='text-sm text-foreground/85 leading-relaxed'>
                            {activity.description}
                          </p>
                          {activity.performedBy && (
                            <span className='text-xs text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-md border border-border/40 shrink-0'>
                              Performed by:{' '}
                              <strong className='text-foreground'>{activity.performedBy}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className='mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4'>
                  <span className='text-xs text-muted-foreground font-medium'>
                    Showing page <strong className='text-foreground'>{page}</strong> of{' '}
                    <strong className='text-foreground'>{totalPages}</strong> ({totalItems} total
                    activities)
                  </span>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={page <= 1 || isLoading || isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className='gap-1 h-8 px-3 text-xs'
                    >
                      <ChevronLeft className='size-3.5' />
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={page >= totalPages || isLoading || isFetching}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className='gap-1 h-8 px-3 text-xs'
                    >
                      Next
                      <ChevronRight className='size-3.5' />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
