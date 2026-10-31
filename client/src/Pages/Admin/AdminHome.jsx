import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Alert,
  Spin,
} from 'antd';
import {
  DollarOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export default function AdminHome() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/catalogue/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = dashboard?.metrics || {
    active_subscriptions: 0,
    mrr_display: '₹0.00',
    invoiced_total_display: '₹0.00',
    collected_total_display: '₹0.00',
    outstanding_total_display: '₹0.00',
    overdue_total_display: '₹0.00',
    overdue_count: 0,
    invoiced_total: 0,
    collected_total: 0,
  };

  const collectionPercent =
    metrics.invoiced_total > 0
      ? Math.min(100, Math.round((metrics.collected_total / metrics.invoiced_total) * 100))
      : 0;

  const agingColumns = [
    {
      title: 'Aging Bucket',
      dataIndex: 'bucket',
      key: 'bucket',
      render: (bucket) => {
        const colors = {
          '1-30 days': 'orange',
          '31-60 days': 'volcano',
          '61-90 days': 'red',
          '90+ days': 'magenta',
        };
        return <Tag color={colors[bucket] || 'default'} className="font-semibold">{bucket}</Tag>;
      },
    },
    {
      title: 'Overdue Invoices',
      dataIndex: 'invoice_count',
      key: 'invoice_count',
      render: (count) => <Text strong>{count} invoice(s)</Text>,
    },
    {
      title: 'Unpaid Amount',
      dataIndex: 'overdue_amount_display',
      key: 'overdue_amount_display',
      render: (amount) => <span className="font-semibold text-red-600">{amount}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" tip="Loading finance dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Date Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Title level={2} className="!mb-1">
            Finance & Subscriptions Dashboard
          </Title>
          <Text type="secondary">
            Brightloop Software — Real-time recurring revenue, collection health, and overdue metrics.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Tag color={dashboard?.simulated ? 'gold' : 'blue'} className="px-3 py-1 text-sm font-medium">
            <ClockCircleOutlined className="mr-1" /> As of: {dashboard?.as_of_date || 'Today'}
            {dashboard?.simulated && ' (Simulated)'}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={fetchDashboard}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          type="info"
          showIcon
          message="Notice"
          description="Ready for live data. Connect PostgreSQL and run billing to view populated charts."
        />
      )}

      {/* Primary KPI Cards */}
      <Row gutter={[16, 16]}>
        {/* Active Subscriptions */}
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <Statistic
              title={<span className="text-gray-500 font-medium">Active Subscriptions</span>}
              value={metrics.active_subscriptions}
              prefix={<UsergroupAddOutlined className="text-indigo-600 mr-2" />}
              valueStyle={{ fontWeight: 'bold', color: '#1f2937' }}
            />
            <div className="mt-3 text-xs text-gray-500">Currently active recurring customers</div>
          </Card>
        </Col>

        {/* Monthly Recurring Revenue (MRR) */}
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition bg-gradient-to-br from-indigo-50/50 to-white">
            <Statistic
              title={<span className="text-indigo-900 font-medium">Monthly Recurring Revenue (MRR)</span>}
              value={metrics.mrr_display}
              prefix={<DollarOutlined className="text-indigo-600 mr-2" />}
              valueStyle={{ fontWeight: 'bold', color: '#4338ca' }}
            />
            <div className="mt-3 text-xs text-indigo-700">Normalized across daily, weekly, monthly, and yearly plans</div>
          </Card>
        </Col>

        {/* Invoiced Revenue */}
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <Statistic
              title={<span className="text-gray-500 font-medium">Total Invoiced</span>}
              value={metrics.invoiced_total_display}
              prefix={<CheckCircleOutlined className="text-emerald-600 mr-2" />}
              valueStyle={{ fontWeight: 'bold', color: '#1f2937' }}
            />
            <div className="mt-3 text-xs text-gray-500">Confirmed & paid invoices</div>
          </Card>
        </Col>

        {/* Collected Revenue */}
        <Col xs={24} sm={12} lg={12}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <Statistic
                  title={<span className="text-gray-500 font-medium">Collected Cash</span>}
                  value={metrics.collected_total_display}
                  valueStyle={{ fontWeight: 'bold', color: '#059669' }}
                />
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block mb-1">Collection Rate</span>
                <Progress type="circle" percent={collectionPercent} size={60} strokeColor="#059669" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">Actual money matched and deposited</div>
          </Card>
        </Col>

        {/* Outstanding & Overdue */}
        <Col xs={24} sm={12} lg={12}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <Statistic
                  title={<span className="text-gray-500 font-medium">Outstanding Balance</span>}
                  value={metrics.outstanding_total_display}
                  valueStyle={{ fontWeight: 'bold', color: '#d97706' }}
                />
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block mb-1">Strict Overdue</span>
                <Tag color="error" className="font-bold text-sm px-3 py-1">
                  <ExclamationCircleOutlined className="mr-1" />
                  {metrics.overdue_total_display} ({metrics.overdue_count} overdue)
                </Tag>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Computed from live India date — never saved statically.
            </div>
          </Card>
        </Col>
      </Row>

      {/* Aging Buckets Table */}
      <Card
        title={
          <span className="font-semibold text-gray-800">
            Invoice Aging Buckets (Overdue Receivables)
          </span>
        }
        className="rounded-xl shadow-sm border border-gray-100"
      >
        <Table
          columns={agingColumns}
          dataSource={dashboard?.aging_buckets || []}
          pagination={false}
          rowKey="bucket"
          locale={{
            emptyText: 'No overdue invoices currently. All accounts are in good standing! 🎉',
          }}
        />
      </Card>

      {/* Quick Navigation Footprint */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Product Catalogue & Variants</h4>
                <p className="text-xs text-gray-600">Configure base products, GST tax rates, and ₹560 add-on variants.</p>
              </div>
              <Link to="/admin/products">
                <Button type="primary" icon={<ArrowRightOutlined />}>
                  Open Catalogue
                </Button>
              </Link>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Plans & Discounts</h4>
                <p className="text-xs text-gray-600">Manage billing frequencies, auto-close terms, and admin discount codes.</p>
              </div>
              <Link to="/admin/plans">
                <Button type="primary" icon={<ArrowRightOutlined />}>
                  Open Plans
                </Button>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
