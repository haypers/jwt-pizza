import { Page } from '@playwright/test';
import { expect } from './testSetup';
import { Role, User } from '../src/service/pizzaService';

export async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
  };

  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = user;
      await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
      return;
    }

    if (method === 'POST') {
      const registerReq = route.request().postDataJSON();
      const user: User = {
        id: '9',
        name: registerReq.name,
        email: registerReq.email,
        password: registerReq.password,
        roles: [{ role: Role.Diner }],
      };
      validUsers[user.email!] = user;
      loggedInUser = user;
      await route.fulfill({ json: { user, token: 'abcdef' } });
      return;
    }

    if (method === 'DELETE') {
      loggedInUser = undefined;
      await route.fulfill({ json: { message: 'logout successful' } });
      return;
    }

    await route.fulfill({ status: 405, json: { message: 'method not allowed' } });
  });

  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser ?? null });
  });

  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
      more: false,
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route(/\/api\/order(\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const orderReq = route.request().postDataJSON();
      await route.fulfill({ json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' } });
      return;
    }

    if (method === 'GET') {
      await route.fulfill({ json: { dinerId: loggedInUser?.id ?? 0, orders: [], page: 1 } });
      return;
    }

    await route.fulfill({ status: 405, json: { message: 'method not allowed' } });
  });

  await page.goto('/');
}
