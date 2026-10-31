import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { priceInvoice, supplyType } from '../../src/modules/billing/engine/pricing.js';
import { rupees, sum } from '../../src/modules/billing/engine/money.js';

const SEAT = 1; // product id used across tests
const seatLine = (over = {}) => ({ productId: SEAT, description: 'Odoo seat (brand variant)', quantity: 10, unitPrice: rupees(2560), taxRateBp: 1800, ...over });
const tenPercent = { id: 1, name: 'Volume 10 %', kind: 'percent', value: 1000, scope: 'product', productIds: [SEAT] };
const fiveHundredOff = { id: 2, name: 'Welcome Rs 500', kind: 'fixed', value: rupees(500), scope: 'subscription' };

describe('the plan\'s worked example', () => {
  const result = priceInvoice({ lines: [seatLine()], discounts: [tenPercent, fiveHundredOff], supply: 'intra' });

  it('variant Rs 2,000 + Rs 560 shows Rs 2,560 and 10 seats make Rs 25,600', () => {
    expect(rupees(2000) + rupees(560)).toBe(rupees(2560));
    expect(result.totals.gross).toBe(rupees(25600));
  });

  it('Rs 25,600 -> Rs 23,040 (10 % off) -> Rs 22,540 (Rs 500 off) -> then GST', () => {
    const afterLine = result.totals.gross - result.totals.lineDiscount;
    expect(afterLine).toBe(rupees(23040));
    expect(afterLine - result.totals.subDiscount).toBe(rupees(22540));
    expect(result.totals.taxable).toBe(rupees(22540));
  });

  it('CGST Rs 2,028.60 + SGST Rs 2,028.60 -> total Rs 26,597.20', () => {
    expect(result.totals.cgst).toBe(rupees('2028.60'));
    expect(result.totals.sgst).toBe(rupees('2028.60'));
    expect(result.totals.igst).toBe(0);
    expect(result.totals.total).toBe(rupees('26597.20'));
  });

  it('tells the price story step by step', () => {
    expect(result.story.map((s) => [s.kind, s.amount])).toEqual([
      ['subtotal', rupees(25600)],
      ['discount', -rupees(2560)],
      ['discount', -rupees(500)],
      ['taxable', rupees(22540)],
      ['tax', rupees('2028.60')],
      ['tax', rupees('2028.60')],
      ['total', rupees('26597.20')],
    ]);
    expect(result.story.at(-1).running).toBe(result.totals.total);
    expect(result.story[1].label).toBe('10 % off: Volume 10 %');
    expect(result.story[4].label).toBe('CGST 9 %');
  });

  it('records which discounts were used', () => {
    expect(result.discountsApplied.map((d) => [d.id, d.scope, d.amount])).toEqual([
      [1, 'product', rupees(2560)],
      [2, 'subscription', rupees(500)],
    ]);
  });
});

describe('GST', () => {
  it('Rs 2,560 at 18 % -> Rs 230.40 + Rs 230.40 within the state', () => {
    const r = priceInvoice({ lines: [seatLine({ quantity: 1 })], supply: 'intra' });
    expect(r.totals.cgst).toBe(rupees('230.40'));
    expect(r.totals.sgst).toBe(rupees('230.40'));
    expect(r.totals.igst).toBe(0);
    expect(r.totals.total).toBe(rupees(2560) + rupees('460.80'));
  });

  it('...or Rs 460.80 IGST between states', () => {
    const r = priceInvoice({ lines: [seatLine({ quantity: 1 })], supply: 'inter' });
    expect(r.totals.igst).toBe(rupees('460.80'));
    expect(r.totals.cgst).toBe(0);
    expect(r.totals.sgst).toBe(0);
  });

  it('SGST always equals CGST and IGST is both together, even with odd paise', () => {
    const line = seatLine({ quantity: 1, unitPrice: 12_345, taxRateBp: 1800 }); // Rs 123.45
    const intra = priceInvoice({ lines: [line], supply: 'intra' });
    const inter = priceInvoice({ lines: [line], supply: 'inter' });
    expect(intra.totals.cgst).toBe(intra.totals.sgst);
    expect(inter.totals.igst).toBe(intra.totals.cgst + intra.totals.sgst);
  });

  it('rounds each line once (not the invoice total)', () => {
    // two lines of Rs 0.05 at 18 %: each line's half tax = 0.45 paise -> 0; the invoice stays exact to the line
    const lines = [seatLine({ quantity: 1, unitPrice: 5 }), seatLine({ quantity: 1, unitPrice: 5 })];
    const r = priceInvoice({ lines, supply: 'intra' });
    expect(r.lines.map((l) => l.cgst)).toEqual([0, 0]);
    expect(r.totals.tax).toBe(0);
  });

  it('decides intra or inter from the states', () => {
    expect(supplyType('MH', 'MH')).toBe('intra');
    expect(supplyType('mh ', 'MH')).toBe('intra');
    expect(supplyType('KA', 'MH')).toBe('inter');
    expect(supplyType(null, 'MH')).toBe('intra');
  });

  it('keeps separate tax rows for lines with different rates', () => {
    const r = priceInvoice({
      lines: [seatLine({ productId: 1, quantity: 1, unitPrice: rupees(1000), taxRateBp: 1800 }), seatLine({ productId: 2, quantity: 1, unitPrice: rupees(1000), taxRateBp: 500 })],
      supply: 'intra',
    });
    expect(r.story.filter((s) => s.kind === 'tax').map((s) => [s.label, s.amount])).toEqual([
      ['CGST 2.5 %', rupees(25)],
      ['SGST 2.5 %', rupees(25)],
      ['CGST 9 %', rupees(90)],
      ['SGST 9 %', rupees(90)],
    ]);
  });
});

describe('discount rules', () => {
  it('order: line discounts first, then whole-subscription, then tax (never the other way round)', () => {
    // 10 % line discount then Rs 500 off  !=  Rs 500 off then 10 %
    const r = priceInvoice({ lines: [seatLine()], discounts: [tenPercent, fiveHundredOff] });
    const wrongOrder = rupees(25600) - rupees(500) - Math.round((rupees(25600) - rupees(500)) * 0.1);
    expect(r.totals.taxable).not.toBe(wrongOrder);
  });

  it('a product discount only touches matching lines', () => {
    const r = priceInvoice({ lines: [seatLine(), seatLine({ productId: 7, description: 'Add-on', quantity: 1, unitPrice: rupees(1000) })], discounts: [tenPercent] });
    expect(r.lines[0].lineDiscount).toBe(rupees(2560));
    expect(r.lines[1].lineDiscount).toBe(0);
  });

  it('skips a discount whose product is not on the invoice, and says why', () => {
    const r = priceInvoice({ lines: [seatLine({ productId: 9 })], discounts: [tenPercent] });
    expect(r.discountsApplied).toEqual([]);
    expect(r.discountsSkipped).toEqual([{ id: 1, name: 'Volume 10 %', reason: 'no matching product on this invoice' }]);
  });

  it('minimum purchase is measured on matching lines before any discount', () => {
    const d = { ...tenPercent, minAmount: rupees(25600) };
    expect(priceInvoice({ lines: [seatLine()], discounts: [d] }).discountsApplied).toHaveLength(1);
    expect(priceInvoice({ lines: [seatLine({ quantity: 9 })], discounts: [d] }).discountsSkipped[0].reason).toBe('minimum purchase not reached');
  });

  it('minimum quantity is respected', () => {
    const d = { ...tenPercent, minQuantity: 10 };
    expect(priceInvoice({ lines: [seatLine({ quantity: 10 })], discounts: [d] }).discountsApplied).toHaveLength(1);
    expect(priceInvoice({ lines: [seatLine({ quantity: 9 })], discounts: [d] }).discountsSkipped[0].reason).toBe('minimum quantity not reached');
  });

  it('a fixed discount can never push the invoice below zero', () => {
    const r = priceInvoice({ lines: [seatLine({ quantity: 1, unitPrice: rupees(300) })], discounts: [fiveHundredOff] });
    expect(r.totals.taxable).toBe(0);
    expect(r.totals.total).toBe(0);
    expect(r.discountsApplied[0].amount).toBe(rupees(300));
  });

  it('a discount that is worth nothing is not counted as used', () => {
    const free = seatLine({ unitPrice: 0 });
    const r = priceInvoice({ lines: [free], discounts: [tenPercent, fiveHundredOff] });
    expect(r.discountsApplied).toEqual([]);
    expect(r.discountsSkipped).toHaveLength(2);
  });

  it('two percentage discounts stack on the running amount (10 % then 10 % = 19 %)', () => {
    const second = { ...tenPercent, id: 3, name: 'Loyalty 10 %' };
    const r = priceInvoice({ lines: [seatLine()], discounts: [tenPercent, second] });
    expect(r.totals.taxable).toBe(rupees(25600) - rupees(2560) - rupees(2304));
  });

  it('whole-subscription discount is split so the paise add up exactly', () => {
    const lines = [seatLine({ quantity: 1, unitPrice: 33_333 }), seatLine({ productId: 2, quantity: 1, unitPrice: 33_333 }), seatLine({ productId: 3, quantity: 1, unitPrice: 33_334 })];
    const r = priceInvoice({ lines, discounts: [{ id: 5, name: 'Rs 1', kind: 'fixed', value: 100, scope: 'subscription' }] });
    expect(sum(r.lines.map((l) => l.subDiscount))).toBe(100);
    expect(r.totals.subDiscount).toBe(100);
  });

  it('refuses a discount offered twice and bad input', () => {
    expect(() => priceInvoice({ lines: [seatLine()], discounts: [tenPercent, tenPercent] })).toThrow(/twice/);
    expect(() => priceInvoice({ lines: [] })).toThrow();
    expect(() => priceInvoice({ lines: [seatLine({ quantity: 0 })] })).toThrow();
    expect(() => priceInvoice({ lines: [seatLine({ unitPrice: 12.5 })] })).toThrow();
    expect(() => priceInvoice({ lines: [seatLine()], discounts: [{ ...tenPercent, value: 10001 }] })).toThrow();
  });
});

describe('properties: the maths always balances', () => {
  const lineArb = fc.record({
    productId: fc.integer({ min: 1, max: 4 }),
    description: fc.constant('line'),
    quantity: fc.integer({ min: 1, max: 500 }),
    unitPrice: fc.integer({ min: 0, max: 50_000_000 }),
    taxRateBp: fc.constantFrom(0, 500, 1200, 1800, 2800, 25),
  });
  const discountArb = (id) =>
    fc.record({
      id: fc.constant(id),
      name: fc.constant(`D${id}`),
      kind: fc.constantFrom('percent', 'fixed'),
      scope: fc.constantFrom('product', 'subscription'),
      productIds: fc.uniqueArray(fc.integer({ min: 1, max: 4 }), { minLength: 1, maxLength: 3 }),
      percent: fc.integer({ min: 1, max: 10000 }),
      fixed: fc.integer({ min: 1, max: 100_000_000 }),
      minAmount: fc.integer({ min: 0, max: 100_000 }),
      minQuantity: fc.integer({ min: 0, max: 20 }),
    }).map((d) => ({
      id: d.id,
      name: d.name,
      kind: d.kind,
      scope: d.scope,
      productIds: d.productIds,
      value: d.kind === 'percent' ? d.percent : d.fixed,
      minAmount: d.minAmount,
      minQuantity: d.minQuantity,
    }));
  const discountsArb = fc.integer({ min: 0, max: 4 }).chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => discountArb(i + 1))));

  it('every line and the invoice balance, for any lines and discounts', () => {
    fc.assert(
      fc.property(fc.array(lineArb, { minLength: 1, maxLength: 8 }), discountsArb, fc.constantFrom('intra', 'inter'), (lines, discounts, supply) => {
        const r = priceInvoice({ lines, discounts, supply });
        for (const l of r.lines) {
          expect(l.gross).toBe(l.quantity * l.unitPrice);
          expect(l.taxable).toBe(l.gross - l.lineDiscount - l.subDiscount);
          expect(l.taxable).toBeGreaterThanOrEqual(0);
          expect(l.total).toBe(l.taxable + l.cgst + l.sgst + l.igst);
          expect(l.cgst).toBe(l.sgst);
          if (supply === 'intra') expect(l.igst).toBe(0);
          else expect(l.cgst + l.sgst).toBe(0);
        }
        const t = r.totals;
        expect(t.gross).toBe(sum(r.lines.map((l) => l.gross)));
        expect(t.taxable).toBe(t.gross - t.discount);
        expect(t.total).toBe(t.taxable + t.cgst + t.sgst + t.igst);
        expect(t.tax).toBe(t.cgst + t.sgst + t.igst);
        expect(t.total).toBe(sum(r.lines.map((l) => l.total)));
        // each applied discount's amount is exactly the sum of its per-line parts
        for (const d of r.discountsApplied) {
          expect(d.amount).toBe(sum(d.lines.map((x) => x.amount)));
          expect(d.amount).toBeGreaterThan(0);
        }
        expect(t.discount).toBe(sum(r.discountsApplied.map((d) => d.amount)));
        // the price story ends on the invoice total and each step follows from the one before
        expect(r.story.at(-1).running).toBe(t.total);
        // used + skipped = offered
        expect(r.discountsApplied.length + r.discountsSkipped.length).toBe(discounts.length);
      }),
      { numRuns: 1500 },
    );
  });

  it('IGST equals CGST + SGST for the same lines', () => {
    fc.assert(
      fc.property(fc.array(lineArb, { minLength: 1, maxLength: 6 }), discountsArb, (lines, discounts) => {
        const intra = priceInvoice({ lines, discounts, supply: 'intra' });
        const inter = priceInvoice({ lines, discounts, supply: 'inter' });
        expect(inter.totals.igst).toBe(intra.totals.cgst + intra.totals.sgst);
        expect(inter.totals.total).toBe(intra.totals.total);
      }),
      { numRuns: 500 },
    );
  });

  it('the same input always gives the same output (repeatable)', () => {
    fc.assert(
      fc.property(fc.array(lineArb, { minLength: 1, maxLength: 6 }), discountsArb, (lines, discounts) => {
        const a = priceInvoice({ lines, discounts });
        const b = priceInvoice({ lines: structuredClone(lines), discounts: structuredClone([...discounts].reverse()) });
        expect(b.totals).toEqual(a.totals);
      }),
      { numRuns: 300 },
    );
  });
});
