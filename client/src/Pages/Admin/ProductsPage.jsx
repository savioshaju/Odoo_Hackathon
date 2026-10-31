import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Space,
  Card,
  Typography,
  message,
  Select,
  ConfigProvider,
} from 'antd';
import { PlusOutlined, TagOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [productForm] = Form.useForm();
  const [variantForm] = Form.useForm();

  // Load products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalogue/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Create Product
  const handleCreateProduct = async (values) => {
    try {
      const res = await fetch('/api/catalogue/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': 'admin',
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to create product');
      }

      message.success('Product created successfully!');
      setIsProductModalOpen(false);
      productForm.resetFields();
      fetchProducts();
    } catch (err) {
      message.error(err.message);
    }
  };

  // Handle Add Variant
  const handleAddVariant = async (values) => {
    try {
      const res = await fetch(`/api/catalogue/products/${selectedProduct.id}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user': 'admin',
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to add variant');
      }

      message.success(`Variant added to ${selectedProduct.name}!`);
      setIsVariantModalOpen(false);
      variantForm.resetFields();
      fetchProducts();
    } catch (err) {
      message.error(err.message);
    }
  };

  const openVariantModal = (product) => {
    setSelectedProduct(product);
    setIsVariantModalOpen(true);
  };

  // Table Columns
  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong className="text-gray-900">{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'kind',
      key: 'kind',
      render: (kind) => (
        <Tag color={kind === 'service' ? 'blue' : 'green'} className="uppercase font-semibold">
          {kind}
        </Tag>
      ),
    },
    {
      title: 'Base Price',
      dataIndex: 'sales_price_display',
      key: 'sales_price_display',
      render: (price) => <span className="font-semibold text-emerald-600">{price}</span>,
    },
    {
      title: 'Variants Count',
      key: 'variantsCount',
      render: (_, record) => (
        <Tag icon={<TagOutlined />} color="purple">
          {record.variants ? record.variants.length : 0} Variant(s)
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          ghost
          icon={<PlusOutlined />}
          onClick={() => openVariantModal(record)}
        >
          Add Variant
        </Button>
      ),
    },
  ];

  // Sub-table for Variants (Shows the ₹2,000 + ₹560 = ₹2,560 live breakdown!)
  const expandedRowRender = (record) => {
    const variantColumns = [
      {
        title: 'Variant Name',
        dataIndex: 'name',
        key: 'name',
        render: (name) => <Text strong>{name}</Text>,
      },
      {
        title: 'Base Price',
        key: 'base',
        render: () => record.sales_price_display,
      },
      {
        title: 'Add-on Extra',
        dataIndex: 'price_addon_display',
        key: 'price_addon_display',
        render: (addon) => <span className="text-amber-600 font-medium">+{addon}</span>,
      },
      {
        title: 'Total Display Price',
        dataIndex: 'total_price_display',
        key: 'total_price_display',
        render: (total) => (
          <Tag color="success" className="text-sm font-bold px-3 py-1">
            {total}
          </Tag>
        ),
      },
    ];

    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <Text type="secondary" className="font-semibold text-xs uppercase tracking-wide">
            Product Variants & Add-ons
          </Text>
        </div>
        <Table
          columns={variantColumns}
          dataSource={record.variants || []}
          pagination={false}
          rowKey="id"
          size="small"
          locale={{ emptyText: 'No variants yet. Click "Add Variant" to create one.' }}
        />
      </div>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
        },
      }}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-1">
            Product Catalogue & Variants
          </Title>
          <Text type="secondary">
            Manage your software products, add-on variants, and dynamic pricing rules.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setIsProductModalOpen(true)}
        >
          Add Product
        </Button>
      </div>

      <Card className="shadow-sm rounded-xl border border-gray-200">
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender,
            defaultExpandAllRows: true,
          }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Modal: Create Product */}
      <Modal
        title="Create New Product"
        open={isProductModalOpen}
        onCancel={() => setIsProductModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={productForm} layout="vertical" onFinish={handleCreateProduct}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input placeholder="e.g. Brightloop CRM" />
          </Form.Item>

          <Form.Item name="kind" label="Product Type" initialValue="service">
            <Select>
              <Select.Option value="service">Service (Subscription/Software)</Select.Option>
              <Select.Option value="physical">Physical Product</Select.Option>
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="sales_price"
              label="Sales Price (₹)"
              rules={[{ required: true, message: 'Please enter sales price' }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder="2000"
                formatter={(val) => `₹ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => val.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item name="cost_price" label="Cost Price (₹)" initialValue={0}>
              <InputNumber
                className="w-full"
                min={0}
                placeholder="800"
                formatter={(val) => `₹ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => val.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional description or details..." />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Save Product
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal: Add Variant */}
      <Modal
        title={selectedProduct ? `Add Variant to ${selectedProduct.name}` : 'Add Variant'}
        open={isVariantModalOpen}
        onCancel={() => setIsVariantModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={variantForm} layout="vertical" onFinish={handleAddVariant}>
          <Form.Item
            name="name"
            label="Variant / Add-on Name"
            rules={[{ required: true, message: 'Please enter variant name' }]}
          >
            <Input placeholder="e.g. Odoo Brand Edition, Enterprise Tier" />
          </Form.Item>

          <Form.Item
            name="price_addon"
            label="Price Add-on (₹)"
            rules={[{ required: true, message: 'Please enter add-on price' }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              placeholder="560"
              formatter={(val) => `₹ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(val) => val.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4 text-xs text-blue-800">
            💡 <strong>Dynamic Price Rule:</strong> The variant add-on is added to the base price of{' '}
            {selectedProduct?.sales_price_display} on the fly (e.g. ₹2,000 + ₹560 = ₹2,560).
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsVariantModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Add Variant
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
    </ConfigProvider>
  );
}
