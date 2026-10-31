// Enforces the house rule mechanically: ALL database code lives in query.sql.
// No SQL strings in JavaScript, tests or scripts; they only call named queries.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { queryNames, queryText, schemaSql } from '../src/sql.js';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = path.join(serverRoot, 'tests', 'sql-rules.test.js');

function jsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules') return [];
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return jsFiles(full);
    return full.endsWith('.js') || full.endsWith('.jsx') ? [full] : [];
  });
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`])\/\/.*$/gm, '$1');
}

const SQL_SHAPES = [
  /\bSELECT\b[\s\S]{0,300}?\bFROM\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\s+[\w."]+\s+SET\b/i,
  /\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|SCHEMA|DATABASE|FUNCTION|VIEW)\b/i,
  /\bTRUNCATE\b/i,
  /['"`]\s*(BEGIN|COMMIT|ROLLBACK)\s*;?\s*['"`]/i,
];

describe('query.sql is the only home of database code', () => {
  it('no JavaScript file under server/ contains an SQL statement', () => {
    const offenders = [];
    for (const file of ['src', 'scripts', 'tests'].flatMap((d) => jsFiles(path.join(serverRoot, d)))) {
      if (file === SELF) continue;
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const shape of SQL_SHAPES) {
        if (shape.test(code)) offenders.push(`${path.relative(serverRoot, file)} matches ${shape}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every query name used in JavaScript exists in query.sql', () => {
    const known = new Set(queryNames());
    const used = new Set();
    const call = /\b(?:rows|one|maybeOne|exec|queryText)\(\s*'([a-z][a-z0-9_]*)'/g;
    const control = /\b(?:control|conn\.exec)\(\s*[^'"\n]*'([a-z][a-z0-9_]*)'/g;
    for (const file of ['src', 'scripts', 'tests'].flatMap((d) => jsFiles(path.join(serverRoot, d)))) {
      if (file === SELF) continue;
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const m of code.matchAll(call)) used.add(m[1]);
      for (const m of code.matchAll(control)) used.add(m[1]);
    }
    const missing = [...used].filter((n) => !known.has(n));
    expect(missing).toEqual([]);
    expect(used.size).toBeGreaterThan(5);
  });
});

describe('query.sql loader', () => {
  it('finds PART 3 queries by name', () => {
    expect(queryNames()).toEqual(expect.arrayContaining(['db_ping', 'tx_begin', 'tx_commit', 'tx_rollback', 'setting_get']));
    expect(queryText('db_ping')).toMatch(/SELECT 1/);
  });

  it('fails immediately on an unknown name', () => {
    expect(() => queryText('no_such_query')).toThrow(/Unknown query "no_such_query"/);
  });

  it('keeps the schema parts separate from the named queries', () => {
    const schema = schemaSql();
    expect(schema).toMatch(/CREATE SCHEMA IF NOT EXISTS billing/);
    expect(schema).toMatch(/CREATE SCHEMA IF NOT EXISTS standin/);
    expect(schema).not.toMatch(/-- name:/);
    expect(queryText('test_reset')).not.toMatch(/CREATE TABLE/);
  });
});
