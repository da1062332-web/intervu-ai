import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 320, height: 568, name: 'Mobile' },
  { width: 768, height: 1024, name: 'Tablet' },
  { width: 1280, height: 800, name: 'Laptop' },
  { width: 1440, height: 900, name: 'Desktop' }
];

const ROUTES = [
  '/login',
  '/candidate/dashboard',
  '/candidate/tests/tcs-nqt-001',
  '/candidate/test/tcs-nqt-001/execution',
  '/candidate/results/tcs-nqt-001'
];

test.describe('Responsive Audit', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const route of ROUTES) {
        test(`Should render ${route} without horizontal overflow`, async ({ page }) => {
          await page.goto(`http://localhost:3001${route}`);
          
          // Check for horizontal overflow
          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          
          expect(hasOverflow).toBeFalsy();
        });
      }
    });
  }
});
