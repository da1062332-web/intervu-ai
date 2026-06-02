import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Color Variants ───────────────────────────────────────────────────────────

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  blue: 'bg-blue-500/10 text-blue-500',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  amber: 'bg-amber-500/10 text-amber-500',
  rose: 'bg-rose-500/10 text-rose-500',
} as const;

// ─── Trend config ─────────────────────────────────────────────────────────────

const trendConfig = {
  up: {
    icon: TrendingUp,
    className: 'text-emerald-500',
    label: 'Trending up',
  },
  down: {
    icon: TrendingDown,
    className: 'text-rose-500',
    label: 'Trending down',
  },
  neutral: {
    icon: Minus,
    className: 'text-muted-foreground',
    label: 'No change',
  },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon: ReactNode;
  color?: 'primary' | 'blue' | 'emerald' | 'amber' | 'rose';
  className?: string;
  loading?: boolean;
}

/**
 * Metric stat card — displays a KPI with label, value, trend indicator and icon.
 */
export function StatCard({
  label,
  value,
  trend = 'neutral',
  trendLabel,
  icon,
  color = 'primary',
  className,
  loading = false,
}: StatCardProps) {
  const TrendIcon = trendConfig[trend].icon;

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-2xl bg-card border border-border p-6 shadow-sm',
          className
        )}
        aria-busy="true"
        aria-label={`Loading ${label}`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3.5 w-24 rounded-full bg-muted animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="size-12 rounded-xl bg-muted animate-pulse shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-sm',
        'hover:shadow-md transition-all duration-300',
        className
      )}
    >
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/20 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Left: Metrics */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {label}
          </p>
          <p className="mt-2 text-3xl font-heading font-bold tracking-tight text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trendLabel && (
            <div
              className="mt-2 flex items-center gap-1"
              aria-label={`${trendConfig[trend].label}: ${trendLabel}`}
            >
              <TrendIcon
                className={cn('size-3.5', trendConfig[trend].className)}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  trendConfig[trend].className
                )}
              >
                {trendLabel}
              </span>
            </div>
          )}
        </div>

        {/* Right: Icon */}
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-xl',
            'transition-transform duration-300 group-hover:scale-110',
            colorMap[color]
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
