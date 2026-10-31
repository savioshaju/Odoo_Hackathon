// Billing module API, mounted at /api/billing. Later blocks add billing run, invoices, payments,
// Time Machine, Proof page and bank match here.

import { Router } from 'express';
import { getClock } from './clock.js';
import { unauthorized } from '../../errors.js';

export function createBillingRouter(db) {
  const router = Router();

  // Public: the "Simulated date" banner reads this on every page.
  router.get('/clock', async (_req, res) => {
    res.json(await getClock(db));
  });

  router.get('/me', (req, res) => {
    if (!req.user) throw unauthorized();
    res.json(req.user);
  });

  return router;
}
