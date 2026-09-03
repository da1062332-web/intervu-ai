'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AdminBillingHeaderProps {
  title: string;
  description: string;
  actionButton?: React.ReactNode;
}

export function AdminBillingHeader({
  title,
  description,
  actionButton,
}: AdminBillingHeaderProps) {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5'>
      <div>
        <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2'>
          <ShieldCheck className='size-3.5' />
          Role: Plan Manager / Admin
        </div>
        <h1 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground'>
          {title}
        </h1>
        <p className='text-sm text-muted-foreground mt-1'>{description}</p>
      </div>

      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}
