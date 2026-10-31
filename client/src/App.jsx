import { Result } from 'antd';
import { Link, Route, Routes } from 'react-router-dom';
import OverviewPage from './modules/billing/OverviewPage.jsx';
import PlannedPage from './modules/billing/PlannedPage.jsx';
import { BILLING_PAGES } from './modules/billing/pages.jsx';
import AppShell from './shell/AppShell.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        {BILLING_PAGES.map((page) => (
          <Route key={page.path} path={page.path} element={<PlannedPage page={page} />} />
        ))}
        <Route
          path="*"
          element={<Result status="404" title="Page not found" extra={<Link to="/">Back to overview</Link>} />}
        />
      </Route>
    </Routes>
  );
}
