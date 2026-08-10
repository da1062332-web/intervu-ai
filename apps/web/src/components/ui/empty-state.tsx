import Link from 'next/link';
import { Inbox, SearchX, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { EmptyStateProps } from '@/types/dashboard.types';

export interface EmptyStateExtended extends Omit<EmptyStateProps, 'icon'> {
  className?: string;
  variant?: 'default' | 'no-data' | 'no-results' | 'error';
  icon?: React.ReactNode;
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
  actionHref,
  compact = false,
  variant = 'default',
  className,
}: EmptyStateExtended) {
  let DefaultIcon = Inbox;
  let iconColor = 'text-muted-foreground';

  if (variant === 'no-results') {
    DefaultIcon = SearchX;
  } else if (variant === 'error') {
    DefaultIcon = AlertCircle;
    iconColor = 'text-destructive';
  } else if (variant === 'no-data') {
    DefaultIcon = Inbox;
  }

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
          'flex items-center justify-center rounded-full bg-muted/50 border border-muted ring-[6px] ring-muted/20',
          variant === 'error' && 'bg-destructive/10 border-destructive/20 ring-destructive/10',
          compact ? 'size-12 mb-4' : 'size-16 mb-6',
        )}
        aria-hidden='true'
      >
        {icon ?? (
          <DefaultIcon
            className={cn(
              iconColor,
              compact ? 'size-5' : 'size-7',
              variant === 'error' && 'text-destructive',
            )}
          />
        )}
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
      {actionLabel &&
        (actionHref || onAction) &&
        (actionHref ? (
          <Button asChild className='mt-6' size={compact ? 'sm' : 'md'}>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button onClick={onAction} className='mt-6' size={compact ? 'sm' : 'md'}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}

// ─── Card-wrapped variant ─────────────────────────────────────────────────────

export interface EmptyStateCardProps extends EmptyStateExtended {
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
