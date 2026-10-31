// Smoke tests for the browser shell: formatting rules and a server-side render of the whole page tree
// (catches import errors, bad props and render crashes without needing a browser).

import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { describe, expect, it } from 'vitest';
import App from '../src/App.jsx';
import { formatDate, formatDateLong, formatINR } from '../src/format.js';
import { BILLING_PAGES, pagesForRole } from '../src/modules/billing/pages.jsx';
import { DemoUserProvider } from '../src/shell/DemoUser.jsx';

describe('formatINR', () => {
  it('matches the server: Indian grouping, paise, negatives', () => {
    expect(formatINR(10_000_000)).toBe('₹1,00,000.00');
    expect(formatINR(2_659_720)).toBe('₹26,597.20');
    expect(formatINR(50)).toBe('₹0.50');
    expect(formatINR(-50_000)).toBe('-₹500.00');
    expect(formatINR(0)).toBe('₹0.00');
    expect(formatINR(null)).toBe('—'); // missing is not zero
    expect(formatINR(undefined)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats plain dates with no time zone shift', () => {
    expect(formatDate('2026-12-20')).toBe('20 Dec 2026');
    expect(formatDate('2027-01-01')).toBe('1 Jan 2027');
    expect(formatDateLong('2026-12-20')).toBe('Sun, 20 Dec 2026');
    expect(formatDate('nonsense')).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});

describe('page access by role (mirrors "Who can do what")', () => {
  const labels = (role) => pagesForRole(role).map((p) => p.label);
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

describe('the shell renders', () => {
  const render = (url) =>
    renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <ConfigProvider>
          <MemoryRouter initialEntries={[url]}>
            <DemoUserProvider>
              <App />
            </DemoUserProvider>
          </MemoryRouter>
        </ConfigProvider>
      </QueryClientProvider>,
    );

  it('overview page with sidebar, banner and role switcher', () => {
    const html = render('/');
    expect(html).toContain('LoopLedger');
    expect(html).toContain('Overview');
    expect(html).toContain('Viewing as');
    expect(html).toContain('Billing Run');
  });

  it('a planned page shows which build block delivers it', () => {
    expect(render('/proof')).toContain('Coming in build block 4');
  });

  it('an unknown path shows a 404 page', () => {
    expect(render('/nope')).toContain('Page not found');
  });
});
