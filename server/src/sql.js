

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from './config.js';

export const SQL_FILE = path.join(repoRoot, 'query.sql');

let loaded = null;

function load() {
  if (loaded) return loaded;
  const text = readFileSync(SQL_FILE, 'utf8').replace(/\r\n/g, '\n');
  // split() with a capture group gives [preamble, '1', body1, '2', body2, '3', body3]
  const pieces = text.split(/^-- @@PART (\d)[^\n]*\n/m);
  const parts = {};
  for (let i = 1; i < pieces.length; i += 2) parts[pieces[i]] = pieces[i + 1];
  for (const n of ['1', '2', '3']) {
    if (parts[n] == null) throw new Error(`query.sql: PART ${n} marker "-- @@PART ${n}" not found`);
  }

  const queries = new Map();
  const chunks = parts['3'].split(/^-- name:[ \t]*([A-Za-z0-9_]+)[ \t]*$/m);
  for (let i = 1; i < chunks.length; i += 2) {
    const name = chunks[i];
    if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error(`query.sql: bad query name "${name}" (use lower_snake_case)`);
    if (queries.has(name)) throw new Error(`query.sql: query "${name}" is defined twice`);
    const body = chunks[i + 1].trim();
    if (!body) throw new Error(`query.sql: query "${name}" is empty`);
    queries.set(name, body);
  }
  loaded = { schema: `${parts['1']}\n${parts['2']}`, queries };
  return loaded;
}

export function schemaSql() {
  return load().schema;
}

export function queryText(name) {
  const text = load().queries.get(name);
  if (text == null) throw new Error(`Unknown query "${name}". Add it to PART 3 of query.sql.`);
  return text;
}

export function queryNames() {
  return [...load().queries.keys()];
}
