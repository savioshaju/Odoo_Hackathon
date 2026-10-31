import { Card, Result, Tag } from 'antd';
import { useDemoUser } from '../../shell/DemoUser.jsx';

// Placeholder for a page that a later build block delivers. Also the single place that turns a
// wrong-role visit into a clear "not allowed" screen.
export default function PlannedPage({ page }) {
  const { user } = useDemoUser();

  if (!page.roles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="Not available for your role"
        subTitle={`${page.label} is for ${page.roles.join(' and ')} users. You are signed in as ${user.role}.`}
      />
    );
  }

  return (
    <Card title={page.label} extra={<Tag color="gold">{`Coming in build block ${page.block}`}</Tag>}>
      <p style={{ margin: 0 }}>{page.blurb}</p>
    </Card>
  );
}
