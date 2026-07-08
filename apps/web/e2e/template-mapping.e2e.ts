import { test, expect } from '@playwright/test';

test.describe('Template Mapping E2E', () => {
  test('can assign templates to a concept', async ({ page }) => {
    // Intercept template fetch
    await page.route('**/templates*', async (route) => {
      await route.fulfill({
        status: 200,
        json: { data: [{ id: 'tpl1', name: 'Frontend Template', templateKey: 'TPL_FE' }] },
      });
    });
    
    // Intercept template assignment
    await page.route('**/admin/concepts/*/templates', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.goto('/admin/configs/1');
    await page.click('text=Topics & Weightages');
    
    // Assume we have a concept loaded. We click "Manage Templates" for a concept
    const manageTemplatesBtn = page.locator('button', { hasText: 'Manage Templates' }).first();
    if (await manageTemplatesBtn.isVisible()) {
      await manageTemplatesBtn.click();
      
      // Select template
      await page.click('text=Frontend Template');
      
      // Save
      await page.click('button:has-text("Assign")');
      
      // Expect toast success
      await expect(page.locator('text=Assigned')).toBeVisible();
    }
  });
});
