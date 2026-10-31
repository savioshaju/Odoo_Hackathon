import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  addDays,
  addMonths,
  daysBetween,
  daysInMonth,
  dueDate,
  duePeriods,
  isActiveOn,
  isOverdue,
  isValidDate,
  lastPeriodNo,
  listPeriods,
  periodEnd,
  periodStart,
  todayIST,
  daysOverdue,
} from '../../src/modules/billing/engine/dates.js';

const starts = (start, freq, count) => Array.from({ length: count }, (_, n) => periodStart(start, freq, n));

describe('monthly periods come from the original start date', () => {
  it('31 Jan -> 28 Feb -> 31 Mar (the plan\'s required example)', () => {
    expect(starts('2026-01-31', 'monthly', 4)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('leap year: 31 Jan -> 29 Feb -> 31 Mar -> 30 Apr', () => {
    expect(starts('2028-01-31', 'monthly', 4)).toEqual(['2028-01-31', '2028-02-29', '2028-03-31', '2028-04-30']);
  });

  it('30 Jan -> 28 Feb -> 30 Mar', () => {
    expect(starts('2026-01-30', 'monthly', 3)).toEqual(['2026-01-30', '2026-02-28', '2026-03-30']);
  });

  it('monthly plan starting 1 Dec is billed on 1 Dec, then 1 Jan', () => {
    expect(starts('2026-12-01', 'monthly', 2)).toEqual(['2026-12-01', '2027-01-01']);
  });

  it('periods are contiguous: each ends the day before the next starts', () => {
    expect(periodEnd('2026-01-31', 'monthly', 0)).toBe('2026-02-27');
    expect(periodEnd('2026-01-31', 'monthly', 1)).toBe('2026-03-30');
  });

  it('rolls over the year', () => {
    expect(starts('2026-11-15', 'monthly', 4)).toEqual(['2026-11-15', '2026-12-15', '2027-01-15', '2027-02-15']);
  });
});

describe('yearly, weekly and daily', () => {
  it('29 Feb yearly plan lands on 28 Feb in normal years and 29 Feb in leap years', () => {
    expect(starts('2024-02-29', 'yearly', 5)).toEqual(['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
  });
  it('weekly adds 7 days', () => {
    expect(starts('2026-02-24', 'weekly', 3)).toEqual(['2026-02-24', '2026-03-03', '2026-03-10']);
  });
  it('daily adds 1 day across month end and leap day', () => {
    expect(starts('2028-02-28', 'daily', 3)).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
  });
  it('rejects unknown frequency and bad input', () => {
    expect(() => periodStart('2026-01-01', 'fortnightly', 0)).toThrow();
    expect(() => periodStart('2026-02-30', 'monthly', 0)).toThrow();
    expect(() => periodStart('2026-01-01', 'monthly', -1)).toThrow();
  });
});

describe('date helpers', () => {
  it('validates real calendar dates only', () => {
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('1/2/2026')).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });
  it('adds days and months', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-01-15', -2)).toBe('2025-11-15');
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(daysInMonth(2028, 2)).toBe(29);
  });
});

describe('India time: plain dates, no "yesterday at 1 AM" bugs', () => {
  it('uses the India calendar day', () => {
    expect(todayIST(new Date('2026-12-31T18:29:59Z'))).toBe('2026-12-31'); // 23:59:59 IST
    expect(todayIST(new Date('2026-12-31T18:30:00Z'))).toBe('2027-01-01'); // 00:00:00 IST
    expect(todayIST(new Date('2026-12-31T19:00:00Z'))).toBe('2027-01-01'); // 00:30 IST
    expect(todayIST(new Date('2026-03-01T00:30:00Z'))).toBe('2026-03-01'); // 06:00 IST
  });
});

describe('billing time and catch-up', () => {
  const always = (from) => [{ from, to: null }];

  it('nothing is due before the start date', () => {
    expect(duePeriods({ startDate: '2026-12-01', frequency: 'monthly', activeRanges: always('2026-12-01'), today: '2026-11-30' })).toEqual([]);
  });

  it('bills on the start day itself', () => {
    const due = duePeriods({ startDate: '2026-12-01', frequency: 'monthly', activeRanges: always('2026-12-01'), today: '2026-12-01' });
    expect(due.map((p) => p.start)).toEqual(['2026-12-01']);
  });

  it('catches up every missed period', () => {
    const due = duePeriods({ startDate: '2026-01-01', frequency: 'monthly', activeRanges: always('2026-01-01'), today: '2026-04-01' });
    expect(due.map((p) => p.start)).toEqual(['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01']);
  });

  it('paused 10 Mar - 20 Apr -> invoices for 1 Mar and 1 May only (the plan\'s example)', () => {
    const due = duePeriods({
      startDate: '2026-03-01',
      frequency: 'monthly',
      activeRanges: [
        { from: '2026-03-01', to: '2026-03-09' },
        { from: '2026-04-21', to: null },
      ],
      today: '2026-05-01',
    });
    expect(due.map((p) => p.start)).toEqual(['2026-03-01', '2026-05-01']);
  });

  it('explains why a period is skipped', () => {
    const all = listPeriods({
      startDate: '2026-03-01',
      frequency: 'monthly',
      activeRanges: [
        { from: '2026-03-01', to: '2026-03-09' },
        { from: '2026-04-21', to: null },
      ],
      today: '2026-05-01',
    });
    expect(all.map((p) => [p.start, p.billable, p.reason])).toEqual([
      ['2026-03-01', true, null],
      ['2026-04-01', false, 'not active'],
      ['2026-05-01', true, null],
    ]);
  });

  it('a period starting on or after the expiry date is not billed', () => {
    const due = duePeriods({ startDate: '2026-10-01', frequency: 'monthly', expiryDate: '2027-01-01', activeRanges: always('2026-10-01'), today: '2027-03-01' });
    expect(due.map((p) => p.start)).toEqual(['2026-10-01', '2026-11-01', '2026-12-01']);
  });

  it('a closed subscription stops billing after its last active day', () => {
    const due = duePeriods({
      startDate: '2026-01-01',
      frequency: 'monthly',
      activeRanges: [{ from: '2026-01-01', to: '2026-02-15' }],
      today: '2026-06-01',
    });
    expect(due.map((p) => p.start)).toEqual(['2026-01-01', '2026-02-01']);
  });

  it('isActiveOn handles open and closed ranges (inclusive)', () => {
    const r = [{ from: '2026-01-01', to: '2026-01-31' }, { from: '2026-03-01', to: null }];
    expect(isActiveOn(r, '2026-01-31')).toBe(true);
    expect(isActiveOn(r, '2026-02-01')).toBe(false);
    expect(isActiveOn(r, '2030-01-01')).toBe(true);
  });
});

describe('overdue is worked out from dates', () => {
  it('overdue starts the day after the due date', () => {
    expect(isOverdue('2026-12-16', '2026-12-16')).toBe(false);
    expect(isOverdue('2026-12-16', '2026-12-17')).toBe(true);
  });
  it('a 16 Dec invoice shows overdue the moment the date jumps to 20 Dec', () => {
    expect(isOverdue('2026-12-16', '2026-12-20')).toBe(true);
    expect(daysOverdue('2026-12-16', '2026-12-20')).toBe(4);
    expect(daysOverdue('2026-12-16', '2026-12-10')).toBe(0);
  });
  it('due date is invoice date plus payment terms', () => {
    expect(dueDate('2026-01-31', 15)).toBe('2026-02-15');
    expect(dueDate('2026-12-20', 0)).toBe('2026-12-20');
    expect(() => dueDate('2026-12-20', -1)).toThrow();
  });
});

describe('properties over random subscriptions', () => {
  const freq = fc.constantFrom('daily', 'weekly', 'monthly', 'yearly');
  const startDate = fc
    .integer({ min: 0, max: 365 * 12 })
    .map((n) => addDays('2019-01-01', n)); // spans several leap years

  it('periods never overlap and never leave a gap', () => {
    fc.assert(
      fc.property(startDate, freq, fc.integer({ min: 0, max: 40 }), (start, f, count) => {
        for (let n = 0; n < count; n += 1) {
          const thisStart = periodStart(start, f, n);
          const thisEnd = periodEnd(start, f, n);
          const nextStart = periodStart(start, f, n + 1);
          expect(thisEnd >= thisStart).toBe(true);
          expect(addDays(thisEnd, 1)).toBe(nextStart);
        }
      }),
      { numRuns: 400 },
    );
  });

  it('monthly day-of-month is the original day, clamped to the month length', () => {
    fc.assert(
      fc.property(startDate, fc.integer({ min: 0, max: 60 }), (start, n) => {
        const s = periodStart(start, 'monthly', n);
        const [sy, sm, sd] = start.split('-').map(Number);
        const [y, m, d] = s.split('-').map(Number);
        expect((y - sy) * 12 + (m - sm)).toBe(n);
        expect(d).toBe(Math.min(sd, daysInMonth(y, m)));
      }),
      { numRuns: 400 },
    );
  });

  it('lastPeriodNo is the exact boundary', () => {
    fc.assert(
      fc.property(startDate, freq, fc.integer({ min: -30, max: 2000 }), (start, f, offset) => {
        const today = addDays(start, offset);
        const n = lastPeriodNo(start, f, today);
        if (offset < 0) {
          expect(n).toBe(-1);
          return;
        }
        expect(periodStart(start, f, n) <= today).toBe(true);
        expect(periodStart(start, f, n + 1) > today).toBe(true);
      }),
      { numRuns: 500 },
    );
  });

  it('due periods are in order, unique and exactly cover the active days that start inside them', () => {
    fc.assert(
      fc.property(startDate, freq, fc.integer({ min: 0, max: 900 }), (start, f, span) => {
        const today = addDays(start, span);
        const periods = duePeriods({ startDate: start, frequency: f, activeRanges: [{ from: start, to: null }], today });
        const starts = periods.map((p) => p.start);
        expect(new Set(starts).size).toBe(starts.length);
        expect([...starts].sort()).toEqual(starts);
        expect(periods.length).toBe(lastPeriodNo(start, f, today) + 1);
      }),
      { numRuns: 300 },
    );
  });
});
