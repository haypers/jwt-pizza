import { test, expect } from './testSetup';
import { basicInit, loginAs } from './testUtils';

test.describe('admin dashboard', () => {
  test('lists franchises and can create one', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'a@jwt.com', 'admin');
    await expect(page.getByRole('link', { name: 'AA' })).toBeVisible();
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
    await expect(page.getByText('LotaPizza')).toBeVisible();

    await page.getByPlaceholder('Filter franchises').fill('Lota');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('button', { name: '»' }).click();

    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await expect(page.getByRole('heading', { name: 'Create franchise' })).toBeVisible();
    await page.getByPlaceholder('franchise name').fill('PizzaPocket');
    await page.getByPlaceholder('franchisee admin email').fill('f@jwt.com');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  });

  test('closes a franchise', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'a@jwt.com', 'admin');
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('row', { name: /LotaPizza/ }).getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
    await expect(page.getByText('LotaPizza')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  });

  test('closes a store from the admin table', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'a@jwt.com', 'admin');
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('row', { name: /Lehi/ }).getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  });
});
