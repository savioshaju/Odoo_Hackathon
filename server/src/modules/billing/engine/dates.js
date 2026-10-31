// Plain-date helpers. A date is always the string "YYYY-MM-DD" (India calendar day), never a timestamp.
// All arithmetic is done in UTC on whole days, so time zones and daylight saving cannot move a date.
//
// Billing period n of a subscription starts at periodStart(startDate, frequency, n).
// Every start is calculated from the ORIGINAL start date, never from the previous period,
// so 31 Jan -> 28 Feb -> 31 Mar (and not 31 Jan -> 28 Feb -> 28 Mar).

export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isValidDate(text) {
  if (typeof text !== 'string') return false;
  const m = DATE_RE.exec(text);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

export function assertDate(text, label = 'date') {
  if (!isValidDate(text)) throw new RangeError(`${label} must be a real date like 2026-01-31, got ${String(text)}`);
  return text;
}

export function parseDate(text) {
  assertDate(text);
  const m = DATE_RE.exec(text);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function toISO(y, m, d) {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function toUTC(text) {
  const { y, m, d } = parseDate(text);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms) {
  const t = new Date(ms);
  return toISO(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function isLeapYear(y) {
  return daysInMonth(y, 2) === 29;
}

export function addDays(text, n) {
  return fromUTC(toUTC(text) + n * DAY_MS);
}

/** Adds whole months, clamping to the last day of the target month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(text, n) {
  const { y, m, d } = parseDate(text);
  const index = y * 12 + (m - 1) + n;
  const ty = Math.floor(index / 12);
  const tm = (((index % 12) + 12) % 12) + 1;
  return toISO(ty, tm, Math.min(d, daysInMonth(ty, tm)));
}

export function addYears(text, n) {
  return addMonths(text, n * 12);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a, b) {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

/** Today's calendar date in India (Asia/Kolkata) for the given instant. */
export function todayIST(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function periodStart(startDate, frequency, n) {
  assertDate(startDate, 'startDate');
  if (!Number.isInteger(n) || n < 0) throw new RangeError('period number must be a whole number >= 0');
  switch (frequency) {
    case 'daily':
      return addDays(startDate, n);
    case 'weekly':
      return addDays(startDate, 7 * n);
    case 'monthly':
      return addMonths(startDate, n);
    case 'yearly':
      return addYears(startDate, n);
    default:
      throw new RangeError(`Unknown frequency "${frequency}" (use ${FREQUENCIES.join(', ')})`);
  }
}

/** Last day covered by period n: the day before period n+1 starts. */
export function periodEnd(startDate, frequency, n) {
  return addDays(periodStart(startDate, frequency, n + 1), -1);
}

/** Highest n with periodStart(n) <= date, or -1 when the date is before the first period. */
export function lastPeriodNo(startDate, frequency, date) {
  assertDate(date, 'date');
  if (date < startDate) return -1;
  const a = parseDate(startDate);
  const b = parseDate(date);
  let n;
  switch (frequency) {
    case 'daily':
      n = daysBetween(startDate, date);
      break;
    case 'weekly':
      n = Math.floor(daysBetween(startDate, date) / 7);
      break;
    case 'monthly':
      n = (b.y - a.y) * 12 + (b.m - a.m);
      break;
    case 'yearly':
      n = b.y - a.y;
      break;
    default:
      throw new RangeError(`Unknown frequency "${frequency}"`);
  }
  while (n >= 0 && periodStart(startDate, frequency, n) > date) n -= 1;
  return n;
}

/**
 * Active ranges are inclusive [from, to] with to = null meaning "still active".
 * A pause 10 Mar - 20 Apr is the gap between { to: '03-09' } and { from: '04-21' }.
 */
export function isActiveOn(ranges, date) {
  return ranges.some((r) => r.from <= date && (r.to == null || date <= r.to));
}

/**
 * Every billing period of a subscription that has started by `today`, each marked billable or not.
 * A period is billed when it starts on or after the subscription start, starts before the expiry
 * date, and the subscription was Active on that start date.
 */
export function listPeriods({ startDate, frequency, expiryDate = null, activeRanges, today }) {
  assertDate(startDate, 'startDate');
  assertDate(today, 'today');
  if (expiryDate != null) assertDate(expiryDate, 'expiryDate');
  const last = lastPeriodNo(startDate, frequency, today);
  const periods = [];
  for (let n = 0; n <= last; n += 1) {
    const start = periodStart(startDate, frequency, n);
    const end = periodEnd(startDate, frequency, n);
    let billable = true;
    let reason = null;
    if (expiryDate != null && start >= expiryDate) {
      billable = false;
      reason = 'after expiry';
    } else if (!isActiveOn(activeRanges, start)) {
      billable = false;
      reason = 'not active';
    }
    periods.push({ n, start, end, billable, reason });
  }
  return periods;
}

/** Only the periods that should be billed. */
export function duePeriods(subscription) {
  return listPeriods(subscription).filter((p) => p.billable);
}

export function dueDate(invoiceDate, paymentTermsDays) {
  if (!Number.isInteger(paymentTermsDays) || paymentTermsDays < 0) {
    throw new RangeError('payment terms must be a whole number of days >= 0');
  }
  return addDays(invoiceDate, paymentTermsDays);
}

/** Overdue starts the day AFTER the due date and is worked out from dates, never saved. */
export function isOverdue(dueDateText, today) {
  return today > dueDateText;
}

export function daysOverdue(dueDateText, today) {
  return Math.max(0, daysBetween(dueDateText, today));
}
