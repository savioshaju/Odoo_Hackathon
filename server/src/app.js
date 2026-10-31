import express from 'express';
import { db as defaultDb } from './db.js';
import { HttpError } from './errors.js';
import { createBillingRouter } from './modules/billing/routes.js';
import { demoAuth } from './modules/billing/standins/auth.js';

export function createApp({ db = defaultDb } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      await db.one('db_ping');
      res.json({ ok: true, database: db.name });
    } catch (err) {
      res.status(503).json({
        ok: false,
        error: {
          code: 'database_unavailable',
          message: 'Cannot reach PostgreSQL. Check PGPASSWORD in server/.env, then run: npm run db:setup',
          detail: err.code ?? err.message,
        },
      });
    }
  });

  app.use('/api/billing', demoAuth, createBillingRouter(db));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'No such endpoint' } });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    if (err.type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'bad_json', message: 'Request body is not valid JSON' } });
      return;
    }
    console.error('[server] unexpected error:', err);
    res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong on the server' } });
  });

  return app;
}
