import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
        'dark:border-gray-700 dark:bg-gray-900 dark:shadow-md',
        'transition-shadow hover:shadow-md dark:hover:shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-white',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <p
      className={cn(
        'text-sm text-gray-600 dark:text-gray-400',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn('flex items-center justify-between pt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
