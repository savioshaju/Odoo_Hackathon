import { describe, expect, it } from 'vitest';
import { formatDate, formatDateLong, formatINR } from '../../src/utils/format.js';

describe('formatINR', () => {
  it('matches the server: Indian grouping, paise, negatives', () => {
    expect(formatINR(10_000_000)).toBe('₹1,00,000.00');
    expect(formatINR(2_659_720)).toBe('₹26,597.20');
    expect(formatINR(50)).toBe('₹0.50');
    expect(formatINR(-50_000)).toBe('-₹500.00');
    expect(formatINR(0)).toBe('₹0.00');
  });

  it('shows a dash for a missing amount, not zero', () => {
    expect(formatINR(null)).toBe('—');
    expect(formatINR(undefined)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats plain dates with no time zone shift', () => {
    expect(formatDate('2026-12-20')).toBe('20 Dec 2026');
    expect(formatDate('2027-01-01')).toBe('1 Jan 2027');
    expect(formatDateLong('2026-12-20')).toBe('Sun, 20 Dec 2026');
  });

  it('shows a dash for anything that is not a date', () => {
    expect(formatDate('nonsense')).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});
