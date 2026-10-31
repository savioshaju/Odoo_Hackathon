// Which lines and discounts count for one billing period. Pure functions.
//
// Everything is judged on the period START date, so billing late gives the same invoice as billing on time.

/**
 * A line is billed when it was in force on the period start.
 * startDate is the first day it applies, endDate (optional) the last day it applies.
 * Add-on switched on 18 Dec -> first billed in the period starting 1 Jan (mid-period changes wait).
 */
export function linesForPeriod(lines, periodStart) {
  return lines.filter((l) => l.startDate <= periodStart && (l.endDate == null || l.endDate >= periodStart));
}

/** The discount's start/end dates (both optional, inclusive) contain the period start. */
export function discountWindowOpen(discount, periodStart) {
  return (
    (discount.startDate == null || discount.startDate <= periodStart) &&
    (discount.endDate == null || periodStart <= discount.endDate)
  );
}

/** One use per invoice. A discount with no limit always has room. */
export function discountHasRoom(discount, usedCount) {
  return discount.usageLimit == null || usedCount < discount.usageLimit;
}

/**
 * Discounts that may be offered to the pricing engine for this period.
 * @param usedCounts Map of discountId -> live invoices that already use it
 */
export function eligibleDiscounts(discounts, periodStart, usedCounts = new Map()) {
  return discounts.filter((d) => discountWindowOpen(d, periodStart) && discountHasRoom(d, usedCounts.get(d.id) ?? 0));
}
