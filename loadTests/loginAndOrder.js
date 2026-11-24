/**
 * Grafana Cloud k6 load test: Login and order pizza
 *
 * Targets Hayden's CS 329 JWT Pizza production deployment:
 *   Frontend: https://pizza.ofthegoverned.com
 *   Backend:  https://pizza-service.ofthegoverned.com
 *   Factory:  https://pizza-factory.cs329.click
 *
 * How to use:
 *   1. In Grafana Cloud, go to Testing & synthetics > Performance
 *      > Create new test > HTTP API > Write a script
 *   2. Paste this entire file
 *   3. Adjust `options.stages` below if you need to match the Canvas
 *      "Altered scenario" VU / duration screenshot
 *   4. Run Test, then screenshot the full execution timeline
 *
 * Verified live (single-pass curl) on 2026-11-23 (America/Denver):
 *   PUT    /api/auth              200  (token)
 *   GET    /api/order/menu        200  (items with id, title, price)
 *   GET    /api/franchise         200  ({ franchises: [{ id, stores: [{ id }] }], more })
 *   POST   /api/order             200  (jwt)
 *   POST   /api/order/verify      200  ({ message: "valid" }; auth header optional)
 *   DELETE /api/auth              200  ({ message: "logout successful" })
 */

import { sleep, check, group, fail } from 'k6';
import http from 'k6/http';

const BASE = 'https://pizza-service.ofthegoverned.com';
const FRONTEND = 'https://pizza.ofthegoverned.com';
const FACTORY = 'https://pizza-factory.cs329.click';

const jsonHeaders = {
  accept: '*/*',
  'content-type': 'application/json',
  origin: FRONTEND,
};

function authHeaders(token) {
  return {
    accept: '*/*',
    'content-type': 'application/json',
    origin: FRONTEND,
    authorization: `Bearer ${token}`,
  };
}

function requireStatus200(response, label) {
  if (!check(response, { 'status equals 200': (r) => r.status.toString() === '200' })) {
    console.log(`${label} failed: ${response.status} ${response.body}`);
    fail(`${label} was *not* 200`);
  }
}

export const options = {
  // Conservative 1-minute scenario so this stays cheap on Grafana Cloud
  // and the production JWT Pizza box. Tweak target (VUs) and duration
  // here to match Canvas's "Altered scenario" screenshot.
  //
  //   0 -> 5 VUs over 15s
  //   stay at 5 VUs for 30s
  //   5 -> 0 VUs over 15s
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 5 },
    { duration: '15s', target: 0 },
  ],
};

export default function main() {
  const vars = {};

  group('Load home page', function () {
    const response = http.get(FRONTEND + '/', {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        origin: FRONTEND,
      },
    });
    requireStatus200(response, 'Home page');
  });
  sleep(1);

  group('Login', function () {
    const response = http.put(
      BASE + '/api/auth',
      JSON.stringify({ email: 'd@jwt.com', password: 'diner' }),
      { headers: jsonHeaders }
    );

    // Assignment-required login check: abort the iteration on a failed login
    // so a 500 does not cascade into 401s on /api/order.
    if (
      !check(response, {
        'status equals 200': (response) => response.status.toString() === '200',
      })
    ) {
      console.log(response.body);
      fail('Login was *not* 200');
    }

    vars.authToken = response.json().token;
  });
  sleep(1);

  group('Get menu', function () {
    const response = http.get(BASE + '/api/order/menu', {
      headers: authHeaders(vars.authToken),
    });
    requireStatus200(response, 'Get menu');

    const menu = response.json();
    const pepperoni = Array.isArray(menu) ? menu.find((item) => item.title === 'Pepperoni') : null;
    vars.menuItem = pepperoni || (Array.isArray(menu) ? menu[0] : null);
    if (!vars.menuItem) {
      fail('Menu response did not include any items');
    }
  });
  sleep(1);

  group('Get franchises', function () {
    const response = http.get(BASE + '/api/franchise', {
      headers: authHeaders(vars.authToken),
    });
    requireStatus200(response, 'Get franchises');

    const body = response.json();
    const franchises = Array.isArray(body) ? body : body.franchises;
    const franchise = franchises && franchises[0];
    const store = franchise && franchise.stores && franchise.stores[0];
    if (!franchise || !store) {
      fail('Franchise response did not include a franchise/store');
    }
    vars.franchiseId = franchise.id;
    vars.storeId = store.id;
  });
  sleep(1);

  group('Order pizza', function () {
    const payload = JSON.stringify({
      franchiseId: vars.franchiseId,
      storeId: vars.storeId,
      items: [
        {
          menuId: vars.menuItem.id,
          description: vars.menuItem.title,
          price: vars.menuItem.price,
        },
      ],
    });

    const response = http.post(BASE + '/api/order', payload, {
      headers: authHeaders(vars.authToken),
    });
    requireStatus200(response, 'Order pizza');

    vars.pizzaJwt = response.json().jwt;
    if (!vars.pizzaJwt) {
      fail('Order response did not include a jwt');
    }
  });
  sleep(1);

  group('Verify pizza', function () {
    // Factory verify returns 200 with or without Authorization; send the
    // diner token to match the authenticated browser flow.
    const response = http.post(FACTORY + '/api/order/verify', JSON.stringify({ jwt: vars.pizzaJwt }), {
      headers: authHeaders(vars.authToken),
    });
    requireStatus200(response, 'Verify pizza');
  });
  sleep(1);

  group('Logout', function () {
    const response = http.del(BASE + '/api/auth', null, {
      headers: {
        accept: '*/*',
        origin: FRONTEND,
        authorization: `Bearer ${vars.authToken}`,
      },
    });
    requireStatus200(response, 'Logout');
  });
  sleep(1);
}
