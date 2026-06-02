import { cn } from '@/lib/utils';

// ─── Skeleton primitives ──────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-3.5 rounded-full bg-muted animate-pulse', className)}
      aria-hidden="true"
    />
  );
}

// ─── Skeleton Card Variants ───────────────────────────────────────────────────

interface SkeletonCardProps {
  /** Number of text lines to show */
  lines?: number;
  /** Show an icon placeholder */
  showIcon?: boolean;
  /** Show an action / button placeholder */
  showAction?: boolean;
  className?: string;
  /** Visual variant */
  variant?: 'default' | 'stat' | 'list-item';
}

/**
 * Generic loading skeleton card with animated shimmer.
 * Matches the structure of DashboardCard and StatCard.
 */
export function SkeletonCard({
  lines = 2,
  showIcon = true,
  showAction = false,
  className,
  variant = 'default',
}: SkeletonCardProps) {
  if (variant === 'stat') {
    return (
      <div
        className={cn(
          'rounded-2xl bg-card border border-border p-6 shadow-sm',
          className
        )}
        role="status"
        aria-label="Loading…"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <SkeletonLine className="w-24" />
            <div className="h-8 w-16 rounded-lg bg-muted animate-pulse" />
            <SkeletonLine className="w-20" />
          </div>
          <div className="size-12 rounded-xl bg-muted animate-pulse shrink-0" />
        </div>
        <span className="sr-only">Loading statistic…</span>
      </div>
    );
  }

  if (variant === 'list-item') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 rounded-xl border border-border bg-card p-4',
          className
        )}
        role="status"
        aria-label="Loading…"
      >
        <div className="size-10 rounded-lg bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-2/3" />
        </div>
        <div className="size-6 rounded-full bg-muted animate-pulse" />
        <span className="sr-only">Loading item…</span>
      </div>
    );
  }

  // Default card variant
  return (
    <div
      className={cn(
        'rounded-2xl bg-card border border-border p-6 shadow-sm',
        className
      )}
      role="status"
      aria-label="Loading…"
    >
      {showIcon && (
        <div className="size-12 rounded-xl bg-muted animate-pulse mb-4" />
      )}
      <div className="space-y-2.5">
        <SkeletonLine className="w-1/2" />
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={i === lines - 1 ? 'w-3/4' : 'w-full'}
          />
        ))}
      </div>
      {showAction && (
        <div className="mt-6 h-5 w-24 rounded-full bg-muted animate-pulse" />
      )}
      <span className="sr-only">Loading card…</span>
    </div>
  );
}

// ─── Grid of skeleton cards ───────────────────────────────────────────────────

interface SkeletonGridProps {
  count?: number;
  variant?: SkeletonCardProps['variant'];
  className?: string;
}

/**
 * Renders a responsive grid of SkeletonCard placeholders.
 */
export function SkeletonCardGrid({
  count = 3,
  variant = 'default',
  className,
}: SkeletonGridProps) {
  return (
    <div
      className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}
