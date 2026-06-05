'use client';

import type { ReactNode } from 'react';

import { ThemeProvider, QueryProvider, SessionHydrator } from '@/providers';
import { HydrationProvider } from '@/components/providers/hydration-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delayDuration={300}>
          <HydrationProvider>
            <SessionHydrator>{children}</SessionHydrator>
          </HydrationProvider>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
