// The database refuses wrong money. These tests try to break every guard in query.sql PART 1.
// Needs PostgreSQL (the test database); no other module's code.

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { db } from '../../src/db.js';
import { useCleanDatabase } from '../helpers/testDb.js';
import { addDays, lastPeriodNo, periodStart } from '../../src/modules/billing/engine/dates.js';

useCleanDatabase();

// Rs 1,000 + 18 % GST (Rs 90 CGST + Rs 90 SGST) = Rs 1,180, all in paise
const GOOD = { seq: 1, sub: 1, period: '2026-01-01', status: 'draft', gross: 100_000, ld: 0, sd: 0, taxable: 100_000, cgst: 9_000, sgst: 9_000, igst: 0, total: 118_000, paid: 0, supply: 'intra' };

const insertInvoice = (over = {}) => {
  const v = { ...GOOD, ...over };
  return db.one('test_insert_invoice', [v.seq, v.sub, v.period, v.status, v.gross, v.ld, v.sd, v.taxable, v.cgst, v.sgst, v.igst, v.total, v.paid, v.supply]);
};
const insertLine = (invoiceId, over = {}) => {
  const v = { no: 1, qty: 2, price: 50_000, gross: 100_000, ld: 0, sd: 0, taxable: 100_000, cgst: 9_000, sgst: 9_000, igst: 0, total: 118_000, ...over };
  return db.one('test_insert_line', [invoiceId, v.no, v.qty, v.price, v.gross, v.ld, v.sd, v.taxable, v.cgst, v.sgst, v.igst, v.total]);
};

const violates = (promise, code, constraint) => expect(promise).rejects.toMatchObject(constraint ? { code, constraint } : { code });

describe('nothing billed twice', () => {
  it('accepts one invoice per subscription and period', async () => {
    await insertInvoice();
    await insertInvoice({ seq: 2, period: '2026-02-01' }); // next period
    await insertInvoice({ seq: 3, sub: 2 }); // other subscription
  });

  it('refuses a second live invoice for the same period, whatever its status', async () => {
    await insertInvoice();
    await violates(insertInvoice({ seq: 2 }), '23505', 'invoices_one_live_per_period');
    await violates(insertInvoice({ seq: 2, status: 'confirmed', paid: 0 }), '23505', 'invoices_one_live_per_period');
  });

  it('a cancelled invoice keeps its number and frees the period to be billed again', async () => {
    await insertInvoice({ seq: 1, status: 'cancelled' });
    await insertInvoice({ seq: 2 }); // re-bill the same period
    await violates(insertInvoice({ seq: 3 }), '23505', 'invoices_one_live_per_period');
    const numbers = await db.rows('test_invoice_numbers');
    expect(numbers.map((r) => [r.number, r.status])).toEqual([
      ['INV-000001', 'cancelled'],
      ['INV-000002', 'draft'],
    ]);
  });
});

describe('no gaps and no reuse of invoice numbers', () => {
  it('refuses a repeated number', async () => {
    await insertInvoice({ seq: 7 });
    await violates(insertInvoice({ seq: 7, sub: 9 }), '23505');
  });
  it('refuses number 0', async () => {
    await violates(insertInvoice({ seq: 0 }), '23514');
  });
});

describe('the invoice header always adds up', () => {
  it('accepts a correct invoice, with GST within the state', async () => {
    await insertInvoice();
  });
  it('accepts IGST between states (both halves together, CGST and SGST zero)', async () => {
    await insertInvoice({ supply: 'inter', cgst: 0, sgst: 0, igst: 18_000, total: 118_000 });
  });
  it('refuses a total that is not taxable + tax', async () => {
    await violates(insertInvoice({ total: 118_001 }), '23514', 'invoices_total_ok');
  });
  it('refuses taxable that is not gross - discounts', async () => {
    await violates(insertInvoice({ ld: 100, taxable: 100_000, total: 118_000 }), '23514', 'invoices_taxable_ok');
  });
  it('accepts a discounted invoice that balances', async () => {
    await insertInvoice({ ld: 10_000, sd: 5_000, taxable: 85_000, cgst: 7_650, sgst: 7_650, total: 100_300 });
  });
  it('refuses SGST different from CGST', async () => {
    await violates(insertInvoice({ cgst: 9_001, sgst: 8_999 }), '23514', 'invoices_gst_split_ok');
  });
  it('refuses IGST on an in-state invoice and CGST on an out-of-state one', async () => {
    await violates(insertInvoice({ cgst: 0, sgst: 0, igst: 18_000 }), '23514', 'invoices_gst_split_ok');
    await violates(insertInvoice({ supply: 'inter' }), '23514', 'invoices_gst_split_ok');
  });
  it('refuses negative amounts', async () => {
    await violates(insertInvoice({ gross: -1, taxable: -1, cgst: 0, sgst: 0, total: -1 }), '23514');
  });
  it('refuses an unknown status or supply type', async () => {
    await violates(insertInvoice({ status: 'bogus' }), '23514', 'invoices_status_ok');
    await violates(insertInvoice({ supply: 'abroad' }), '23514'); // also breaks the GST split check, so only the code is stable
  });
});

describe('paid never exceeds the total, and status agrees with the money', () => {
  it('a confirmed invoice with part payment is fine', async () => {
    await insertInvoice({ status: 'confirmed', paid: 50_000 });
  });
  it('refuses paid above total', async () => {
    await violates(insertInvoice({ status: 'confirmed', paid: 118_001 }), '23514');
    await violates(insertInvoice({ status: 'paid', paid: 118_001 }), '23514');
  });
  it('"paid" means fully paid', async () => {
    await insertInvoice({ status: 'paid', paid: 118_000 });
    await violates(insertInvoice({ seq: 2, period: '2026-02-01', status: 'paid', paid: 100 }), '23514', 'invoices_status_paid_ok');
  });
  it('a fully paid invoice cannot stay "confirmed"', async () => {
    await violates(insertInvoice({ status: 'confirmed', paid: 118_000 }), '23514', 'invoices_status_paid_ok');
  });
  it('drafts and cancelled invoices carry no payment', async () => {
    await violates(insertInvoice({ status: 'draft', paid: 100 }), '23514', 'invoices_status_paid_ok');
    await violates(insertInvoice({ status: 'cancelled', paid: 100 }), '23514', 'invoices_status_paid_ok');
  });
  it('a zero-total invoice goes straight to Paid, never "confirmed"', async () => {
    const zero = { gross: 0, taxable: 0, cgst: 0, sgst: 0, total: 0 };
    await insertInvoice({ ...zero, status: 'paid', paid: 0 });
    await violates(insertInvoice({ ...zero, seq: 2, period: '2026-02-01', status: 'confirmed', paid: 0 }), '23514', 'invoices_status_paid_ok');
  });
});

describe('invoice lines balance too', () => {
  it('accepts a correct line', async () => {
    const { id } = await insertInvoice();
    await insertLine(id);
  });
  it('refuses gross that is not quantity x unit price', async () => {
    const { id } = await insertInvoice();
    await violates(insertLine(id, { gross: 100_001, taxable: 100_001, total: 118_001 }), '23514', 'invoice_lines_gross_ok');
  });
  it('refuses taxable that is not gross - discounts', async () => {
    const { id } = await insertInvoice();
    await violates(insertLine(id, { taxable: 99_999, total: 117_999 }), '23514', 'invoice_lines_taxable_ok');
  });
  it('refuses a total that is not taxable + tax', async () => {
    const { id } = await insertInvoice();
    await violates(insertLine(id, { total: 118_100 }), '23514', 'invoice_lines_total_ok');
  });
  it('refuses SGST different from CGST, and CGST together with IGST', async () => {
    const { id } = await insertInvoice();
    await violates(insertLine(id, { cgst: 9_001, sgst: 8_999 }), '23514', 'invoice_lines_gst_ok');
    await violates(insertLine(id, { igst: 100, total: 118_100 }), '23514', 'invoice_lines_gst_ok');
  });
  it('refuses a repeated line number on the same invoice and quantity 0', async () => {
    const { id } = await insertInvoice();
    await insertLine(id);
    await violates(insertLine(id), '23505');
    await violates(insertLine(id, { no: 2, qty: 0, gross: 0, taxable: 0, cgst: 0, sgst: 0, total: 0 }), '23514');
  });
  it('lines disappear with their invoice, and a line needs an invoice', async () => {
    await violates(insertLine(999_999), '23503');
  });
});

describe('payments', () => {
  it('accepts every method in the plan', async () => {
    const { id } = await insertInvoice({ status: 'confirmed' });
    for (const method of ['cash', 'upi', 'card', 'bank_transfer', 'cheque']) {
      await db.one('test_insert_payment', [id, method, 100]);
    }
  });
  it('refuses unknown methods, zero or negative amounts, and a missing invoice', async () => {
    const { id } = await insertInvoice({ status: 'confirmed' });
    await violates(db.one('test_insert_payment', [id, 'bitcoin', 100]), '23514', 'payments_method_ok');
    await violates(db.one('test_insert_payment', [id, 'cash', 0]), '23514');
    await violates(db.one('test_insert_payment', [id, 'cash', -5]), '23514');
    await violates(db.one('test_insert_payment', [999_999, 'cash', 100]), '23503');
  });
});

describe('transactions', () => {
  it('rolls back everything when the function throws', async () => {
    await expect(
      db.tx(async (t) => {
        await t.one('test_insert_invoice', [1, 1, '2026-01-01', 'draft', 100_000, 0, 0, 100_000, 9_000, 9_000, 0, 118_000, 0, 'intra']);
        throw new Error('stop');
      }),
    ).rejects.toThrow('stop');
    await insertInvoice(); // number 1 is free again: the rolled-back insert left nothing behind
  });

  it('{ rollback: true } returns the result but saves nothing (dry run)', async () => {
    const result = await db.tx(async (t) => t.one('test_insert_invoice', [1, 1, '2026-01-01', 'draft', 100_000, 0, 0, 100_000, 9_000, 9_000, 0, 118_000, 0, 'intra']), { rollback: true });
    expect(result.id).toBeGreaterThan(0);
    await insertInvoice(); // still free
  });

  it('commits when the function returns', async () => {
    await db.tx(async (t) => t.one('test_insert_invoice', [5, 1, '2026-01-01', 'draft', 100_000, 0, 0, 100_000, 9_000, 9_000, 0, 118_000, 0, 'intra']));
    await violates(insertInvoice({ seq: 5, sub: 2 }), '23505'); // number 5 is taken
  });

  it('keeps the pool healthy after a failed query inside a transaction', async () => {
    await expect(db.tx(async (t) => t.one('test_insert_invoice', [1, 1, '2026-01-01', 'bogus', 0, 0, 0, 0, 0, 0, 0, 0, 0, 'intra']))).rejects.toMatchObject({ code: '23514' });
    expect((await db.one('db_ping')).ok).toBe(1);
  });
});

describe('values come back safe', () => {
  it('dates are plain strings, money is a number', async () => {
    await insertInvoice({ gross: 123_456_789_00, taxable: 123_456_789_00, cgst: 0, sgst: 0, total: 123_456_789_00, period: '2026-03-31' });
    const [row] = await db.rows('test_period_start', ['2026-03-31', 'daily', 0]);
    expect(row.d).toBe('2026-03-31');
    expect(typeof row.d).toBe('string');
  });
});

describe('SQL and JavaScript agree on billing periods', () => {
  it('31 Jan -> 28 Feb -> 31 Mar in the database too', async () => {
    const sql = [];
    for (let n = 0; n < 4; n += 1) sql.push((await db.one('test_period_start', ['2026-01-31', 'monthly', n])).d);
    expect(sql).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('29 Feb yearly, in the database', async () => {
    const sql = [];
    for (let n = 0; n < 5; n += 1) sql.push((await db.one('test_period_start', ['2024-02-29', 'yearly', n])).d);
    expect(sql).toEqual(['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
  });

  const freq = fc.constantFrom('daily', 'weekly', 'monthly', 'yearly');
  const start = fc.integer({ min: 0, max: 365 * 12 }).map((n) => addDays('2019-01-01', n));

  it('period_start matches the JavaScript engine on random subscriptions', async () => {
    await fc.assert(
      fc.asyncProperty(start, freq, fc.integer({ min: 0, max: 60 }), async (s, f, n) => {
        expect((await db.one('test_period_start', [s, f, n])).d).toBe(periodStart(s, f, n));
      }),
      { numRuns: 400 },
    );
  });

  it('last_period_no matches the JavaScript engine on random dates', async () => {
    await fc.assert(
      fc.asyncProperty(start, freq, fc.integer({ min: -20, max: 1500 }), async (s, f, offset) => {
        const d = addDays(s, offset);
        expect((await db.one('test_last_period_no', [s, f, d])).n).toBe(lastPeriodNo(s, f, d));
      }),
      { numRuns: 400 },
    );
  });
});
