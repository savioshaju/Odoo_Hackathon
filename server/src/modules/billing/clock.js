// The ONE place that answers "what is today?". Every module reads the date from here.
//
//   - Normally: today's India calendar date.
//   - With a simulated date set (Time Machine, or a test fixing the date): that date.
//
// The simulated date lives in billing.settings, so it survives restarts and is shared by every process.

import { assertDate, todayIST } from './engine/dates.js';

export const SIMULATED_KEY = 'simulated_date';

/** @returns {Promise<{today: string, simulated: boolean, realToday: string}>} */
export async function getClock(conn, now = new Date()) {
  const row = await conn.maybeOne('setting_get', [SIMULATED_KEY]);
  const realToday = todayIST(now);
  return { today: row ? row.value : realToday, simulated: Boolean(row), realToday };
}

export async function today(conn, now = new Date()) {
  return (await getClock(conn, now)).today;
}

/** Fix "today" to a date (tests, Time Machine). Does not enforce direction: the Time Machine does that. */
export async function setSimulatedDate(conn, date) {
  assertDate(date, 'simulated date');
  await conn.exec('setting_set', [SIMULATED_KEY, date]);
}

/** Back to the real India date. */
export async function clearSimulatedDate(conn) {
  await conn.exec('setting_clear', [SIMULATED_KEY]);
}
