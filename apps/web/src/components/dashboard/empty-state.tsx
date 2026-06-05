
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { EmptyStateProps } from '@/types/dashboard.types';

interface EmptyStateExtended extends EmptyStateProps {
  className?: string;
}

/**
 * Reusable empty state component with optional custom icon, CTA button.
 * Supports compact inline variant and full-page centered variant.
 */
export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  compact = false,
  className,
}: EmptyStateExtended) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
      role='status'
      aria-live='polite'
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-muted',
          compact ? 'size-12 mb-3' : 'size-16 mb-5',
        )}
        aria-hidden='true'
      >
        {icon ?? <Inbox className={cn('text-muted-foreground', compact ? 'size-5' : 'size-7')} />}
      </div>

      {/* Text */}
      <h3
        className={cn(
          'font-heading font-semibold text-foreground',
          compact ? 'text-base' : 'text-xl',
        )}
      >
        {title}
      </h3>
      {description && (
        <p className={cn('mt-2 text-muted-foreground max-w-sm', compact ? 'text-sm' : 'text-base')}>
          {description}
        </p>
      )}

      {/* CTA */}
      {actionLabel && onAction && (
        <Button onClick={onAction} className='mt-6' size={compact ? 'sm' : 'md'}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ─── Card-wrapped variant ─────────────────────────────────────────────────────

interface EmptyStateCardProps extends EmptyStateExtended {
  cardClassName?: string;
}

/**
 * EmptyState wrapped in a dashed border card — ideal for data table placeholders.
 */
export function EmptyStateCard({ cardClassName, ...props }: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-border bg-muted/30 flex items-center justify-center',
        cardClassName,
      )}
    >
      <EmptyState {...props} />
    </div>
  );
}
