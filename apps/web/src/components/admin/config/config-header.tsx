import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ConfigHeaderProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function ConfigHeader({ title, description, actionHref, actionLabel }: ConfigHeaderProps) {
  return (
    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
        {description && <p className='text-muted-foreground mt-1'>{description}</p>}
      </div>
      {actionHref && actionLabel && (
        <Button asChild>
          <Link href={actionHref}>
            <Plus className='w-4 h-4 mr-2' />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
