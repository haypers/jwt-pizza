import { test, expect } from './testSetup';
import { basicInit, loginAs } from './testUtils';

test.describe('franchisee dashboard', () => {
  test('lists stores and can create one', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'f@jwt.com', 'f');
    await expect(page.getByRole('link', { name: 'FL' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
    await expect(page.getByText('Lehi')).toBeVisible();

    await page.getByRole('button', { name: 'Create store' }).click();
    await expect(page.getByRole('heading', { name: 'Create store' })).toBeVisible();
    await page.getByPlaceholder('store name').fill('Provo');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
  });

  test('closes a store', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'f@jwt.com', 'f');
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Franchise' }).click();
    await page.getByRole('row', { name: /Lehi/ }).getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
    await expect(page.getByText('Lehi')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
  });
});
