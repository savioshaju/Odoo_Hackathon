// Monthly recurring revenue helpers (rules table, Section 2):
//   yearly / 12,  weekly x 52 / 12,  daily x 365 / 12.   Rs 12,000 yearly = Rs 1,000 MRR.

import { assertPaise, mulDivRound } from './money.js';

export function monthlyEquivalent(amountPaise, frequency) {
  assertPaise(amountPaise, 'amount');
  switch (frequency) {
    case 'monthly':
      return amountPaise;
    case 'yearly':
      return mulDivRound(amountPaise, 1, 12);
    case 'weekly':
      return mulDivRound(amountPaise, 52, 12);
    case 'daily':
      return mulDivRound(amountPaise, 365, 12);
    default:
      throw new RangeError(`Unknown frequency "${frequency}"`);
  }
}
