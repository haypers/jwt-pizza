import { test, expect } from '@playwright/test';

test.describe('home page', () => {
  test('shows the hero and lets a diner start an order', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('JWT Pizza');
    await expect(page.getByText('JWT Pizza').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: "The web's best pizza" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Order now' })).toBeVisible();

    await page.getByRole('button', { name: 'Order now' }).click();
    await expect(page).toHaveURL('/menu');
    await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
  });

  test('opens about from the footer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Our employees' })).toBeVisible();
  });
});
