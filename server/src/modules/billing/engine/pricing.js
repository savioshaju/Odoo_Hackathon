// Pricing engine: turns invoice lines and the discounts that apply into exact paise.
// Pure functions, no database, no clock.
//
// Order (rules table, Section 2):  line discounts -> whole-subscription discounts -> tax.
//
//   10 seats x Rs 2,560            = Rs 25,600.00
//   10 % off the product           = Rs 23,040.00
//   Rs 500 off the whole invoice   = Rs 22,540.00
//   GST 18 %: CGST 2,028.60 + SGST 2,028.60
//   Total                          = Rs 26,597.20
//
// Tax is rounded once per line on half the rate, so SGST always equals CGST and IGST is both together.
// A whole-subscription discount is split across lines (largest remainder) so the paise add up exactly.

import { assertPaise, formatINR, mulDivRound, pctOf, splitProportional, sum } from './money.js';

const SCOPE_RANK = { product: 0, subscription: 1 };

/** Same state -> CGST + SGST ("intra"); different state -> IGST ("inter"). Unknown state counts as same state. */
export function supplyType(customerState, companyState) {
  if (!customerState || !companyState) return 'intra';
  return String(customerState).trim().toUpperCase() === String(companyState).trim().toUpperCase() ? 'intra' : 'inter';
}

function checkLine(line, index) {
  const where = `lines[${index}]`;
  if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
    throw new RangeError(`${where}.quantity must be a whole number above 0`);
  }
  assertPaise(line.unitPrice, `${where}.unitPrice`);
  if (line.unitPrice < 0) throw new RangeError(`${where}.unitPrice must not be negative`);
  if (!Number.isInteger(line.taxRateBp) || line.taxRateBp < 0 || line.taxRateBp > 10000) {
    throw new RangeError(`${where}.taxRateBp must be 0..10000 (basis points, 1800 = 18 %)`);
  }
}

function normaliseDiscount(d) {
  if (d == null || typeof d !== 'object') throw new TypeError('discount must be an object');
  if (d.kind !== 'percent' && d.kind !== 'fixed') throw new RangeError(`discount ${d.id}: kind must be percent or fixed`);
  if (!(d.scope in SCOPE_RANK)) throw new RangeError(`discount ${d.id}: scope must be product or subscription`);
  assertPaise(d.value, `discount ${d.id} value`);
  if (d.value <= 0) throw new RangeError(`discount ${d.id}: value must be above 0`);
  if (d.kind === 'percent' && d.value > 10000) throw new RangeError(`discount ${d.id}: percent cannot exceed 100 %`);
  const productIds = d.productIds ?? [];
  if (d.scope === 'product' && productIds.length === 0) {
    throw new RangeError(`discount ${d.id}: a product discount needs at least one product`);
  }
  return {
    id: d.id,
    name: d.name ?? `Discount ${d.id}`,
    kind: d.kind,
    value: d.value,
    scope: d.scope,
    productIds,
    minAmount: d.minAmount ?? 0,
    minQuantity: d.minQuantity ?? 0,
  };
}

function describeDiscount(d) {
  const how = d.kind === 'percent' ? `${d.value / 100} % off` : `${formatINR(d.value)} off`;
  const where = d.scope === 'product' ? d.name : `${d.name} (whole subscription)`;
  return `${how}: ${where}`;
}

/**
 * @param {object} input
 * @param {Array<{productId, description?, quantity, unitPrice, taxRateBp}>} input.lines
 * @param {Array<{id, name?, kind, value, scope, productIds?, minAmount?, minQuantity?}>} input.discounts
 *        Discounts that are already inside their dates and have uses left. The engine decides
 *        whether each one applies (matching product, minimum purchase, minimum quantity).
 * @param {'intra'|'inter'} input.supply
 */
export function priceInvoice({ lines, discounts = [], supply = 'intra' }) {
  if (!Array.isArray(lines) || lines.length === 0) throw new RangeError('An invoice needs at least one line');
  if (supply !== 'intra' && supply !== 'inter') throw new RangeError('supply must be intra or inter');

  const rows = lines.map((line, i) => {
    checkLine(line, i);
    const gross = line.quantity * line.unitPrice;
    assertPaise(gross, `lines[${i}] gross`);
    return { ...line, gross, lineDiscount: 0, subDiscount: 0 };
  });

  const seen = new Set();
  const ordered = discounts.map(normaliseDiscount).sort((a, b) => SCOPE_RANK[a.scope] - SCOPE_RANK[b.scope] || a.id - b.id);
  for (const d of ordered) {
    if (seen.has(d.id)) throw new RangeError(`discount ${d.id} was given twice`);
    seen.add(d.id);
  }

  const applied = [];
  const skipped = [];
  const net = (l) => l.gross - l.lineDiscount - l.subDiscount;

  // 1. Line discounts (scope = product), each on the running net of its matching lines.
  for (const d of ordered.filter((x) => x.scope === 'product')) {
    const matching = rows.filter((l) => d.productIds.includes(l.productId));
    if (matching.length === 0) {
      skipped.push({ id: d.id, name: d.name, reason: 'no matching product on this invoice' });
      continue;
    }
    if (sum(matching.map((l) => l.gross)) < d.minAmount) {
      skipped.push({ id: d.id, name: d.name, reason: 'minimum purchase not reached' });
      continue;
    }
    if (sum(matching.map((l) => l.quantity)) < d.minQuantity) {
      skipped.push({ id: d.id, name: d.name, reason: 'minimum quantity not reached' });
      continue;
    }
    const nets = matching.map(net);
    const share =
      d.kind === 'percent'
        ? nets.map((n) => pctOf(n, d.value))
        : splitProportional(Math.min(d.value, sum(nets)), nets);
    const amount = sum(share);
    if (amount === 0) {
      skipped.push({ id: d.id, name: d.name, reason: 'worth nothing on this invoice' });
      continue;
    }
    matching.forEach((l, k) => {
      l.lineDiscount += share[k];
    });
    applied.push({
      id: d.id,
      name: d.name,
      scope: d.scope,
      kind: d.kind,
      value: d.value,
      amount,
      lines: matching.map((l, k) => ({ index: rows.indexOf(l), amount: share[k] })).filter((x) => x.amount > 0),
    });
  }

  // 2. Whole-subscription discounts, split across lines in proportion to what each line still costs.
  for (const d of ordered.filter((x) => x.scope === 'subscription')) {
    if (sum(rows.map((l) => l.gross)) < d.minAmount) {
      skipped.push({ id: d.id, name: d.name, reason: 'minimum purchase not reached' });
      continue;
    }
    if (sum(rows.map((l) => l.quantity)) < d.minQuantity) {
      skipped.push({ id: d.id, name: d.name, reason: 'minimum quantity not reached' });
      continue;
    }
    const nets = rows.map(net);
    const netTotal = sum(nets);
    const amount = d.kind === 'percent' ? pctOf(netTotal, d.value) : Math.min(d.value, netTotal);
    if (amount === 0) {
      skipped.push({ id: d.id, name: d.name, reason: 'worth nothing on this invoice' });
      continue;
    }
    const share = splitProportional(amount, nets);
    rows.forEach((l, i) => {
      l.subDiscount += share[i];
    });
    applied.push({
      id: d.id,
      name: d.name,
      scope: d.scope,
      kind: d.kind,
      value: d.value,
      amount,
      lines: share.map((a, index) => ({ index, amount: a })).filter((x) => x.amount > 0),
    });
  }

  // 3. Tax per line. Half the tax is rounded once; the other half is identical.
  const priced = rows.map((l) => {
    const taxable = net(l);
    const half = mulDivRound(taxable, l.taxRateBp, 20000);
    const cgst = supply === 'intra' ? half : 0;
    const sgst = supply === 'intra' ? half : 0;
    const igst = supply === 'inter' ? 2 * half : 0;
    const tax = cgst + sgst + igst;
    return { ...l, taxable, cgst, sgst, igst, tax, total: taxable + tax };
  });

  const totals = {
    gross: sum(priced.map((l) => l.gross)),
    lineDiscount: sum(priced.map((l) => l.lineDiscount)),
    subDiscount: sum(priced.map((l) => l.subDiscount)),
    taxable: sum(priced.map((l) => l.taxable)),
    cgst: sum(priced.map((l) => l.cgst)),
    sgst: sum(priced.map((l) => l.sgst)),
    igst: sum(priced.map((l) => l.igst)),
    tax: sum(priced.map((l) => l.tax)),
    total: sum(priced.map((l) => l.total)),
  };
  totals.discount = totals.lineDiscount + totals.subDiscount;

  return { supply, lines: priced, discountsApplied: applied, discountsSkipped: skipped, totals, story: buildStory(priced, applied, totals, supply) };
}

/** Step-by-step explanation saved on every invoice and shown on the invoice page. */
function buildStory(lines, applied, totals, supply) {
  const story = [{ kind: 'subtotal', label: 'Subtotal (quantity × price)', amount: totals.gross, running: totals.gross }];
  let running = totals.gross;
  for (const d of applied) {
    running -= d.amount;
    story.push({ kind: 'discount', label: describeDiscount(d), amount: -d.amount, running });
  }
  story.push({ kind: 'taxable', label: 'Taxable value', amount: totals.taxable, running: totals.taxable });
  running = totals.taxable;

  const byRate = new Map();
  for (const l of lines) {
    const entry = byRate.get(l.taxRateBp) ?? { cgst: 0, sgst: 0, igst: 0 };
    entry.cgst += l.cgst;
    entry.sgst += l.sgst;
    entry.igst += l.igst;
    byRate.set(l.taxRateBp, entry);
  }
  for (const [rate, t] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
    if (rate === 0) continue;
    const rows =
      supply === 'intra'
        ? [
            [`CGST ${rate / 200} %`, t.cgst],
            [`SGST ${rate / 200} %`, t.sgst],
          ]
        : [[`IGST ${rate / 100} %`, t.igst]];
    for (const [label, amount] of rows) {
      running += amount;
      story.push({ kind: 'tax', label, amount, running });
    }
  }
  story.push({ kind: 'total', label: 'Invoice total', amount: totals.total, running: totals.total });
  return story;
}
