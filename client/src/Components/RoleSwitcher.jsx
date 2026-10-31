import { Select, Space, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DEMO_USERS } from '../constants/demoUsers.js';
import { useDemoUser } from '../hooks/useDemoUser.js';

const ROLE_COLOR = { admin: 'purple', staff: 'blue', customer: 'green' };

export default function RoleSwitcher() {
  const { user, switchTo } = useDemoUser();
  const navigate = useNavigate();

  return (
    <Space size="small" wrap>
      <Typography.Text type="secondary">Viewing as</Typography.Text>
      <Select
        value={user.key}
        style={{ width: 200 }}
        aria-label="Demo user"
        onChange={(key) => {
          switchTo(key);
          navigate('/');
        }}
        options={DEMO_USERS.map((u) => ({ value: u.key, label: `${u.name} · ${u.label}` }))}
      />
      <Tag color={ROLE_COLOR[user.role]} style={{ marginInlineEnd: 0 }}>
        {user.role}
      </Tag>
    </Space>
  );
}
