import * as React from 'react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 100 100'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      {...props}
    >
      <path d='M50 10L15 30L50 50L85 30L50 10Z' fill='url(#paint1_linear)' />
      <path d='M15 30V70L50 90V50L15 30Z' fill='url(#paint2_linear)' />
      <path d='M85 30V70L50 90V50L85 30Z' fill='url(#paint3_linear)' />
      <path
        d='M50 50V90'
        stroke='white'
        strokeWidth='2'
        strokeLinecap='round'
        strokeOpacity='0.3'
      />
      <path
        d='M15 30L50 50L85 30'
        stroke='white'
        strokeWidth='2'
        strokeLinecap='round'
        strokeOpacity='0.5'
      />
      {/* The abstract "I" cut out or overlaid on the top face */}
      <circle cx='50' cy='22' r='3' fill='white' />
      <rect x='48' y='28' width='4' height='14' rx='2' fill='white' />

      <defs>
        <linearGradient
          id='paint1_linear'
          x1='50'
          y1='10'
          x2='50'
          y2='50'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#A78BFA' />
          <stop offset='1' stopColor='#818CF8' />
        </linearGradient>
        <linearGradient
          id='paint2_linear'
          x1='15'
          y1='30'
          x2='50'
          y2='90'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#4F46E5' />
          <stop offset='1' stopColor='#7C3AED' />
        </linearGradient>
        <linearGradient
          id='paint3_linear'
          x1='85'
          y1='30'
          x2='50'
          y2='90'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#4338CA' />
          <stop offset='1' stopColor='#6D28D9' />
        </linearGradient>
      </defs>
    </svg>
  );
}
