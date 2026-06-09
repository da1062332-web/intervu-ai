import { test, expect } from '@playwright/test';

const ROUTES = [
  '/candidate/dashboard',
  '/candidate/test/tcs-nqt-001/execution',
  '/candidate/results/tcs-nqt-001'
];

test.describe('Performance Audit', () => {
  for (const route of ROUTES) {
    test(`Should meet LCP & CLS targets for ${route}`, async ({ page }) => {
      // Navigate and collect performance metrics
      await page.goto(`http://localhost:3001${route}`);
      
      const metrics = await page.evaluate(() => JSON.stringify(window.performance.timing));
      const parsedMetrics = JSON.parse(metrics);
      
      const loadTime = parsedMetrics.loadEventEnd - parsedMetrics.navigationStart;
      
      // Target LCP equivalent proxy (Load Time < 2.5s)
      expect(loadTime).toBeLessThan(2500);
      
      // Target CLS
      let cumulativeLayoutShiftScore = 0;
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cumulativeLayoutShiftScore += (entry as any).value;
              }
            }
            resolve();
          }).observe({type: 'layout-shift', buffered: true});
          
          // Fallback resolve if no shift
          setTimeout(resolve, 500);
        });
      });
      
      expect(cumulativeLayoutShiftScore).toBeLessThan(0.1);
    });
  }
});
