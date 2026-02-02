import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAgentTickets } from '../api/useAgent';
import { Card, Table, Tag, Select, Space, Typography, Switch, Badge, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  UserOutlined,
  MessageOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { SLADisplay, ManualReviewBadge } from '../../tickets/components';

const { Title, Text } = Typography;

export default function AgentTicketsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    assignedToMe: searchParams.get('assignedToMe') === 'true',
    needsManualReview: searchParams.get('needsManualReview') === 'true',
  });

  // Save scroll position before refetch
  const saveScrollPosition = useCallback(() => {
    const tableBody = tableRef.current?.querySelector('.ant-table-body');
    if (tableBody) {
      scrollPositionRef.current = tableBody.scrollTop;
    }
  }, []);
  
  // Restore scroll position after refetch
  const restoreScrollPosition = useCallback(() => {
    const tableBody = tableRef.current?.querySelector('.ant-table-body');
    if (tableBody && scrollPositionRef.current > 0) {
      tableBody.scrollTop = scrollPositionRef.current;
    }
  }, []);

  const { data, isLoading, isFetching } = useAgentTickets(filters, {
    refetchInterval: 30000,
    onSuccess: restoreScrollPosition,
  });
  
  // Save scroll position when fetching starts
  useEffect(() => {
    if (isFetching && !isLoading) {
      saveScrollPosition();
    }
  }, [isFetching, isLoading, saveScrollPosition]);

  const statusConfig = {
    open: { color: 'orange', icon: <ClockCircleOutlined /> },
    'in-progress': { color: 'blue', icon: <ExclamationCircleOutlined /> },
    resolved: { color: 'green', icon: <CheckCircleOutlined /> },
    closed: { color: 'default', icon: <CheckCircleOutlined /> },
  };

  const priorityConfig = {
    urgent: { color: 'red' },
    high: { color: 'orange' },
    medium: { color: 'gold' },
    low: { color: 'green' },
  };

  const columns = [
    {
      title: 'Ticket',
      key: 'ticket',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong style={{ fontSize: 12 }}>{record.subject}</Text>
            {record.slaBreached && <Tag color="red" icon={<WarningOutlined />} style={{ fontSize: 10, padding: '0 4px' }}>SLA</Tag>}
            <ManualReviewBadge needsManualReview={record.needsManualReview} />
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>{record.description?.slice(0, 60)}...</Text>
          <div style={{ marginTop: 2 }}>
            <Tag style={{ fontSize: 10 }}>{record.category}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerEmail',
      key: 'customer',
      width: 160,
      render: (email) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = statusConfig[status] || statusConfig.open;
        return <Tag color={config.color} icon={config.icon} style={{ fontSize: 10 }}>{status}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => {
        const config = priorityConfig[priority] || priorityConfig.medium;
        return <Tag color={config.color} style={{ fontSize: 10 }}>{priority}</Tag>;
      },
    },
    {
      title: 'SLA',
      key: 'sla',
      width: 100,
      render: (_, record) => (
        <SLADisplay 
          slaDueAt={record.slaDueAt} 
          slaBreached={record.slaBreached} 
          status={record.status} 
        />
      ),
    },
    {
      title: 'First Response',
      key: 'firstResponse',
      width: 120,
      render: (_, record) => {
        if (record.firstResponseAt) {
          const date = new Date(record.firstResponseAt);
          return (
            <Tooltip title={date.toLocaleString()}>
              <Text style={{ fontSize: 11, color: '#22c55e' }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                {date.toLocaleDateString()}
              </Text>
            </Tooltip>
          );
        }
        // Show "Awaiting" for tickets without response (except closed/resolved)
        if (record.status !== 'resolved' && record.status !== 'closed') {
          return (
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              Awaiting
            </Text>
          );
        }
        return <Text style={{ fontSize: 11, color: '#9ca3af' }}>-</Text>;
      },
    },
    {
      title: 'Assigned',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 100,
      render: (name) => <Text style={{ fontSize: 11 }}>{name || '-'}</Text>,
    },
    {
      title: 'Msgs',
      dataIndex: 'messageCount',
      key: 'messages',
      width: 60,
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: '#22c55e' }} size="small">
          <MessageOutlined style={{ fontSize: 14, color: '#9ca3af' }} />
        </Badge>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 90,
      render: (date) => <Text style={{ fontSize: 11 }}>{new Date(date).toLocaleDateString()}</Text>,
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
      <div style={{ flexShrink: 0 }}>
        <Title level={4} style={{ margin: 0 }}>
          Support Tickets
          {isFetching && !isLoading && (
            <Tooltip title="Auto-refreshing...">
              <SyncOutlined spin style={{ marginLeft: 8, fontSize: 14, color: '#22c55e' }} />
            </Tooltip>
          )}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>{data?.pagination?.total || 0} tickets • Auto-refreshes every 30s</Text>
      </div>

      <Card size="small" styles={{ body: { padding: 12 } }} style={{ flexShrink: 0 }}>
        <Space wrap size={8}>
          <Select
            value={filters.status || 'all'}
            onChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}
            style={{ width: 120 }}
            size="small"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
          <Select
            value={filters.category || 'all'}
            onChange={(v) => setFilters({ ...filters, category: v === 'all' ? '' : v })}
            style={{ width: 120 }}
            size="small"
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'account', label: 'Account' },
              { value: 'billing', label: 'Billing' },
              { value: 'technical', label: 'Technical' },
              { value: 'gameplay', label: 'Gameplay' },
              { value: 'security', label: 'Security' },
            ]}
          />
          <Space size={4}>
            <Switch
              checked={filters.assignedToMe}
              onChange={(v) => setFilters({ ...filters, assignedToMe: v })}
              size="small"
            />
            <Text style={{ fontSize: 12 }}>My Tickets</Text>
          </Space>
          <Space size={4}>
            <Switch
              checked={filters.needsManualReview}
              onChange={(v) => setFilters({ ...filters, needsManualReview: v })}
              size="small"
            />
            <Text style={{ fontSize: 12 }}>Needs Review</Text>
          </Space>
        </Space>
      </Card>

      <Card size="small" styles={{ body: { padding: 0 } }} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} ref={tableRef}>
        <Table
          columns={columns}
          dataSource={data?.tickets || []}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ y: 'calc(100vh - 270px)' }}
          onRow={(record) => ({
            onClick: () => navigate(`/agent/tickets/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `${total} tickets`,
            size: 'small',
          }}
        />
      </Card>
    </div>
  );
}
