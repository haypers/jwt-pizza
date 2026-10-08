import { test, expect } from './testSetup';
import { basicInit } from './testUtils';

test.describe('static pages', () => {
  test('opens history from the footer', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('contentinfo').getByRole('link', { name: 'History' }).click();
    await expect(page).toHaveURL('/history');
    await expect(page.getByRole('heading', { name: 'Mama Rucci, my my' })).toBeVisible();
  });

  test('shows the franchise pitch when logged out', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();
    await expect(page.getByRole('link', { name: '800-555-5555' })).toBeVisible();
  });

  test('unknown routes show not found', async ({ page }) => {
    await basicInit(page);
    await page.goto('/not-a-real-page');
    await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
    await expect(page.getByText('dropped a pizza on the floor')).toBeVisible();
  });
});
