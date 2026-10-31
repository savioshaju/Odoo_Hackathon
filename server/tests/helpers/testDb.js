import { afterAll, beforeAll, beforeEach } from 'vitest';
import { assertTestDatabase, db } from '../../src/db.js';

/** Gives every test in a file an empty test database, and closes the pool at the end. */
export function useCleanDatabase() {
  beforeAll(async () => {
    assertTestDatabase();
    try {
      await db.one('db_ping');
    } catch (err) {
      throw new Error(
        `Cannot reach the test database "${db.name}" (${err.code ?? err.message}). ` +
          'Set PGPASSWORD in server/.env and run: npm run db:setup',
      );
    }
  });
  beforeEach(async () => {
    assertTestDatabase();
    await db.exec('test_reset');
  });
  afterAll(async () => {
    await db.end();
  });
}
