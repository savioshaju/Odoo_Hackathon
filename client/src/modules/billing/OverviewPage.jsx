import { Alert, Card, Descriptions, Skeleton, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api.js';
import { formatDateLong } from '../../format.js';
import { useDemoUser } from '../../shell/DemoUser.jsx';
import { pagesForRole } from './pages.jsx';

// Home screen: proves the browser, the server, the database and the shared clock are all talking.
export default function OverviewPage() {
  const { user } = useDemoUser();
  const health = useQuery({ queryKey: ['health'], queryFn: () => api('/health', { base: '/api' }), retry: false });
  const me = useQuery({ queryKey: ['me', user.key], queryFn: () => api('/me') });
  const clock = useQuery({ queryKey: ['clock'], queryFn: () => api('/clock') });

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 880 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        LoopLedger: billing
      </Typography.Title>

      {health.isError && (
        <Alert
          type="error"
          showIcon
          message="The database is not reachable"
          description={health.error.message}
        />
      )}

      <Card title="System check">
        {health.isLoading || me.isLoading || clock.isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Server and database">
              {health.data?.ok ? <Tag color="green">OK · {health.data.database}</Tag> : <Tag color="red">Down</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Today (shared clock)">
              {clock.data ? formatDateLong(clock.data.today) : '—'}{' '}
              {clock.data?.simulated ? <Tag color="orange">simulated</Tag> : <Tag>real</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Signed in as">
              {me.data ? `${me.data.name} (${me.data.role})` : '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Pages you can open">
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          {pagesForRole(user.role).map((p) => (
            <li key={p.path}>
              <strong>{p.label}</strong>: {p.blurb}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
