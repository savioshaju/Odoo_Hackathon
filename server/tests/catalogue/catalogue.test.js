// Catalogue and Discount API Tests (Owner: Kishan)
// Verifies:
// 1. Variant dynamic price calculation: base ₹2,000 + addon ₹560 = ₹2,560
// 2. Admin-only discount creation: staff user receives 403 Forbidden at the API level
// 3. Discount claim/release lifecycle: used_count increments and respects usage_limit

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/db.js';
import { useCleanDatabase } from '../helpers/testDb.js';

useCleanDatabase();
const app = createApp({ db });

describe('Kishan: Products & Variants', () => {
  it('computes variant total price dynamically: base ₹2,000 + addon ₹560 = ₹2,560', async () => {
    // 1. Create base product with price 2,000 rupees (200000 paise) as admin
    const productRes = await request(app)
      .post('/api/catalogue/products')
      .set('x-demo-user', 'admin')
      .send({
        name: 'Brightloop CRM',
        kind: 'service',
        sales_price: 2000, // ₹2,000
        cost_price: 800,
        notes: 'Core CRM system',
      })
      .expect(201);

    const productId = productRes.body.id;
    expect(productId).toBeDefined();

    // 2. Add variant with addon price 560 rupees (56000 paise)
    const variantRes = await request(app)
      .post(`/api/catalogue/products/${productId}/variants`)
      .set('x-demo-user', 'admin')
      .send({
        name: 'Odoo Brand Edition',
        price_addon: 560, // ₹560
      })
      .expect(201);

    expect(variantRes.body.name).toBe('Odoo Brand Edition');

    // 3. GET product and verify calculated price: ₹2,000 + ₹560 = ₹2,560
    const getRes = await request(app)
      .get(`/api/catalogue/products/${productId}`)
      .expect(200);

    expect(getRes.body.name).toBe('Brightloop CRM');
    expect(getRes.body.sales_price_display).toBe('₹2,000.00');

    expect(getRes.body.variants).toHaveLength(1);
    const variant = getRes.body.variants[0];
    expect(variant.name).toBe('Odoo Brand Edition');
    expect(variant.price_addon).toBe(56000); // 56000 paise = ₹560
    expect(variant.total_price).toBe(256000); // 256000 paise = ₹2,560
    expect(variant.total_price_display).toBe('₹2,560.00');
  });
});

describe('Kishan: Discounts (Admin-Only API Guard)', () => {
  it('blocks staff user from creating a discount with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/catalogue/discounts')
      .set('x-demo-user', 'staff') // Staff role!
      .send({
        name: 'Early Bird 10%',
        kind: 'percent',
        value: 1000, // 10.00%
        scope: 'subscription',
      })
      .expect(403);

    expect(res.body.error.code).toBe('forbidden');
  });

  it('allows admin to create a discount and tracks usage count', async () => {
    // 1. Admin creates discount with usage limit of 2
    const createRes = await request(app)
      .post('/api/catalogue/discounts')
      .set('x-demo-user', 'admin')
      .send({
        name: 'Launch Discount ₹500',
        kind: 'fixed',
        value: 500, // ₹500
        scope: 'subscription',
        usage_limit: 2,
      })
      .expect(201);

    const discountId = createRes.body.id;
    expect(createRes.body.used_count).toBe(0);

    // 2. Billing engine claims discount use 1
    const claim1 = await request(app)
      .post(`/api/catalogue/discounts/${discountId}/claim`)
      .expect(200);
    expect(claim1.body.used_count).toBe(1);

    // 3. Billing engine claims discount use 2 (hits limit)
    const claim2 = await request(app)
      .post(`/api/catalogue/discounts/${discountId}/claim`)
      .expect(200);
    expect(claim2.body.used_count).toBe(2);

    // 4. Claim 3 exceeds limit -> rejected with 400
    await request(app)
      .post(`/api/catalogue/discounts/${discountId}/claim`)
      .expect(400);

    // 5. Release one use (invoice cancelled) -> used_count decrements to 1
    const release = await request(app)
      .post(`/api/catalogue/discounts/${discountId}/release`)
      .expect(200);
    expect(release.body.used_count).toBe(1);
  });
});
