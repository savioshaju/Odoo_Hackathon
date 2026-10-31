// npm run db:setup   creates the databases (if missing) and applies PART 1 + PART 2 of query.sql
// npm run db:reset   drops the billing and standin schemas first, then rebuilds them (loses data)
//
// Works on both the main database and the test database. Safe to run again.

import { config } from '../src/config.js';
import { connectTo } from '../src/db.js';
import { queryText, schemaSql } from '../src/sql.js';

const reset = process.argv.includes('--reset');

async function ensureDatabase(name) {
  const admin = await connectTo('postgres');
  try {
    const exists = await admin.maybeOne('admin_database_exists', [name]);
    if (exists) return false;
    const { statement } = await admin.one('admin_create_database_sql', [name]);
    await admin.script(statement);
    return true;
  } finally {
    await admin.end();
  }
}

async function applySchema(name) {
  const conn = await connectTo(name);
  try {
    if (reset) await conn.script(queryText('admin_reset_schemas'));
    await conn.script(schemaSql());
  } finally {
    await conn.end();
  }
}

function explain(err) {
  if (err.code === '28P01' || err.code === '28000') {
    return `PostgreSQL rejected the login for user "${config.pg.user}". Set PGPASSWORD in server/.env to your PostgreSQL password.`;
  }
  if (err.code === 'ECONNREFUSED') {
    return `Could not reach PostgreSQL at ${config.pg.host}:${config.pg.port}. Is the PostgreSQL service running?`;
  }
  return err.message;
}

try {
  if (config.pg.password === 'CHANGE_ME') {
    console.error('server/.env still has PGPASSWORD=CHANGE_ME. Put your PostgreSQL password there first, then run this again.');
    process.exit(1);
  }
  for (const name of [config.dbName, config.testDbName]) {
    const created = await ensureDatabase(name);
    await applySchema(name);
    console.log(`${created ? 'created' : 'found  '} database "${name}" -> schema ${reset ? 'rebuilt' : 'up to date'}`);
  }
  console.log('Database ready.');
} catch (err) {
  console.error(`db:setup failed: ${explain(err)}`);
  process.exit(1);
}
