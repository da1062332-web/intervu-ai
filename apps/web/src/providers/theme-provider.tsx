'use client';

import * as React from 'react';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

import { useUIStore, type ThemeMode } from '@/store/ui.store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeStateBridge(): null {
  const setStoreTheme = useUIStore((state) => state.setTheme);
  const { theme: activeTheme } = useTheme();

  React.useEffect(() => {
    if (activeTheme === 'light' || activeTheme === 'dark' || activeTheme === 'system') {
      setStoreTheme(activeTheme as ThemeMode);
    }
  }, [activeTheme, setStoreTheme]);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <ThemeStateBridge />
      {children}
    </NextThemesProvider>
  );
}
