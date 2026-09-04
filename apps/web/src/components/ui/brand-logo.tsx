import * as React from 'react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  logoClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function BrandLogo({ className, logoClassName, textClassName, showText = true, ...props }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Logo className={cn("w-8 h-8 shrink-0", logoClassName)} />
      {showText && (
        <span className={cn("font-extrabold tracking-wide font-sans text-xl", textClassName)}>
          Skillitri<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#9333EA]">X</span>
        </span>
      )}
    </div>
  );
}
