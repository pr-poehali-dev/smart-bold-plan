const URLS = {
  auth: 'https://functions.poehali.dev/1e17b5c0-c2a0-431d-84d6-7be524bd5652',
  catalog: 'https://functions.poehali.dev/91c34bd7-46bb-4889-b23b-e24199efb0a6',
  shop: 'https://functions.poehali.dev/2aa8a997-ffa1-497e-9860-6637da001eb8',
  partner: 'https://functions.poehali.dev/c29fe381-bc3d-4963-9c7c-575e59df3b15',
};

function getSession() {
  return localStorage.getItem('session_id') || '';
}

async function req(base: string, path: string, method = 'GET', body?: object) {
  const sid = getSession();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(sid ? { 'X-Session-Id': sid } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', res.status, text);
    return { error: `Ошибка сервера (${res.status})` };
  }
}

async function authReq(action: string, body?: object) {
  const sid = getSession();
  const res = await fetch(URLS.auth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, session_id: sid || undefined, ...body }),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { error: `Ошибка сервера (${res.status})` }; }
}

// AUTH
export const api = {
  auth: {
    register: (email: string, password: string, name: string) =>
      authReq('register', { email, password, name }),
    login: (email: string, password: string) =>
      authReq('login', { email, password }),
    me: () => authReq('me'),
    update: (data: { name?: string; phone?: string }) =>
      authReq('update', data),
    logout: () => authReq('logout'),
    oauthCallback: (provider: string, code: string, redirect_uri: string) =>
      authReq('oauth_callback', { provider, code, redirect_uri }),
    smsSend: (phone: string) => authReq('sms_send', { phone }),
    smsVerify: (phone: string, code: string) => authReq('sms_verify', { phone, code }),
  },

  // CART
  cart: {
    get: () => req(URLS.catalog, '?resource=cart'),
    add: (service_id: number) => req(URLS.catalog, '?resource=cart', 'POST', { resource: 'cart', service_id }),
    update: (service_id: number, quantity: number) =>
      req(URLS.catalog, '?resource=cart', 'PUT', { resource: 'cart', service_id, quantity }),
    remove: (service_id: number) => req(URLS.catalog, '?resource=cart', 'DELETE', { resource: 'cart', service_id }),
  },

  // FAVORITES
  favorites: {
    get: () => req(URLS.catalog, '?resource=favorites'),
    add: (service_id: number) => req(URLS.catalog, '?resource=favorites', 'POST', { resource: 'favorites', service_id }),
    remove: (service_id: number) => req(URLS.catalog, '?resource=favorites', 'DELETE', { resource: 'favorites', service_id }),
  },

  // ORDERS
  orders: {
    list: () => req(URLS.shop, '?action=orders'),
    get: (id: number) => req(URLS.shop, `?action=order&order_id=${id}`),
    create: () => req(URLS.shop, '?action=create_order', 'POST', { action: 'create_order' }),
    pay: (order_id: number, payment_type: 'bank_card' | 'sbp', return_url: string) =>
      req(URLS.shop, '?action=pay', 'POST', { action: 'pay', order_id, payment_type, return_url }),
    payStatus: (order_id: number) =>
      req(URLS.shop, `?action=pay_status&order_id=${order_id}`),
    track: (order_id: number) =>
      req(URLS.shop, `?action=track&order_id=${order_id}`),
    setTracking: (order_id: number, carrier: string, tracking_number: string) =>
      req(URLS.shop, '?action=set_tracking', 'POST', { action: 'set_tracking', order_id, carrier, tracking_number }),
  },

  // PARTNER
  partner: {
    apply: (data: { org_name: string; contact_name: string; email: string; phone?: string; description?: string }) =>
      req(URLS.partner, '/', 'POST', data),
  },
};