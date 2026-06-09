import '../styles/globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

import { AppProviders } from '../components/providers/app-providers';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'InterVu AI',
  description: 'AI-powered interview platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={cn(inter.variable, outfit.variable, jetbrainsMono.variable)}
    >
      <body>
        <AppProviders>
          {children}
          <Toaster richColors position="top-right" style={{ zIndex: 999999 }} />
        </AppProviders>
      </body>
    </html>
  );
}
