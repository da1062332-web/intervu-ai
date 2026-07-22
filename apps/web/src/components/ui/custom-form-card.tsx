import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CustomFormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const CustomFormCard = React.forwardRef<HTMLDivElement, CustomFormCardProps>(
  ({ title, description, children, footer, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn('w-full', className)} {...props}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={cn('space-y-6', footer && 'mb-0')}>
          {children}
        </CardContent>
        {footer && (
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 mt-6 flex items-center justify-end rounded-b-lg bg-gray-50 dark:bg-gray-900/50">
            {footer}
          </div>
        )}
      </Card>
    );
  }
);
CustomFormCard.displayName = 'CustomFormCard';
