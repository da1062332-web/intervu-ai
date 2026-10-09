'use client';

import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PlanCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  discountPercent?: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  highlighted?: boolean;
  badge?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onSelect: () => void;
}

export function PlanCard({
  title,
  price,
  originalPrice,
  discountPercent,
  period,
  description,
  features,
  buttonText,
  highlighted = false,
  badge,
  disabled = false,
  isLoading = false,
  onSelect,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between rounded-[22px] p-6 transition-all duration-200 bg-card border border-border/60 shadow-2xs hover:shadow-md hover:border-indigo-500/30',
        highlighted && 'border-indigo-500/50 shadow-indigo-500/10 ring-1 ring-indigo-500/20',
      )}
    >
      <div>
        {/* Badges row */}
        <div className='flex items-center justify-between gap-2 mb-4'>
          {badge ? (
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border',
                highlighted
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                  : title.toLowerCase().includes('free')
                  ? 'bg-muted text-muted-foreground border-border/60'
                  : 'bg-sky-500/15 text-sky-400 border-sky-500/30',
              )}
            >
              {badge}
            </span>
          ) : (
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border',
                title.toLowerCase().includes('free')
                  ? 'bg-muted text-muted-foreground border-border/60'
                  : 'bg-sky-500/15 text-sky-400 border-sky-500/30',
              )}
            >
              {title.toLowerCase().includes('free') ? 'FREE' : 'POPULAR'}
            </span>
          )}

          {discountPercent && (
            <span className='rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold'>
              {discountPercent.startsWith('-') ? discountPercent : `-${discountPercent}`} OFF
            </span>
          )}
        </div>

        <div className='mb-3'>
          <h3 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>{title}</h3>
          <p className='text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px] font-normal leading-relaxed'>
            {description}
          </p>
        </div>

        <div className='my-4 flex items-baseline gap-2 flex-wrap'>
          <span className='text-2xl sm:text-3xl font-black tracking-tight text-foreground'>
            {price}
          </span>
          {originalPrice && (
            <span className='line-through text-muted-foreground/60 font-semibold text-sm'>
              {originalPrice}
            </span>
          )}
          {price !== 'Free' && period && (
            <span className='text-xs font-medium text-muted-foreground'>{period}</span>
          )}
        </div>

        <div className='border-t border-border/40 pt-4 mb-4'>
          <ul className='space-y-2.5 text-xs'>
            {features.map((feature, idx) => (
              <li key={idx} className='flex items-start gap-2.5'>
                <div className='mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full text-sky-400'>
                  <Check className='size-3 stroke-[3]' />
                </div>
                <span className='text-muted-foreground font-medium leading-tight'>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Button
        onClick={onSelect}
        disabled={disabled || isLoading}
        className={cn(
          'w-full h-10 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all mt-3',
          disabled
            ? 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/40 cursor-not-allowed border'
            : highlighted
            ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-indigo-500/20'
            : 'bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20',
        )}
      >
        {isLoading ? 'Processing...' : buttonText}
      </Button>
    </div>
  );
}
