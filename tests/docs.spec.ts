import { test, expect } from './testSetup';
import { basicInit } from './testUtils';

test.describe('api docs', () => {
  test('loads service docs', async ({ page }) => {
    await basicInit(page);
    await page.goto('/docs/service');
    await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
    await expect(page.getByText('[PUT] /api/auth')).toBeVisible();
    await expect(page.getByText('Login existing user')).toBeVisible();
  });

  test('loads factory docs', async ({ page }) => {
    await basicInit(page);
    await page.goto('/docs/factory');
    await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
    await expect(page.getByText('factory:')).toBeVisible();
  });
});
