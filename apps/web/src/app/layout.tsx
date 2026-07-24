import '../styles/globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { AppProviders } from '../components/providers/app-providers';
import { cn } from '@/lib/utils';
import { fontSans, fontHeading, fontMono } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'InterVu AI',
  description: 'AI-powered interview platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={cn(fontSans.variable, fontHeading.variable, fontMono.variable)}
    >
      <body>
        <AppProviders>
          {children}
          <Toaster richColors position='top-right' style={{ zIndex: 999999 }} />
        </AppProviders>
      </body>
    </html>
  );
}
