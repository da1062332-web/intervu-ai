import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAdminInsights } from '../hooks/useWorkflow';

export const AdminInsights: React.FC = () => {
  const { insights, loading } = useAdminInsights();

  if (loading || !insights) {
    return (
      <div className='grid gap-6 md:grid-cols-4 mb-8'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='relative overflow-hidden rounded-xl border bg-card/50 shadow-sm'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='h-4 bg-muted rounded w-1/2 animate-pulse'></div>
                <div className='h-8 w-8 bg-muted rounded-full animate-pulse'></div>
              </div>
              <div className='h-8 bg-muted rounded w-1/3 mb-2 animate-pulse'></div>
              <div className='h-3 bg-muted rounded w-2/3 animate-pulse'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Active Workflows',
      value: insights.totalExams - insights.recentlyCompletedCount,
      subtitle: 'Currently in progress',
      icon: Activity,
      gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
      iconColor: 'text-blue-500',
      borderColor: 'hover:border-blue-500/50',
    },
    {
      title: 'Completed',
      value: insights.recentlyCompletedCount,
      subtitle: 'All time tests published',
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      iconColor: 'text-emerald-500',
      borderColor: 'hover:border-emerald-500/50',
    },
    {
      title: 'Pending Review',
      value: insights.pendingReviews,
      subtitle: 'Require attention',
      icon: Clock,
      gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
      iconColor: 'text-amber-500',
      borderColor: 'hover:border-amber-500/50',
    },
    {
      title: 'Failed Workflows',
      value: insights.workflowFailureRate,
      subtitle: 'Needs retry/rollback',
      icon: AlertTriangle,
      gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
      iconColor: 'text-rose-500',
      borderColor: 'hover:border-rose-500/50',
    },
  ];

  return (
    <div className='grid gap-6 md:grid-cols-4 mb-8'>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md ${card.borderColor} hover:-translate-y-1`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-100 ${card.gradient}`}
            />

            <div className='relative p-6'>
              <div className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <h3 className='tracking-tight text-sm font-medium text-muted-foreground'>
                  {card.title}
                </h3>
                <div
                  className={`p-2 rounded-full bg-background/50 backdrop-blur-sm shadow-sm ring-1 ring-black/5 ${card.iconColor}`}
                >
                  <Icon className='h-4 w-4' />
                </div>
              </div>
              <div className='flex flex-col mt-2'>
                <span className='text-3xl font-bold tracking-tight'>{card.value}</span>
                <span className='text-xs text-muted-foreground mt-1 font-medium'>
                  {card.subtitle}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
