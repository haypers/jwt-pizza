import { Page } from '@playwright/test';
import { expect } from './testSetup';
import { Role, User } from '../src/service/pizzaService';

const dinerOrders = [
  {
    id: 23,
    franchiseId: 2,
    storeId: 4,
    date: '2024-06-05T05:14:40.000Z',
    items: [{ menuId: 1, description: 'Veggie', price: 0.0038 }],
  },
];

const franchiseList = {
  franchises: [
    {
      id: 2,
      name: 'LotaPizza',
      admins: [{ id: '4', name: 'Fran Lee', email: 'f@jwt.com' }],
      stores: [
        { id: 4, name: 'Lehi', totalRevenue: 100 },
        { id: 5, name: 'Springville', totalRevenue: 50 },
        { id: 6, name: 'American Fork', totalRevenue: 0 },
      ],
    },
    { id: 3, name: 'PizzaCorp', admins: [{ id: '8', name: 'Pat', email: 'p@jwt.com' }], stores: [{ id: 7, name: 'Spanish Fork', totalRevenue: 10 }] },
    { id: 4, name: 'topSpot', admins: [], stores: [] },
  ],
  more: true,
};

const ownedFranchise = {
  id: 2,
  name: 'LotaPizza',
  stores: [
    { id: 4, name: 'Lehi', totalRevenue: 100 },
    { id: 5, name: 'Springville', totalRevenue: 50 },
  ],
};

export async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
    'f@jwt.com': { id: '4', name: 'Fran Lee', email: 'f@jwt.com', password: 'f', roles: [{ role: Role.Franchisee, objectId: '2' }] },
    'a@jwt.com': { id: '1', name: 'Ava Admin', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
  };

  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
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
    expect(route.request().method()).toBe('GET');
    await route.fulfill({
      json: [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
      ],
    });
  });

  await page.route(/\/api\/order(\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const orderReq = route.request().postDataJSON();
      await route.fulfill({ json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' } });
      return;
    }

    if (method === 'GET') {
      await route.fulfill({ json: { dinerId: loggedInUser?.id ?? 0, orders: dinerOrders, page: 1 } });
      return;
    }

    await route.fulfill({ status: 405, json: { message: 'method not allowed' } });
  });

  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const franchise = route.request().postDataJSON();
      await route.fulfill({ json: { ...franchise, id: 99 } });
      return;
    }

    expect(method).toBe('GET');
    await route.fulfill({ json: franchiseList });
  });

  await page.route(/\/api\/franchise\/[^/]+\/store(\/[^/]+)?$/, async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const store = route.request().postDataJSON();
      await route.fulfill({ json: { ...store, id: 88 } });
      return;
    }
    if (method === 'DELETE') {
      await route.fulfill({ json: { message: 'store deleted' } });
      return;
    }
    await route.fulfill({ status: 405, json: { message: 'method not allowed' } });
  });

  await page.route(/\/api\/franchise\/[^/?]+$/, async (route) => {
    const method = route.request().method();
    if (method === 'DELETE') {
      await route.fulfill({ json: { message: 'franchise deleted' } });
      return;
    }
    expect(method).toBe('GET');
    if (loggedInUser && Role.isRole(loggedInUser, Role.Franchisee)) {
      await route.fulfill({ json: [ownedFranchise] });
      return;
    }
    await route.fulfill({ json: [] });
  });

  await page.route('*/**/api/docs', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({
      json: {
        endpoints: [
          {
            requiresAuth: true,
            method: 'PUT',
            path: '/api/auth',
            description: 'Login existing user',
            example: 'curl -X PUT localhost:3000/api/auth',
            response: { user: { id: 1, name: 'Kai Chen' }, token: 'tttttt' },
          },
        ],
      },
    });
  });

  await page.route('*/**/api/order/verify', async (route) => {
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: { message: 'valid', payload: { vendor: { id: 'jwt-pizza' } } } });
  });

  await page.goto('/');
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}
