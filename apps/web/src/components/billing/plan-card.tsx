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
  period = '/ month',
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
        'relative flex flex-col justify-between rounded-xl sm:rounded-2xl p-5 transition-all duration-200 bg-white',
        highlighted
          ? 'border-2 border-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-indigo-600/20'
          : 'border border-slate-200 hover:border-slate-300 shadow-sm',
      )}
    >
      {badge && (
        <div className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-md flex items-center gap-1 uppercase tracking-wider'>
          <Sparkles className='size-3' />
          {badge}
        </div>
      )}

      <div>
        <div className='mb-3'>
          <h3 className='text-lg sm:text-xl font-bold tracking-tight text-slate-900'>{title}</h3>
          <p className='text-xs text-slate-600 mt-0.5 line-clamp-2 min-h-[32px]'>{description}</p>
        </div>

        <div className='mb-4 flex items-baseline gap-2 flex-wrap'>
          {discountPercent && originalPrice && (
            <>
              <span className='text-emerald-700 font-extrabold text-base tracking-tight flex items-center'>
                ↓{discountPercent}
              </span>
              <span className='line-through text-slate-400 font-semibold text-base'>
                {originalPrice}
              </span>
            </>
          )}
          <span className='text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900'>
            {price}
          </span>
          {price !== 'Free' && (
            <span className='text-xs font-medium text-slate-500'>{period}</span>
          )}
        </div>

        <div className='border-t border-slate-100 pt-3 mb-4'>
          <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5'>
            Included Features
          </p>
          <ul className='space-y-2 text-xs sm:text-[13px]'>
            {features.map((feature, idx) => (
              <li key={idx} className='flex items-start gap-2.5'>
                <div
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                    highlighted
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  <Check className='size-2.5 stroke-[3]' />
                </div>
                <span className='text-slate-700 font-medium leading-tight'>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Button
        onClick={onSelect}
        disabled={disabled || isLoading}
        variant={highlighted ? 'default' : 'outline'}
        className={cn(
          'w-full h-10 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all mt-3',
          highlighted
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 border-transparent'
            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800',
        )}
      >
        {isLoading ? 'Processing...' : buttonText}
      </Button>
    </div>
  );
}
