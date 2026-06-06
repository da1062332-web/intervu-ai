import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Color Variants ───────────────────────────────────────────────────────────

const colorMap = {
  primary: {
    icon: 'bg-primary/10 text-primary group-hover:bg-primary/20',
    gradient: 'from-primary/5 to-primary/10',
    action: 'text-primary',
  },
  blue: {
    icon: 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20',
    gradient: 'from-blue-500/5 to-blue-500/10',
    action: 'text-blue-500',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20',
    gradient: 'from-emerald-500/5 to-emerald-500/10',
    action: 'text-emerald-500',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20',
    gradient: 'from-amber-500/5 to-amber-500/10',
    action: 'text-amber-500',
  },
  rose: {
    icon: 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20',
    gradient: 'from-rose-500/5 to-rose-500/10',
    action: 'text-rose-500',
  },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  color?: keyof typeof colorMap;
  children?: ReactNode;
  className?: string;
  /** Set true to remove hover-lift effect (e.g. for static info cards) */
  static?: boolean;
}

/**
 * Reusable interactive dashboard card with gradient hover effect,
 * icon slot, title, description, optional action, and children slot.
 */
export function DashboardCard({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  color = 'primary',
  children,
  className,
  static: isStatic = false,
}: DashboardCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-sm',
        !isStatic &&
          'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default',
        className,
      )}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
          colors.gradient,
        )}
        aria-hidden='true'
      />

      {/* Card content */}
      <div className='relative z-10 flex flex-col h-full'>
        {/* Icon */}
        <div
          className={cn(
            'size-12 rounded-xl flex items-center justify-center mb-4',
            'transition-all duration-300 group-hover:scale-110',
            colors.icon,
          )}
          aria-hidden='true'
        >
          {icon}
        </div>

        {/* Title */}
        <h3 className='text-lg font-heading font-semibold text-foreground mb-2'>{title}</h3>

        {/* Description */}
        <p className='text-sm text-muted-foreground mb-4 flex-1 leading-relaxed'>{description}</p>

        {/* Children slot (for custom content like empty state, metrics) */}
        {children && <div className='mt-auto'>{children}</div>}

        {/* Action */}
        {actionLabel && (actionHref || onAction) && (
          <div className='mt-4'>
            {actionHref ? (
              <Link
                href={actionHref}
                className={cn(
                  'inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200',
                  'hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
                  colors.action,
                )}
              >
                {actionLabel}
                <ArrowRight className='size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
              </Link>
            ) : (
              <button
                onClick={onAction}
                className={cn(
                  'inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200',
                  'hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
                  colors.action,
                )}
              >
                {actionLabel}
                <ArrowRight className='size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
