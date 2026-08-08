import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  breadcrumbs?: { label: string; href?: string }[];
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ title, description, actions, icon: Icon, breadcrumbs, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-4 mb-8 pb-4 border-b-2 border-border/60 dark:border-border/80',
          className,
        )}
        {...props}
      >
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label='Breadcrumb'
            className='flex items-center gap-1 text-sm text-muted-foreground mb-1'
          >
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label} className='flex items-center gap-1'>
                {index > 0 && (
                  <ChevronRight className='size-3.5 text-muted-foreground/50' aria-hidden='true' />
                )}
                {crumb.href ? (
                  <Link href={crumb.href} className='hover:text-foreground transition-colors'>
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''
                    }
                    aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='space-y-1.5'>
            <h2 className='text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5'>
              {Icon && (
                <div className='p-1.5 bg-primary/10 rounded-md'>
                  <Icon className='w-5 h-5 text-primary' />
                </div>
              )}
              {title}
            </h2>
            {description && <p className='text-sm text-muted-foreground/80'>{description}</p>}
          </div>
          {actions && <div className='flex items-center space-x-3 shrink-0'>{actions}</div>}
        </div>
      </div>
    );
  },
);
SectionHeader.displayName = 'SectionHeader';
