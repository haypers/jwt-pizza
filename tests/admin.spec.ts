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
    await page.getByRole('table', { name: 'Franchises' }).getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('table', { name: 'Franchises' }).getByRole('button', { name: '»' }).click();

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

  test('lists, filters, pages, and deletes users', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'a@jwt.com', 'admin');
    await page.getByRole('link', { name: 'Admin' }).click();

    const users = page.getByRole('table', { name: 'Users' });
    const kai = users.getByRole('row', { name: /Kai Chen/ });
    await expect(kai).toContainText('d@jwt.com');
    await expect(kai).toContainText('diner');
    await expect(users.getByRole('row', { name: /Buddy/ })).toContainText('b@jwt.com');

    const nextPage = page.waitForRequest((request) => request.method() === 'GET' && request.url().includes('/api/user?') && request.url().includes('page=2'));
    await users.getByRole('button', { name: '»' }).click();
    await nextPage;
    await expect(users.getByRole('row', { name: /Diner 9/ })).toBeVisible();
    await expect(users.getByText('Kai Chen')).toHaveCount(0);

    const filtered = page.waitForRequest((request) => request.method() === 'GET' && request.url().includes('/api/user?') && request.url().includes('Buddy'));
    await page.getByPlaceholder('Filter users').fill('Buddy');
    await users.getByRole('button', { name: 'Search' }).click();
    await filtered;
    await expect(users.getByRole('cell', { name: 'b@jwt.com' })).toBeVisible();
    await expect(users.getByText('Kai Chen')).toHaveCount(0);

    await users.getByRole('row', { name: /b@jwt.com/ }).getByRole('button', { name: 'Delete' }).click();
    await expect(users.getByRole('cell', { name: 'b@jwt.com' })).toHaveCount(0);
  });
});
