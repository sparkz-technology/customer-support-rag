import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import toast from 'react-hot-toast';
import { Card, Table, Select, Tag, Space, Typography, Avatar } from 'antd';
import { UserOutlined, TeamOutlined, SafetyOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => adminApi.getUsers({ role: roleFilter }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User updated');
    },
    onError: (err) => toast.error(err.message),
  });

  const roleConfig = {
    user: { icon: <UserOutlined />, color: '#3b82f6' },
    agent: { icon: <TeamOutlined />, color: '#22c55e' },
    admin: { icon: <SafetyOutlined />, color: '#ef4444' },
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => {
        const config = roleConfig[record.role] || roleConfig.user;
        return (
          <Space size={8}>
            <Avatar size={28} icon={config.icon} style={{ background: config.color }} />
            <div>
              <Text strong style={{ fontSize: 12 }}>{record.name || record.email.split('@')[0]}</Text>
              <div><Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text></div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (role, record) => (
        <Select value={role} onChange={(v) => updateMutation.mutate({ id: record.id, data: { role: v } })} style={{ width: 100 }} size="small"
          options={[{ value: 'user', label: 'User' }, { value: 'agent', label: 'Agent' }, { value: 'admin', label: 'Admin' }]} />
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      width: 80,
      render: (plan) => plan ? <Tag style={{ fontSize: 10 }}>{plan}</Tag> : '-',
    },
    {
      title: 'Agent Name',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 100,
      render: (name) => <Text style={{ fontSize: 11 }}>{name || '-'}</Text>,
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      width: 120,
      render: (date) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 11 }}>{date ? new Date(date).toLocaleDateString() : 'Never'}</Text>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Manage Users</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>{data?.pagination?.total || 0} users</Text>
        </div>
        <Select value={roleFilter || 'all'} onChange={(v) => setRoleFilter(v === 'all' ? '' : v)} style={{ width: 120 }} size="small"
          options={[{ value: 'all', label: 'All Roles' }, { value: 'user', label: 'Users' }, { value: 'agent', label: 'Agents' }, { value: 'admin', label: 'Admins' }]} />
      </div>

      <Card size="small" styles={{ body: { padding: 0 } }} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={data?.users || []} 
          rowKey="id" 
          loading={isLoading} 
          size="small"
          scroll={{ y: 'calc(100vh - 210px)' }}
          pagination={{ pageSize: 20, showTotal: (total) => `${total} users`, size: 'small' }} 
        />
      </Card>
    </div>
  );
}
