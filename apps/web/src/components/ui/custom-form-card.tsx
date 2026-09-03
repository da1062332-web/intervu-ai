import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CustomFormCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const CustomFormCard = React.forwardRef<HTMLDivElement, CustomFormCardProps>(
  ({ title, description, children, footer, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn('w-full shadow-sm overflow-hidden !p-0', className)} {...props}>
        <CardHeader className='bg-muted/30 border-b p-6 pb-5'>
          <CardTitle className='text-xl font-semibold tracking-tight'>{title}</CardTitle>
          {description && (
            <CardDescription className='text-[0.9rem] mt-1.5'>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className={cn('space-y-6 p-6', footer && 'mb-0')}>{children}</CardContent>
        {footer && (
          <div className='border-t px-6 py-4 flex items-center justify-end bg-muted/30'>
            {footer}
          </div>
        )}
      </Card>
    );
  },
);
CustomFormCard.displayName = 'CustomFormCard';
