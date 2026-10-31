import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { formatINR, mulDivRound, parseINR, pctOf, rupees, splitProportional, sum } from '../../src/modules/billing/engine/money.js';

describe('rounding', () => {
  it('rounds half up and never uses floats', () => {
    expect(mulDivRound(1, 1, 2)).toBe(1); // 0.5 -> 1
    expect(mulDivRound(1, 1, 3)).toBe(0); // 0.33 -> 0
    expect(mulDivRound(2, 1, 3)).toBe(1); // 0.67 -> 1
    expect(mulDivRound(-1, 1, 2)).toBe(-1); // away from zero
    expect(pctOf(2304000, 1800)).toBe(414720);
  });

  it('stays exact where floating point would drift', () => {
    // 1.005 * 100 style traps: 100.5 paise worth must round to 101, never 100
    expect(mulDivRound(201, 1, 2)).toBe(101);
    // very large amounts (Rs 9 crore at 28 %) stay exact
    const nineCrore = 900_000_000_00;
    expect(pctOf(nineCrore, 2800)).toBe(252_000_000_00);
  });

  it('refuses non-integers', () => {
    expect(() => mulDivRound(1.5, 1, 2)).toThrow();
    expect(() => pctOf(100, 0.5)).toThrow();
  });
});

describe('rupees()', () => {
  it('converts rupees to paise', () => {
    expect(rupees(25600)).toBe(2_560_000);
    expect(rupees('2028.60')).toBe(202_860);
    expect(rupees(230.4)).toBe(23_040);
  });
});

describe('formatINR', () => {
  it('uses Indian digit grouping', () => {
    expect(formatINR(10_000_000)).toBe('₹1,00,000.00');
    expect(formatINR(2_659_720)).toBe('₹26,597.20');
    expect(formatINR(50)).toBe('₹0.50');
    expect(formatINR(0)).toBe('₹0.00');
    expect(formatINR(123_456_789_00)).toBe('₹12,34,56,789.00');
    expect(formatINR(-50_000, { symbol: false })).toBe('-500.00');
  });
});

describe('parseINR', () => {
  it('reads Indian and bank formats', () => {
    expect(parseINR('₹1,00,000.50')).toBe(10_000_050);
    expect(parseINR('Rs. 500')).toBe(50_000);
    expect(parseINR('1,00,000')).toBe(10_000_000);
    expect(parseINR('500.5')).toBe(50_050);
    expect(parseINR('-250.00')).toBe(-25_000);
  });
  it('rejects rubbish', () => {
    expect(() => parseINR('abc')).toThrow();
    expect(() => parseINR('12.345')).toThrow();
    expect(() => parseINR('')).toThrow();
  });
  it('round-trips with formatINR', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 99_999_999_999 }), (p) => parseINR(formatINR(p)) === p),
      { numRuns: 500 },
    );
  });
});

describe('splitProportional', () => {
  it('splits Rs 500 across lines exactly', () => {
    const parts = splitProportional(50_000, [2_304_000, 1_000_000, 333_333]);
    expect(sum(parts)).toBe(50_000);
  });

  it('is repeatable: ties go to the earlier line', () => {
    expect(splitProportional(1, [100, 100, 100])).toEqual([1, 0, 0]);
    expect(splitProportional(2, [100, 100, 100])).toEqual([1, 1, 0]);
  });

  it('handles empty and zero cases', () => {
    expect(splitProportional(0, [])).toEqual([]);
    expect(splitProportional(0, [0, 0])).toEqual([0, 0]);
    expect(() => splitProportional(5, [0, 0])).toThrow();
  });

  it('property: parts always add up to the total and never exceed their own weight', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 5_000_000_00 }), { minLength: 1, maxLength: 12 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (weights, fraction) => {
          const total = Math.floor(sum(weights) * fraction);
          const parts = splitProportional(total, weights);
          expect(sum(parts)).toBe(total);
          parts.forEach((p, i) => {
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThanOrEqual(weights[i]);
          });
        },
      ),
      { numRuns: 1000 },
    );
  });
});
