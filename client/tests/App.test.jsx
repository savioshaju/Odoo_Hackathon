import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { describe, expect, it } from 'vitest';
import App from '../src/App.jsx';
import { DemoUserProvider } from '../src/context/DemoUserProvider.jsx';

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

describe('the app renders', () => {
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
