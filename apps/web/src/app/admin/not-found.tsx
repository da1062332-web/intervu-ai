import Link from 'next/link';
import { Home, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminNotFound() {
  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center text-center px-4'>
      <div className='mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 space-y-6'>
        <div className='flex justify-center'>
          <div className='rounded-full bg-muted p-4'>
            <FileQuestion className='size-10 text-muted-foreground' />
          </div>
        </div>
        <div className='space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Page Not Found</h1>
          <p className='text-sm text-muted-foreground'>
            We couldn't find the page you were looking for in the Admin Portal.
          </p>
        </div>
        <div className='flex justify-center pt-4'>
          <Button asChild variant='default' className='h-11'>
            <Link href='/admin/dashboard'>
              <Home className='mr-2 size-4' />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
