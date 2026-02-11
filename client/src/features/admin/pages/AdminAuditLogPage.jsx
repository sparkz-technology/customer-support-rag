import { useState } from 'react';
import { useAdminAuditLogs } from '../api/useAdmin';
import { Card, Table, Tag, Select, Space, Typography, Input, DatePicker, Button, Tooltip } from 'antd';
import {
  SearchOutlined, ReloadOutlined, UserOutlined, FileTextOutlined,
  TeamOutlined, SettingOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, WarningOutlined, CloseCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AdminAuditLogPage() {
  const [filters, setFilters] = useState({ category: '', action: '', severity: '', search: '', page: 1 });
  const [dateRange, setDateRange] = useState(null);
  const filterButtonStyle = { height: 24, padding: '0 8px' };

  const queryParams = { ...filters };
  if (dateRange?.[0]) queryParams.startDate = dateRange[0].toISOString();
  if (dateRange?.[1]) queryParams.endDate = dateRange[1].toISOString();
  Object.keys(queryParams).forEach(k => !queryParams[k] && delete queryParams[k]);

  const { data, isLoading, refetch, isFetching } = useAdminAuditLogs(queryParams);

  const categoryConfig = {
    user: { icon: <UserOutlined />, color: '#3b82f6' },
    ticket: { icon: <FileTextOutlined />, color: '#22c55e' },
    agent: { icon: <TeamOutlined />, color: '#8b5cf6' },
    admin: { icon: <SettingOutlined />, color: '#f59e0b' },
    system: { icon: <ExclamationCircleOutlined />, color: '#ef4444' },
  };

  const severityConfig = {
    info: { icon: <InfoCircleOutlined />, color: 'blue' },
    warning: { icon: <WarningOutlined />, color: 'orange' },
    error: { icon: <CloseCircleOutlined />, color: 'red' },
    critical: { icon: <CloseCircleOutlined />, color: 'magenta' },
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <Text style={{ fontSize: 11 }}>{new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 90,
      render: (cat) => {
        const cfg = categoryConfig[cat] || categoryConfig.system;
        return <Tag icon={cfg.icon} color={cfg.color} style={{ fontSize: 10 }}>{cat}</Tag>;
      },
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action) => <Text code style={{ fontSize: 10 }}>{action}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc, record) => (
        <div>
          <Text style={{ fontSize: 12 }}>{desc}</Text>
          {record.targetName && <div><Text type="secondary" style={{ fontSize: 10 }}>Target: {record.targetName}</Text></div>}
        </div>
      ),
    },
    {
      title: 'User',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 150,
      render: (email, record) => email ? (
        <Tooltip title={record.userName}>
          <Text style={{ fontSize: 11 }}>{email}</Text>
        </Tooltip>
      ) : <Text type="secondary" style={{ fontSize: 11 }}>System</Text>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (sev) => {
        const cfg = severityConfig[sev] || severityConfig.info;
        return <Tag icon={cfg.icon} color={cfg.color} style={{ fontSize: 10 }}>{sev}</Tag>;
      },
    },
  ];

  const handleReset = () => {
    setFilters({ category: '', action: '', severity: '', search: '', page: 1 });
    setDateRange(null);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Audit Log</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>{data?.pagination?.total || 0} events</Text>
        </div>
        <Button size="small" icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Stats */}
      {data?.stats && (
        <Card size="small" styles={{ body: { padding: 12 } }} style={{ flexShrink: 0 }}>
          <Space wrap size={12}>
            {Object.entries(data.stats).map(([cat, count]) => {
              const cfg = categoryConfig[cat] || categoryConfig.system;
              return (
                <div key={cat} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setFilters({ ...filters, category: cat })}>
                  <div style={{ color: cfg.color, fontSize: 18, fontWeight: 600 }}>{count}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'capitalize' }}>{cat}</div>
                </div>
              );
            })}
          </Space>
        </Card>
      )}

      {/* Filters */}
      <Card size="small" styles={{ body: { padding: 12 } }} style={{ flexShrink: 0 }}>
        <Space wrap size={8} className="filter-bar">
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            style={{ width: 180 }}
            size="small"
            allowClear
          />
          <Select
            value={filters.category || 'all'}
            onChange={(v) => setFilters({ ...filters, category: v === 'all' ? '' : v, page: 1 })}
            style={{ width: 110 }}
            size="small"
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'user', label: 'User' },
              { value: 'ticket', label: 'Ticket' },
              { value: 'agent', label: 'Agent' },
              { value: 'admin', label: 'Admin' },
              { value: 'system', label: 'System' },
            ]}
          />
          <Select
            value={filters.severity || 'all'}
            onChange={(v) => setFilters({ ...filters, severity: v === 'all' ? '' : v, page: 1 })}
            style={{ width: 100 }}
            size="small"
            options={[
              { value: 'all', label: 'All Severity' },
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' },
              { value: 'critical', label: 'Critical' },
            ]}
          />
          <RangePicker size="small" value={dateRange} onChange={setDateRange} style={{ width: 220 }} />
          <Button size="small" onClick={handleReset} style={filterButtonStyle}>Reset</Button>
        </Space>
      </Card>

      {/* Table */}
      <Card size="small" styles={{ body: { padding: 0 } }} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={data?.logs || []}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ y: 'calc(100vh - 370px)' }}
          pagination={{
            current: filters.page,
            pageSize: 50,
            total: data?.pagination?.total || 0,
            onChange: (page) => setFilters({ ...filters, page }),
            showTotal: (total) => <span style={{ fontSize: 11 }}>{total} events</span>,
            size: 'small',
          }}
        />
      </Card>
    </div>
  );
}
