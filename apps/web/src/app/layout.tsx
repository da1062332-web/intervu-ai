import '../styles/globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { AppProviders } from '../components/providers/app-providers';
import { cn } from '@/lib/utils';
import { fontSans, fontHeading, fontMono } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'SkillitriX',
  description: 'AI-powered interview platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={cn(fontSans.variable, fontHeading.variable, fontMono.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function isExtensionError(event) {
                  var msg = (event && (event.message || (event.error && event.error.message))) || '';
                  return typeof msg === 'string' && (
                    msg.includes("reading 'startTime'") ||
                    msg.includes('reportAllChanges')
                  );
                }
                window.addEventListener('error', function(e) {
                  if (isExtensionError(e)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e && e.reason && (e.reason.message || e.reason);
                  if (typeof reason === 'string' && (reason.includes("reading 'startTime'") || reason.includes('reportAllChanges'))) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body>
        <AppProviders>
          {children}
          <Toaster richColors position='top-right' style={{ zIndex: 999999 }} expand={true} />
        </AppProviders>
      </body>
    </html>
  );
}
