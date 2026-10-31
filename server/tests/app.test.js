// The Express app end to end against the test database: health, the one shared clock, the stand-in login.

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { db } from '../src/db.js';
import { clearSimulatedDate, getClock, setSimulatedDate, today } from '../src/modules/billing/clock.js';
import { useCleanDatabase } from './helpers/testDb.js';

useCleanDatabase();
const app = createApp({ db });

describe('health', () => {
  it('reports the test database is up', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toEqual({ ok: true, database: db.name });
    expect(db.name.endsWith('_test')).toBe(true);
  });
});

describe('the one shared clock', () => {
  it('is the real India date until someone fixes it', async () => {
    const clock = await getClock(db, new Date('2026-12-31T19:00:00Z')); // already 1 Jan in India
    expect(clock).toEqual({ today: '2027-01-01', simulated: false, realToday: '2027-01-01' });
  });

  it('can be fixed to a simulated date and put back', async () => {
    await setSimulatedDate(db, '2026-12-20');
    expect(await today(db)).toBe('2026-12-20');
    expect((await getClock(db)).simulated).toBe(true);
    await clearSimulatedDate(db);
    expect((await getClock(db)).simulated).toBe(false);
  });

  it('rejects a date that does not exist', async () => {
    await expect(setSimulatedDate(db, '2026-02-30')).rejects.toThrow(/real date/);
  });

  it('is served publicly for the Simulated date banner', async () => {
    await setSimulatedDate(db, '2026-12-20');
    const res = await request(app).get('/api/billing/clock').expect(200);
    expect(res.body).toMatchObject({ today: '2026-12-20', simulated: true });
    expect(res.body.realToday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('stand-in sign-in', () => {
  it('needs a user for /me', async () => {
    const res = await request(app).get('/api/billing/me').expect(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('turns the demo header into req.user, with role and customer', async () => {
    const admin = await request(app).get('/api/billing/me').set('X-Demo-User', 'admin').expect(200);
    expect(admin.body).toMatchObject({ role: 'admin', customerId: null });
    const a = await request(app).get('/api/billing/me').set('X-Demo-User', 'customerA').expect(200);
    expect(a.body).toMatchObject({ role: 'customer', customerId: 1 });
    const b = await request(app).get('/api/billing/me').set('X-Demo-User', 'customerB').expect(200);
    expect(b.body).toMatchObject({ role: 'customer', customerId: 2 });
  });

  it('rejects an unknown demo user', async () => {
    const res = await request(app).get('/api/billing/me').set('X-Demo-User', 'hacker').expect(401);
    expect(res.body.error.code).toBe('unknown_demo_user');
  });
});

describe('errors are JSON', () => {
  it('unknown endpoints give a JSON 404', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('not_found');
  });
  it('broken JSON gives a JSON 400', async () => {
    const res = await request(app).post('/api/billing/clock').set('Content-Type', 'application/json').send('{oops').expect(400);
    expect(res.body.error.code).toBe('bad_json');
  });
});
