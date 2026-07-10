import { test, expect } from '@playwright/test';

test.describe('Assessment Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the assessment builder page
    await page.goto('/admin/assessment-builder');
  });

  test('should complete the full generation flow from config selection to results', async ({
    page,
  }) => {
    // 1. Select Configuration
    await expect(page.getByText('1. Select Configuration')).toBeVisible();

    // Select the first available configuration (mocked or actual data)
    // Assuming ConfigurationSelection renders buttons with "Select" text
    const selectConfigButton = page.getByRole('button', { name: /select/i }).first();
    await expect(selectConfigButton).toBeVisible();
    await selectConfigButton.click();

    // Continue to preview
    const continueBtn = page.getByRole('button', { name: /continue to preview/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // 2. Review Blueprint
    await expect(page.getByText(/2\. Review Blueprint:/i)).toBeVisible();

    // Click Generate Assessment
    const generateBtn = page.getByRole('button', { name: /generate assessment/i });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 3. Generation Progress
    // We should see the progress UI
    await expect(page.getByText(/generating assessment/i)).toBeVisible();

    // Assuming mock setup or fast backend for E2E, wait for the result
    // This could take a while if it's hitting a real backend.
    await expect(page.getByText(/generation complete/i)).toBeVisible({ timeout: 15000 });

    // 4. Assessment Result
    await expect(page.getByText('3. Assessment Result')).toBeVisible({ timeout: 5000 });

    // Verify preview is rendered
    await expect(page.getByText(/preview questions/i)).toBeVisible();

    // We can also verify that a section exists
    await expect(page.getByText('Sections').first()).toBeVisible();
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Test what happens if we navigate when no config is selected or loaded
    // This depends heavily on initial setup. We verify that the "Continue" button is disabled initially.
    await expect(page.getByRole('button', { name: /continue to preview/i })).toBeDisabled();
  });
});
