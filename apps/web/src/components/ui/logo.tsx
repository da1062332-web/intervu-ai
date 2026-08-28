import * as React from 'react';
import Image from 'next/image';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <div className={`relative ${className}`} {...props as any}>
      <Image 
        src="/logo.png" 
        alt="Logo" 
        fill 
        className="object-contain" 
      />
    </div>
  );
}
