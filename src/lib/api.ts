const URLS = {
  auth: 'https://functions.poehali.dev/1e17b5c0-c2a0-431d-84d6-7be524bd5652',
  catalog: 'https://functions.poehali.dev/91c34bd7-46bb-4889-b23b-e24199efb0a6',
  shop: 'https://functions.poehali.dev/2aa8a997-ffa1-497e-9860-6637da001eb8',
};

function getSession() {
  return localStorage.getItem('session_id') || '';
}

async function req(base: string, path: string, method = 'GET', body?: object) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSession(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// AUTH
export const api = {
  auth: {
    register: (email: string, password: string, name: string) =>
      req(URLS.auth, '/register', 'POST', { email, password, name }),
    login: (email: string, password: string) =>
      req(URLS.auth, '/login', 'POST', { email, password }),
    me: () => req(URLS.auth, '/me'),
    update: (data: { name?: string; phone?: string }) =>
      req(URLS.auth, '/me', 'PUT', data),
    logout: () => req(URLS.auth, '/logout', 'POST'),
  },

  // CART
  cart: {
    get: () => req(URLS.catalog, '/cart'),
    add: (service_id: number) => req(URLS.catalog, '/cart', 'POST', { service_id }),
    update: (service_id: number, quantity: number) =>
      req(URLS.catalog, '/cart', 'PUT', { service_id, quantity }),
    remove: (service_id: number) => req(URLS.catalog, '/cart', 'DELETE', { service_id }),
  },

  // FAVORITES
  favorites: {
    get: () => req(URLS.catalog, '/favorites'),
    add: (service_id: number) => req(URLS.catalog, '/favorites', 'POST', { service_id }),
    remove: (service_id: number) => req(URLS.catalog, '/favorites', 'DELETE', { service_id }),
  },

  // ORDERS
  orders: {
    list: () => req(URLS.shop, '/orders'),
    get: (id: number) => req(URLS.shop, `/orders/${id}`),
    create: () => req(URLS.shop, '/orders', 'POST'),
    pay: (order_id: number, payment_type: 'bank_card' | 'sbp', return_url: string) =>
      req(URLS.shop, '/pay', 'POST', { order_id, payment_type, return_url }),
    payStatus: (order_id: number) =>
      req(URLS.shop, `/pay-status?order_id=${order_id}`),
  },
};
