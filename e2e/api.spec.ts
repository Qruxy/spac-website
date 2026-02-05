import { test, expect } from '@playwright/test';

test.describe('Public API Routes', () => {
  test('GET /api/events returns events', async ({ request }) => {
    const response = await request.get('/api/events');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data) || data.events).toBeTruthy();
  });

  test('GET /api/listings returns listings', async ({ request }) => {
    const response = await request.get('/api/listings');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data) || data.listings).toBeTruthy();
  });

  test('GET /api/board-members returns board members', async ({ request }) => {
    const response = await request.get('/api/board-members');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});

test.describe('Admin API Security', () => {
  const adminRoutes = [
    '/api/admin/users',
    '/api/admin/events',
    '/api/admin/memberships',
    '/api/admin/registrations',
    '/api/admin/media',
    '/api/admin/listings',
    '/api/admin/board-members',
    '/api/admin/stats',
  ];

  for (const route of adminRoutes) {
    test(`${route} requires authentication`, async ({ request }) => {
      const response = await request.get(route);
      
      // Should return 401 or 403
      expect([401, 403]).toContain(response.status());
    });
  }
});

test.describe('Upload API Security', () => {
  test('presigned URL requires auth', async ({ request }) => {
    const response = await request.post('/api/upload/presigned', {
      data: { filename: 'test.jpg', contentType: 'image/jpeg' },
    });
    
    // Should require auth
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Checkout Routes', () => {
  test('membership checkout requires valid data', async ({ request }) => {
    const response = await request.post('/api/checkout/membership', {
      data: {},
    });
    
    // Should fail with invalid data
    expect([400, 401, 422]).toContain(response.status());
  });

  test('event checkout requires valid data', async ({ request }) => {
    const response = await request.post('/api/checkout/event', {
      data: {},
    });
    
    // Should fail with invalid data
    expect([400, 401, 422]).toContain(response.status());
  });
});
