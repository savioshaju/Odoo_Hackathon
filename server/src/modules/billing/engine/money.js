// Money rules for LoopLedger.
//
// Every amount is a whole number of paise held in a JS number (always a safe integer).
// Anything that multiplies or divides goes through BigInt so floating point never touches money.
// Rounding is half-up (0.5 paise rounds away from zero).

export const PAISE_PER_RUPEE = 100;

export function assertPaise(value, label = 'amount') {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new TypeError(`${label} must be a whole number of paise, got ${String(value)}`);
  }
  return value;
}

/** Whole rupees (or rupees and paise as a string like "2028.60") to paise. Test and seed helper. */
export function rupees(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`rupees(): not a finite number: ${value}`);
    return Math.round(value * PAISE_PER_RUPEE);
  }
  return parseINR(String(value));
}

/** round-half-away-from-zero of (a * b / d) using BigInt. d must be positive. */
export function mulDivRound(a, b, d) {
  assertPaise(a, 'a');
  assertPaise(b, 'b');
  assertPaise(d, 'd');
  if (d <= 0) throw new RangeError('mulDivRound(): divisor must be positive');
  const num = BigInt(a) * BigInt(b);
  const den = BigInt(d);
  const negative = num < 0n;
  const abs = negative ? -num : num;
  const q = (2n * abs + den) / (2n * den);
  return Number(negative ? -q : q);
}

/** Percentage given in basis points (1800 = 18 %) of an amount, rounded once. */
export function pctOf(amount, basisPoints) {
  return mulDivRound(amount, basisPoints, 10000);
}

/**
 * Split `total` paise across items in proportion to `weights` so the parts add up to `total` exactly.
 * Largest-remainder method; ties go to the earlier item, so the result is repeatable.
 * Every part is between 0 and its weight whenever total <= sum(weights).
 */
export function splitProportional(total, weights) {
  assertPaise(total, 'total');
  if (total < 0) throw new RangeError('splitProportional(): total must not be negative');
  weights.forEach((w, i) => {
    assertPaise(w, `weights[${i}]`);
    if (w < 0) throw new RangeError('splitProportional(): weights must not be negative');
  });
  if (weights.length === 0) {
    if (total !== 0) throw new RangeError('splitProportional(): nothing to split across');
    return [];
  }
  const sumWeights = weights.reduce((s, w) => s + BigInt(w), 0n);
  if (sumWeights === 0n) {
    if (total !== 0) throw new RangeError('splitProportional(): all weights are zero');
    return weights.map(() => 0);
  }
  const bigTotal = BigInt(total);
  const shares = weights.map((w) => (bigTotal * BigInt(w)) / sumWeights);
  const remainders = weights.map((w, i) => ({ i, r: (bigTotal * BigInt(w)) % sumWeights }));
  let leftover = Number(bigTotal - shares.reduce((s, x) => s + x, 0n));
  remainders.sort((x, y) => (x.r === y.r ? x.i - y.i : x.r > y.r ? -1 : 1));
  const out = shares.map(Number);
  for (const { i, r } of remainders) {
    if (leftover === 0) break;
    if (r === 0n) break;
    out[i] += 1;
    leftover -= 1;
  }
  if (leftover !== 0) throw new Error('splitProportional(): could not place the remainder');
  return out;
}

export function sum(values) {
  return values.reduce((s, v) => s + v, 0);
}

function groupIndian(digits) {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** 2659720 -> "₹26,597.20". Indian digit grouping (1,00,000). */
export function formatINR(paise, { symbol = true } = {}) {
  assertPaise(paise, 'paise');
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const whole = Math.floor(abs / PAISE_PER_RUPEE);
  const frac = String(abs % PAISE_PER_RUPEE).padStart(2, '0');
  const text = `${groupIndian(String(whole))}.${frac}`;
  return `${negative ? '-' : ''}${symbol ? '₹' : ''}${text}`;
}

/**
 * Reads money typed or exported by humans and banks: "₹1,00,000.50", "Rs. 500", "1,00,000", "500.5".
 * Returns paise, or throws. Used by the bank statement import.
 */
export function parseINR(text) {
  if (typeof text !== 'string') throw new TypeError('parseINR(): expected a string');
  const cleaned = text.replace(/₹|rs\.?|inr/gi, '').replace(/[,\s]/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) throw new RangeError(`Not a valid amount: "${text}"`);
  const negative = cleaned.startsWith('-');
  const [whole, frac = ''] = cleaned.replace('-', '').split('.');
  const paise = Number(whole) * PAISE_PER_RUPEE + Number(frac.padEnd(2, '0'));
  assertPaise(paise, 'amount');
  return negative ? -paise : paise;
}
