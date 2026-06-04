import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageHeaderProps } from '@/types/dashboard.types';

interface PageHeaderExtended extends PageHeaderProps {
  className?: string;
}

/**
 * Reusable page header with title, subtitle, optional breadcrumbs, and action slot.
 * Used at the top of every dashboard page.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  action,
  className,
}: PageHeaderExtended) {
  return (
    <div className={cn('mb-6 space-y-1', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
        >
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="size-3.5 text-muted-foreground/50" aria-hidden="true" />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={
                    index === breadcrumbs.length - 1
                      ? 'text-foreground font-medium'
                      : ''
                  }
                  aria-current={
                    index === breadcrumbs.length - 1 ? 'page' : undefined
                  }
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-muted-foreground max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0 flex items-center gap-2">{action}</div>
        )}
      </div>
    </div>
  );
}

// ─── Helper wrapper with divider ──────────────────────────────────────────────

export function PageHeaderWithDivider(props: PageHeaderExtended) {
  return (
    <>
      <PageHeader {...props} />
      <div className="mb-6 h-px bg-border" aria-hidden="true" />
    </>
  );
}
