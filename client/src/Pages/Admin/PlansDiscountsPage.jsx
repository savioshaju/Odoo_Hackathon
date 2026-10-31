import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag,
  Space,
  Card,
  Typography,
  message,
  Radio,
  DatePicker,
  Alert,
} from 'antd';
import { PlusOutlined, PercentageOutlined, SafetyCertificateOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function PlansDiscountsPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Role Switcher for live testing (Admin vs Staff)
  const [currentRole, setCurrentRole] = useState('admin');

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const [planForm] = Form.useForm();
  const [discountForm] = Form.useForm();

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, discountsRes] = await Promise.all([
        fetch('/api/catalogue/plans'),
        fetch('/api/catalogue/discounts'),
      ]);

      if (plansRes.ok) setPlans(await plansRes.json());
      if (discountsRes.ok) setDiscounts(await discountsRes.json());
    } catch (err) {
      message.error('Failed to load catalogue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Create Plan
  const handleCreatePlan = async (values) => {
    try {
      const res = await fetch('/api/catalogue/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': currentRole,
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to create plan');
      }

      message.success('Plan created successfully!');
      setIsPlanModalOpen(false);
      planForm.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  // Handle Create Discount (Enforces Admin-only test live!)
  const handleCreateDiscount = async (values) => {
    try {
      const payload = {
        ...values,
        start_date: values.date_range?.[0]?.format('YYYY-MM-DD') || null,
        end_date: values.date_range?.[1]?.format('YYYY-MM-DD') || null,
      };
      delete payload.date_range;

      const res = await fetch('/api/catalogue/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': currentRole, // Sends admin or staff!
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 403) {
          throw new Error('⛔ 403 Forbidden: Staff members are blocked from creating discounts!');
        }
        throw new Error(err.error?.message || 'Failed to create discount');
      }

      message.success('Discount created successfully!');
      setIsDiscountModalOpen(false);
      discountForm.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  // Plans Table Columns
  const planColumns = [
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (freq) => {
        const colors = { daily: 'cyan', weekly: 'blue', monthly: 'geekblue', yearly: 'purple' };
        return <Tag color={colors[freq] || 'default'} className="uppercase font-semibold">{freq}</Tag>;
      },
    },
    {
      title: 'Base Price',
      dataIndex: 'price_display',
      key: 'price_display',
      render: (price) => <span className="font-semibold text-emerald-600">{price}</span>,
    },
    {
      title: 'Min Qty',
      dataIndex: 'min_quantity',
      key: 'min_quantity',
    },
    {
      title: 'Plan Flags',
      key: 'flags',
      render: (_, r) => (
        <Space size={[0, 4]} wrap>
          {r.pausable && <Tag color="green">Pausable</Tag>}
          {r.renewable && <Tag color="blue">Renewable</Tag>}
          {r.closable && <Tag color="orange">Early Closable</Tag>}
          {r.auto_close && <Tag color="red">Auto-Close</Tag>}
        </Space>
      ),
    },
  ];

  // Discounts Table Columns
  const discountColumns = [
    {
      title: 'Discount Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Type & Value',
      key: 'value',
      render: (_, r) => (
        <Tag color="magenta" className="font-semibold">
          {r.kind === 'percent' ? `${r.value / 100}% OFF` : `₹${(r.value / 100).toFixed(2)} OFF`}
        </Tag>
      ),
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      render: (s) => <Tag color={s === 'subscription' ? 'indigo' : 'gold'}>{s}</Tag>,
    },
    {
      title: 'Usage Limit',
      key: 'usage',
      render: (_, r) => (
        <span>
          <Text strong>{r.used_count || 0}</Text> / {r.usage_limit ? r.usage_limit : '∞ Unlimited'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Role Switcher Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title level={2} className="!mb-1">
            Plans & Discounts Management
          </Title>
          <Text type="secondary">
            Configure subscription frequencies, terms, and admin-only promotional discounts.
          </Text>
        </div>

        {/* Demo Role Switcher to prove Admin-Only rule */}
        <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl flex items-center gap-3">
          <SafetyCertificateOutlined className="text-indigo-600 text-lg" />
          <div className="text-xs">
            <span className="font-semibold text-gray-700 block">Simulate Role:</span>
            <Radio.Group
              size="small"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="admin">Admin (Full Access)</Radio.Button>
              <Radio.Button value="staff">Staff (Blocked from Discounts)</Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </div>

      {currentRole === 'staff' && (
        <Alert
          type="warning"
          showIcon
          message="Staff Role Active"
          description="In accordance with the hackathon rules, staff users are blocked at the API level from creating new discounts."
        />
      )}

      {/* Tabs */}
      <Card className="shadow-sm rounded-xl border border-gray-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab === 'plans' ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsPlanModalOpen(true)}
              >
                Create Plan
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PercentageOutlined />}
                onClick={() => setIsDiscountModalOpen(true)}
              >
                Create Discount
              </Button>
            )
          }
          items={[
            {
              key: 'plans',
              label: 'Subscription Plans',
              children: (
                <Table
                  columns={planColumns}
                  dataSource={plans}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                />
              ),
            },
            {
              key: 'discounts',
              label: 'Discounts & Coupons',
              children: (
                <Table
                  columns={discountColumns}
                  dataSource={discounts}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Modal: Create Plan */}
      <Modal
        title="Create Subscription Plan"
        open={isPlanModalOpen}
        onCancel={() => setIsPlanModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={planForm} layout="vertical" onFinish={handleCreatePlan}>
          <Form.Item
            name="name"
            label="Plan Name"
            rules={[{ required: true, message: 'Please enter plan name' }]}
          >
            <Input placeholder="e.g. Enterprise Monthly" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="frequency"
              label="Billing Frequency"
              rules={[{ required: true, message: 'Please select frequency' }]}
              initialValue="monthly"
            >
              <Select>
                <Select.Option value="daily">Daily</Select.Option>
                <Select.Option value="weekly">Weekly</Select.Option>
                <Select.Option value="monthly">Monthly</Select.Option>
                <Select.Option value="yearly">Yearly</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="price"
              label="Plan Price (₹)"
              rules={[{ required: true, message: 'Please enter price' }]}
            >
              <InputNumber className="w-full" min={0} placeholder="12000" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="min_quantity" label="Minimum Quantity" initialValue={1}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>

          <div className="space-y-3 pt-2 pb-4 border-t border-gray-100">
            <Text strong className="text-xs uppercase text-gray-500">Plan Rules & Flags</Text>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Form.Item name="pausable" valuePropName="checked" initialValue={true} noStyle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch size="small" defaultChecked />
                  <span>Pausable</span>
                </label>
              </Form.Item>
              <Form.Item name="renewable" valuePropName="checked" initialValue={true} noStyle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch size="small" defaultChecked />
                  <span>Renewable</span>
                </label>
              </Form.Item>
              <Form.Item name="closable" valuePropName="checked" initialValue={true} noStyle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch size="small" defaultChecked />
                  <span>Closable Early</span>
                </label>
              </Form.Item>
              <Form.Item name="auto_close" valuePropName="checked" initialValue={false} noStyle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch size="small" />
                  <span>Auto-close at End</span>
                </label>
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsPlanModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Save Plan
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal: Create Discount */}
      <Modal
        title="Create Promotional Discount (Admin-Only)"
        open={isDiscountModalOpen}
        onCancel={() => setIsDiscountModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={discountForm} layout="vertical" onFinish={handleCreateDiscount}>
          <Form.Item
            name="name"
            label="Discount Name"
            rules={[{ required: true, message: 'Please enter discount name' }]}
          >
            <Input placeholder="e.g. Diwali Launch 10%" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="kind"
              label="Discount Type"
              rules={[{ required: true }]}
              initialValue="percent"
            >
              <Select>
                <Select.Option value="percent">Percentage (%)</Select.Option>
                <Select.Option value="fixed">Fixed Amount (₹)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="value"
              label="Value (e.g. 10 for 10% or 500 for ₹500)"
              rules={[{ required: true, message: 'Please enter value' }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="scope" label="Applies To" initialValue="subscription">
              <Select>
                <Select.Option value="subscription">Whole Subscription</Select.Option>
                <Select.Option value="product">Specific Products</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="usage_limit" label="Usage Limit (leave blank for unlimited)">
              <InputNumber min={1} className="w-full" placeholder="e.g. 100" />
            </Form.Item>
          </div>

          <Form.Item name="date_range" label="Validity Dates">
            <DatePicker.RangePicker className="w-full" />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setIsDiscountModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Save Discount
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
