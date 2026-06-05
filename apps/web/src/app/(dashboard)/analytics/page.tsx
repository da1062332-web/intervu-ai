'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle2, TrendingUp, Download } from 'lucide-react';
import { AnalyticsSectionHeader } from '@/components/analytics/AnalyticsSectionHeader';
import { StatCard } from '@/components/analytics/StatCard';
import { TrendCard } from '@/components/analytics/TrendCard';
import { ProgressIndicator } from '@/components/analytics/ProgressIndicator';
import { EmptyAnalyticsState } from '@/components/analytics/EmptyAnalyticsState';
import {
  mockOverviewStats,
  mockPerformanceMetrics,
  mockTrendData,
  mockRecentActivity,
} from '@/data/mock-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getIconForStat = (title: string) => {
    switch (title) {
      case 'Tests Taken':
        return <FileText className='size-5' />;
      case 'Average Score':
        return <TrendingUp className='size-5' />;
      case 'Pass Rate':
        return <CheckCircle2 className='size-5' />;
      case 'Active Candidates':
        return <Users className='size-5' />;
      default:
        return <FileText className='size-5' />;
    }
  };

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      <AnalyticsSectionHeader
        title='Analytics Overview'
        description='Key performance indicators and insights for your assessments.'
        action={
          <button className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2'>
            <Download className='mr-2 size-4' />
            Export Report
          </button>
        }
      />

      {/* Stats Overview Grid */}
      <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
        {mockOverviewStats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={isLoading ? '-' : stat.value}
            trend={stat.trend}
            icon={getIconForStat(stat.title)}
          />
        ))}
      </div>

      <div className='grid gap-6 grid-cols-1 lg:grid-cols-3'>
        {/* Main Chart Area */}
        <div className='lg:col-span-2'>
          <TrendCard
            title='Candidate Engagement'
            data={mockTrendData}
            trendValue='+24%'
            isLoading={isLoading}
          />
        </div>

        {/* Performance Section */}
        <Card className='flex flex-col h-full'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Skill Performance</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col justify-center space-y-6 pt-2'>
            {isLoading ? (
              <div className='space-y-6'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className='flex flex-col gap-2'>
                    <div className='h-4 bg-muted animate-pulse rounded w-1/3' />
                    <div className='h-2 bg-muted animate-pulse rounded-full w-full' />
                  </div>
                ))}
              </div>
            ) : mockPerformanceMetrics.length > 0 ? (
              mockPerformanceMetrics.map((metric, idx) => (
                <ProgressIndicator
                  key={idx}
                  label={metric.category}
                  progress={metric.score}
                  color={
                    metric.score > 80
                      ? 'bg-emerald-500'
                      : metric.score > 60
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  }
                />
              ))
            ) : (
              <EmptyAnalyticsState
                title='No skills tracked'
                description='Performance metrics will appear here.'
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed Section */}
      <AnalyticsSectionHeader
        title='Recent Activity'
        description='Latest events and updates from your interview campaigns.'
      />

      <Card>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='p-6 space-y-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex gap-4'>
                  <div className='size-10 rounded-full bg-muted animate-pulse' />
                  <div className='space-y-2 flex-1'>
                    <div className='h-4 bg-muted animate-pulse rounded w-1/4' />
                    <div className='h-3 bg-muted animate-pulse rounded w-1/2' />
                  </div>
                </div>
              ))}
            </div>
          ) : mockRecentActivity.length > 0 ? (
            <div className='divide-y divide-border'>
              {mockRecentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className='p-6 flex items-start gap-4 hover:bg-muted/50 transition-colors'
                >
                  <div
                    className={`size-10 rounded-full flex flex-shrink-0 items-center justify-center mt-1 ${
                      activity.type === 'interview'
                        ? 'bg-blue-500/10 text-blue-500'
                        : activity.type === 'assessment'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-violet-500/10 text-violet-500'
                    }`}
                  >
                    {activity.type === 'interview' && <Users className='size-5' />}
                    {activity.type === 'assessment' && <FileText className='size-5' />}
                    {activity.type === 'system' && <CheckCircle2 className='size-5' />}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-foreground'>{activity.title}</p>
                    <p className='text-sm text-muted-foreground mt-1 truncate'>
                      {activity.description}
                    </p>
                  </div>
                  <div className='text-xs text-muted-foreground whitespace-nowrap'>
                    {activity.timestamp}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='p-6'>
              <EmptyAnalyticsState
                title='No recent activity'
                description='Activity will appear here once candidates take interviews.'
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
