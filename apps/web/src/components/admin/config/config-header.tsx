import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfigHeaderProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function ConfigHeader({ title, description, actionHref, actionLabel }: ConfigHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      {actionHref && actionLabel && (
        <Button asChild>
          <Link href={actionHref}>
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
