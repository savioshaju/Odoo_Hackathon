import { Layout, Menu, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import { pagesForRole } from '../modules/billing/pages.jsx';
import DateBanner from './DateBanner.jsx';
import { useDemoUser } from './DemoUser.jsx';
import RoleSwitcher from './RoleSwitcher.jsx';

const { Sider, Header, Content } = Layout;

export default function AppShell() {
  const { user } = useDemoUser();
  const { pathname } = useLocation();

  const items = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">Overview</Link> },
    ...pagesForRole(user.role).map((p) => ({ key: p.path, icon: p.icon, label: <Link to={p.path}>{p.label}</Link> })),
  ];
  const selected = items.find((i) => i.key !== '/' && pathname.startsWith(i.key))?.key ?? '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <DateBanner />
      <Layout hasSider>
        <Sider breakpoint="lg" collapsedWidth={0} width={224} theme="light" className="app-sider">
          <div className="app-logo">
            <span className="app-logo__mark">L</span>
            <Typography.Text strong style={{ fontSize: 16 }}>
              LoopLedger
            </Typography.Text>
          </div>
          <Menu mode="inline" selectedKeys={[selected]} items={items} style={{ borderInlineEnd: 0 }} />
        </Sider>
        <Layout>
          <Header className="app-header">
            <RoleSwitcher />
          </Header>
          <Content className="app-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
