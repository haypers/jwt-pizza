import { test, expect } from 'playwright-test-coverage';

test.describe('login page', () => {
  test('shows the login form for a logged-out diner', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByText('Are you new?')).toBeVisible();
  });

  test('sends a diner to register from the login page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('main').getByText('Register').click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Welcome to the party' })).toBeVisible();
  });
});
