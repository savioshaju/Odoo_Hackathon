// Reads server/.env (never overrides variables already set in the shell) and exposes plain settings.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  process.loadEnvFile(path.join(serverRoot, '.env'));
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const env = process.env;

export const config = {
  isTest,
  port: Number(env.PORT ?? 4000),
  companyState: (env.COMPANY_STATE ?? 'MH').toUpperCase(),
  pg: {
    host: env.PGHOST ?? 'localhost',
    port: Number(env.PGPORT ?? 5432),
    user: env.PGUSER ?? 'postgres',
    password: env.PGPASSWORD ?? '',
  },
  dbName: env.DB_NAME ?? 'loopledger',
  testDbName: env.TEST_DB_NAME ?? 'loopledger_test',
  /** The database this process talks to: the test database whenever tests are running. */
  get activeDb() {
    return isTest ? this.testDbName : this.dbName;
  },
};

export const repoRoot = path.resolve(serverRoot, '..');
