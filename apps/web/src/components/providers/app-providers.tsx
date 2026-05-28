'use client';

import type { ReactNode } from 'react';

import {
  ThemeProvider,
  QueryProvider,
  SessionHydrator,
} from '@/providers';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SessionHydrator>
          {children}
        </SessionHydrator>
      </QueryProvider>
    </ThemeProvider>
  );
}
