import { describe, expect, it } from 'vitest';
import { discountHasRoom, discountWindowOpen, eligibleDiscounts, linesForPeriod } from '../../src/modules/billing/engine/eligibility.js';
import { monthlyEquivalent } from '../../src/modules/billing/engine/mrr.js';
import { rupees } from '../../src/modules/billing/engine/money.js';

describe('mid-period changes take effect next period', () => {
  const base = { id: 1, startDate: '2026-12-01', endDate: null };
  const addon = { id: 2, startDate: '2026-12-18', endDate: null };

  it('add-on switched on 18 Dec is not in the 1 Dec invoice and starts 1 Jan', () => {
    expect(linesForPeriod([base, addon], '2026-12-01').map((l) => l.id)).toEqual([1]);
    expect(linesForPeriod([base, addon], '2027-01-01').map((l) => l.id)).toEqual([1, 2]);
  });

  it('an add-on removed on 18 Dec is still billed for December and gone from 1 Jan', () => {
    const removed = { id: 3, startDate: '2026-12-01', endDate: '2026-12-18' };
    expect(linesForPeriod([removed], '2026-12-01')).toHaveLength(1);
    expect(linesForPeriod([removed], '2027-01-01')).toHaveLength(0);
  });
});

describe('discount dates and limits', () => {
  const d = { id: 1, startDate: '2026-01-01', endDate: '2026-03-31', usageLimit: 2 };

  it('is judged on the period start date, inclusive at both ends', () => {
    expect(discountWindowOpen(d, '2025-12-31')).toBe(false);
    expect(discountWindowOpen(d, '2026-01-01')).toBe(true);
    expect(discountWindowOpen(d, '2026-03-31')).toBe(true);
    expect(discountWindowOpen(d, '2026-04-01')).toBe(false);
  });

  it('open-ended dates and unlimited uses always pass', () => {
    expect(discountWindowOpen({ id: 2 }, '2099-01-01')).toBe(true);
    expect(discountHasRoom({ id: 2 }, 1_000_000)).toBe(true);
  });

  it('stops when it runs out', () => {
    expect(discountHasRoom(d, 1)).toBe(true);
    expect(discountHasRoom(d, 2)).toBe(false);
  });

  it('eligibleDiscounts combines dates and used counts', () => {
    const list = [d, { id: 2, usageLimit: 1 }, { id: 3, startDate: '2027-01-01' }];
    const used = new Map([[1, 2]]);
    expect(eligibleDiscounts(list, '2026-02-01', used).map((x) => x.id)).toEqual([2]);
    expect(eligibleDiscounts(list, '2026-02-01').map((x) => x.id)).toEqual([1, 2]);
  });
});

describe('MRR (rules table)', () => {
  it('yearly / 12: Rs 12,000 yearly = Rs 1,000 MRR', () => {
    expect(monthlyEquivalent(rupees(12000), 'yearly')).toBe(rupees(1000));
  });
  it('weekly x 52 / 12, daily x 365 / 12, monthly as is', () => {
    expect(monthlyEquivalent(rupees(100), 'weekly')).toBe(43_333); // 433.33
    expect(monthlyEquivalent(rupees(10), 'daily')).toBe(30_417); // 304.17
    expect(monthlyEquivalent(rupees(999), 'monthly')).toBe(rupees(999));
  });
  it('rejects unknown frequency', () => {
    expect(() => monthlyEquivalent(100, 'hourly')).toThrow();
  });
});
