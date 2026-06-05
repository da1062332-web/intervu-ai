import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900',
        'placeholder-gray-500 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400',
        'dark:focus:ring-blue-400',
        'disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-900',
        className,
      )}
      {...props}
    />
  );
}
