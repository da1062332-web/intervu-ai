import Link from 'next/link';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4 text-center'>
      <div className='mx-auto max-w-md animate-fade-in-up space-y-6'>
        <div className='flex justify-center'>
          <div className='rounded-full bg-muted p-4 border border-border/50 shadow-sm'>
            <SearchX className='size-12 text-muted-foreground' />
          </div>
        </div>

        <div className='space-y-2'>
          <h1 className='font-heading text-4xl font-bold tracking-tight text-foreground'>
            404
          </h1>
          <h2 className='text-xl font-semibold text-foreground/80'>
            Page not found
          </h2>
          <p className='text-sm text-muted-foreground leading-relaxed mt-2'>
            Sorry, we couldn't find the page you're looking for. It might have been
            removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 pt-6'>
          <Button
            asChild
            variant='default'
            className='w-full sm:w-auto h-11'
          >
            <Link href='/'>
              <Home className='mr-2 size-4' />
              Return to Dashboard
            </Link>
          </Button>
          <Button
            asChild
            variant='outline'
            className='w-full sm:w-auto h-11'
          >
            <Link href='javascript:history.back()'>
              <ArrowLeft className='mr-2 size-4' />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
