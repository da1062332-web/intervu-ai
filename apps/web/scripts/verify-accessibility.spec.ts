import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const ROUTES = [
  '/login',
  '/signup',
  '/candidate/dashboard',
  '/candidate/tests/tcs-nqt-001',
  '/candidate/tests/tcs-nqt-001/instructions',
  '/candidate/test/tcs-nqt-001/execution',
  '/candidate/results/tcs-nqt-001',
];

test.describe('Accessibility Audit', () => {
  for (const route of ROUTES) {
    test(`Should pass a11y checks on ${route}`, async ({ page }) => {
      await page.goto(`http://localhost:3001${route}`);
      await injectAxe(page);

      // Target: Score >= 95. We will fail on critical/serious issues.
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });
  }
});
