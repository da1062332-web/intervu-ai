import { useRecentActivities } from '../../hooks/useRecentActivities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TimelineSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import { Activity, Edit3, FileText, Settings, User, ChevronRight } from 'lucide-react';
import type { ActivityTimelineItem } from '../../services/dashboard.service';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function getActivityConfig(type: string) {
  switch (type.toLowerCase()) {
    case 'assessment':
    case 'assessment_started':
    case 'assessment_completed':
      return { icon: <FileText className="size-3.5 text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' };
    case 'system':
      return { icon: <Settings className="size-3.5 text-amber-600 dark:text-amber-400" />, bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800' };
    case 'user':
      return { icon: <User className="size-3.5 text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800' };
    default:
      return { icon: <Activity className="size-3.5 text-primary" />, bg: 'bg-primary/10', border: 'border-primary/20' };
  }
}

export function RecentActivitiesTimeline() {
  const { data, isLoading, isError, refetch } = useRecentActivities();

  if (isLoading) {
    return <TimelineSkeleton className="h-full min-h-[300px]" />;
  }

  if (isError) {
    return (
      <Card className="h-full min-h-[300px] flex items-center justify-center rounded-xl shadow-sm">
        <EmptyState
          variant="error"
          title="Failed to load activities"
          description="There was an error loading the recent activities timeline."
          actionLabel="Try again"
          onAction={refetch}
        />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-full min-h-[300px] flex items-center justify-center rounded-xl shadow-sm">
        <EmptyState variant="no-data" title="No recent activities" />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden rounded-xl shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Activity Feed</CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs h-8 text-muted-foreground hover:text-foreground">
          <Link href="/admin/activities">
            View All <ChevronRight className="ml-1 size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 max-h-[350px]">
        <div className="relative p-5 before:absolute before:inset-y-0 before:left-7 before:w-px before:bg-border/50">
          <ul className="space-y-5">
            {data.map((activity, index) => {
              const config = getActivityConfig(activity.activityType);
              return (
                <li key={index} className="relative pl-7 group">
                  {/* Timeline Dot/Icon */}
                  <span className={cn("absolute left-[-1.1rem] top-0.5 flex size-7 items-center justify-center rounded-full border shadow-sm transition-transform group-hover:scale-110", config.bg, config.border)}>
                    {config.icon}
                  </span>
                  
                  {/* Content */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                      <time className="text-[11px] text-muted-foreground whitespace-nowrap font-medium">
                        {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} &bull; {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <p className="text-[13px] text-muted-foreground line-clamp-1">{activity.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
