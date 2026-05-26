import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    default:
      'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
    outline:
      'border border-gray-300 text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-900',
    ghost:
      'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-md',
    lg: 'px-6 py-3 text-lg rounded-lg',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
