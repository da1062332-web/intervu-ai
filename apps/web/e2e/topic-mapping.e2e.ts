import { test, expect } from '@playwright/test';

test.describe('Topic Mapping E2E', () => {
  test('can assign a topic to a section', async ({ page }) => {
    // Intercept API calls to mock topics
    await page.route('**/admin/topics', async (route) => {
      await route.fulfill({
        status: 200,
        json: [{ id: 't1', name: 'React', code: 'REACT', status: 'ACTIVE' }],
      });
    });

    await page.goto('/admin/configs/1');
    await page.click('text=Topics & Weightages');

    // Click assign topics
    await page.click('button:has-text("Assign Topics")');
    
    // Wait for the modal and click a topic to assign
    const topicRow = page.locator('text=React');
    await expect(topicRow).toBeVisible();

    const addButton = page.locator('button', { hasText: 'Add' }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      // Should show success toast
      await expect(page.locator('text=Topic assigned')).toBeVisible();
    }
  });
});
