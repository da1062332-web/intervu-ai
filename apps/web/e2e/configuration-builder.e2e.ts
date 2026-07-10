import { test, expect } from '@playwright/test';

test.describe('Configuration Builder Flow', () => {
  test('loads sections and verifies generation readiness UI', async ({ page }) => {
    // Navigate to admin config builder
    await page.goto('/admin/configs/1');

    // Check main title
    await expect(page.locator('h1')).toContainText('Configuration Builder');

    // Section should be visible
    await expect(page.locator('text=Sections')).toBeVisible();

    // Check generation readiness widget
    const readinessWidget = page.locator('text=Generation Readiness');
    await expect(readinessWidget).toBeVisible();

    // Test clicking around tabs
    await page.click('text=Topics & Weightages');
    await expect(page.locator('text=Assign Topics')).toBeVisible();
  });
});
