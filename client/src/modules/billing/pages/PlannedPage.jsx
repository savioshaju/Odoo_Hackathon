import { Card, Result, Tag } from 'antd';
import { useDemoUser } from '../../../hooks/useDemoUser.js';

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
