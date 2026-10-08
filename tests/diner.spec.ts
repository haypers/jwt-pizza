import { test, expect } from './testSetup';
import { basicInit, loginAs } from './testUtils';

test.describe('diner account', () => {
  test('shows an error for a bad login', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'd@jwt.com', 'wrong');
    await expect(page.getByText('Unauthorized')).toBeVisible();
  });

  test('registers a diner and then logs out', async ({ page }) => {
    await basicInit(page);
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByPlaceholder('Full name').fill('New Diner');
    await page.getByPlaceholder('Email address').fill('n@jwt.com');
    await page.getByPlaceholder('Password').fill('secret');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByRole('link', { name: 'ND' })).toBeVisible();
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('shows diner dashboard history', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'd@jwt.com', 'a');
    await page.getByRole('link', { name: 'KC' }).click();
    await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
    await expect(page.getByText('Kai Chen')).toBeVisible();
    await expect(page.getByText('Here is your history of all the good times.')).toBeVisible();
    await expect(page.locator('tbody')).toContainText('23');
  });

  test('cancels payment and returns to the menu', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'd@jwt.com', 'a');
    await page.getByRole('button', { name: 'Order now' }).click();
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByRole('main')).toContainText('Send me that pizza right now!');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL('/menu');
    await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
  });

  test('verifies a delivered order jwt', async ({ page }) => {
    await basicInit(page);
    await loginAs(page, 'd@jwt.com', 'a');
    await page.getByRole('button', { name: 'Order now' }).click();
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Pay now' }).click();
    await expect(page.getByRole('heading', { name: 'Here is your JWT Pizza!' })).toBeVisible();
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.locator('#hs-jwt-modal')).toContainText('valid');
  });
});
