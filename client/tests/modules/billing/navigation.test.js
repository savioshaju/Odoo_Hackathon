import { describe, expect, it } from 'vitest';
import { BILLING_PAGES, pagesForRole } from '../../../src/modules/billing/navigation.jsx';

const labels = (role) => pagesForRole(role).map((p) => p.label);

describe('pagesForRole', () => {
  it('admin sees everything', () => {
    expect(labels('admin')).toHaveLength(BILLING_PAGES.length);
  });

  it('staff cannot open the Time Machine or the Billing Run', () => {
    expect(labels('staff')).not.toContain('Time Machine');
    expect(labels('staff')).not.toContain('Billing Run');
    expect(labels('staff')).toContain('Invoices');
  });

  it('customers only see invoices', () => {
    expect(labels('customer')).toEqual(['Invoices']);
  });
});
