import { HardHat } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className='flex h-[60vh] w-full flex-col items-center justify-center space-y-6 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 text-center'>
      <div className='rounded-full bg-primary/10 p-4'>
        <HardHat className='size-12 text-primary' />
      </div>
      <div className='space-y-2 max-w-sm mx-auto'>
        <h2 className='font-heading text-2xl font-bold tracking-tight text-foreground'>{title}</h2>
        <p className='text-sm text-muted-foreground'>
          {description ?? 'This page is currently under development. Please check back later.'}
        </p>
      </div>
    </div>
  );
}
