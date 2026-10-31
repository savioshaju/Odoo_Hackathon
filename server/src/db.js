// Database access. No SQL strings anywhere in JavaScript: everything is a named query from query.sql.
//
//   await db.rows('invoice_list', [..])      all rows
//   await db.one('invoice_get', [id])        exactly one row, else throws
//   await db.maybeOne('setting_get', [k])    one row or null
//   await db.exec('setting_set', [k, v])     row count
//   await db.tx(async (t) => { ... t.rows(..) ... })   one transaction; t has the same methods
//
// Reading values safely:
//   DATE   -> 'YYYY-MM-DD' string (never a JS Date, so time zones cannot shift a day)
//   BIGINT -> number (paise always fit; throws instead of silently losing digits)
//   NUMERIC-> number

import pg from 'pg';
import { config } from './config.js';
import { queryText } from './sql.js';

const { Pool, Client, types } = pg;

function toSafeNumber(text) {
  const n = Number(text);
  if (Number.isInteger(n) && !Number.isSafeInteger(n)) {
    throw new RangeError(`Number ${text} is too large to hold exactly`);
  }
  return n;
}

types.setTypeParser(1082, (value) => value); // DATE
types.setTypeParser(20, toSafeNumber); // BIGINT
types.setTypeParser(1700, toSafeNumber); // NUMERIC

function wrap(runner) {
  const run = (name, params = []) => runner.query(queryText(name), params);
  return {
    async rows(name, params) {
      return (await run(name, params)).rows;
    },
    async one(name, params) {
      const { rows } = await run(name, params);
      if (rows.length !== 1) throw new Error(`Query "${name}" returned ${rows.length} rows, expected exactly 1`);
      return rows[0];
    },
    async maybeOne(name, params) {
      const { rows } = await run(name, params);
      if (rows.length > 1) throw new Error(`Query "${name}" returned ${rows.length} rows, expected 0 or 1`);
      return rows[0] ?? null;
    },
    async exec(name, params) {
      return (await run(name, params)).rowCount;
    },
    /** Runs a multi-statement script (PART 1/2 of query.sql, or a statement a named query produced). */
    async script(text) {
      await runner.query(text);
    },
  };
}

const credentials = () => ({ ...config.pg });

export const pool = new Pool({ ...credentials(), database: config.activeDb, max: 10 });
pool.on('error', (err) => {
  console.error('[db] idle connection error:', err.message);
});

const base = wrap(pool);

/**
 * Runs fn inside one transaction.
 *  - commits when fn returns, rolls back when it throws
 *  - { rollback: true } always rolls back and still returns fn's result (dry run: same code, nothing saved)
 *  - { snapshot: true } gives a consistent read-only view across several queries
 */
async function tx(fn, { rollback = false, snapshot = false } = {}) {
  const client = await pool.connect();
  const conn = wrap(client);
  let broken = false;
  const control = async (name) => {
    try {
      await conn.exec(name);
    } catch (err) {
      broken = true;
      throw err;
    }
  };
  try {
    await control(snapshot ? 'tx_begin_snapshot' : 'tx_begin');
    let result;
    try {
      result = await fn(conn);
    } catch (err) {
      await control('tx_rollback').catch(() => {}); // the original error is the one worth reporting
      throw err;
    }
    await control(rollback ? 'tx_rollback' : 'tx_commit');
    return result;
  } finally {
    // a connection whose BEGIN/COMMIT/ROLLBACK failed is dropped, never reused
    client.release(broken ? true : undefined);
  }
}

export const db = {
  ...base,
  tx,
  pool,
  get name() {
    return config.activeDb;
  },
  end: () => pool.end(),
};

/** A single connection to any database on the server (used by db:setup to reach "postgres"). */
export async function connectTo(database) {
  const client = new Client({ ...credentials(), database });
  await client.connect();
  return { ...wrap(client), end: () => client.end() };
}

/** Test safety: refuse to run destructive helpers on anything that is not the test database. */
export function assertTestDatabase() {
  if (!config.isTest || !config.activeDb.endsWith('_test')) {
    throw new Error(`Refusing to touch "${config.activeDb}": destructive helpers only run on the test database`);
  }
}
