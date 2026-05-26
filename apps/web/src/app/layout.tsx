import '../styles/globals.css';

import type { Metadata } from 'next';

import { ThemeProvider }
  from '@/components/providers/theme-provider';

import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'InterVu AI',

  description:
    'AI-powered interview platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          {children}

          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}