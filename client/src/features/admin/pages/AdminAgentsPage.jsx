import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, Switch, Popconfirm, Progress } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AdminAgentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-agents'],
    queryFn: adminApi.getAgents,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-agents']);
      toast.success('Agent created');
      setShowForm(false);
      form.resetFields();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-agents']);
      toast.success('Agent updated');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-agents']);
      toast.success('Agent deleted');
    },
    onError: (err) => toast.error(err.message),
  });

  const categories = ['account', 'billing', 'technical', 'gameplay', 'security', 'general'];

  const columns = [
    {
      title: 'Agent',
      key: 'agent',
      render: (_, record) => (
        <Space size={8}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: record.isActive ? '#dcfce7' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserOutlined style={{ color: record.isActive ? '#22c55e' : '#9ca3af', fontSize: 14 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 12 }}>{record.name}</Text>
            <div><Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Categories',
      dataIndex: 'categories',
      key: 'categories',
      render: (cats) => <Space wrap size={2}>{cats?.map((c) => <Tag key={c} style={{ fontSize: 10 }}>{c}</Tag>)}</Space>,
    },
    {
      title: 'Workload',
      key: 'workload',
      width: 130,
      render: (_, record) => {
        const util = Math.round((record.currentLoad / record.maxLoad) * 100);
        const color = util > 80 ? '#ef4444' : util > 50 ? '#f59e0b' : '#22c55e';
        return (
          <div>
            <Progress percent={util} strokeColor={color} size="small" showInfo={false} />
            <Text type="secondary" style={{ fontSize: 10 }}>{record.currentLoad}/{record.maxLoad}</Text>
          </div>
        );
      },
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 70,
      render: (isActive, record) => <Switch checked={isActive} size="small" onChange={(v) => updateMutation.mutate({ id: record._id, data: { isActive: v } })} />,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Popconfirm title="Delete agent?" onConfirm={() => deleteMutation.mutate(record._id)}>
          <Button danger icon={<DeleteOutlined />} size="small" type="text" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Manage Agents</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>{data?.agents?.length || 0} agents</Text>
        </div>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setShowForm(true)}>Add Agent</Button>
      </div>

      <Card size="small" styles={{ body: { padding: 0 } }} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={data?.agents || []} 
          rowKey="_id" 
          loading={isLoading} 
          size="small" 
          scroll={{ y: 'calc(100vh - 180px)' }}
          pagination={false} 
        />
      </Card>

      <Modal title="Add New Agent" open={showForm} onCancel={() => setShowForm(false)} footer={null} width={400}>
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)} initialValues={{ maxLoad: 10, categories: [] }} size="small">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input placeholder="Agent name" /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input placeholder="agent@example.com" /></Form.Item>
          <Form.Item name="categories" label="Categories">
            <Select mode="multiple" placeholder="Select categories" options={categories.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="maxLoad" label="Max Workload"><Input type="number" min={1} max={50} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={createMutation.isPending} block>Create Agent</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
