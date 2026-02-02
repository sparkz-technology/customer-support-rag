import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { agentApi } from '../../agent/api/agentApi';
import { 
  Card, Table, Tag, Select, Space, Typography, Input, Button, 
  Dropdown, DatePicker, Statistic, Row, Col, Modal, message, Tooltip 
} from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  WarningOutlined, UserOutlined, SearchOutlined,
  DownOutlined, ReloadOutlined, SyncOutlined
} from '@ant-design/icons';
import { SLADisplay, getSLAStatus, AgentSelect } from '../../tickets/components';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Status configuration
const statusConfig = {
  open: { color: 'orange', icon: <ClockCircleOutlined /> },
  'in-progress': { color: 'blue', icon: <ExclamationCircleOutlined /> },
  resolved: { color: 'green', icon: <CheckCircleOutlined /> },
  closed: { color: 'default', icon: <CheckCircleOutlined /> },
};

// Priority configuration
const priorityConfig = {
  urgent: { color: 'red' },
  high: { color: 'orange' },
  medium: { color: 'gold' },
  low: { color: 'green' },
};

// Category options
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'account', label: 'Account' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'gameplay', label: 'Gameplay' },
  { value: 'security', label: 'Security' },
  { value: 'general', label: 'General' },
];

// Status options
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// SLA filter options
const SLA_OPTIONS = [
  { value: '', label: 'All SLA' },
  { value: 'breached', label: 'Breached' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'on-track', label: 'On Track' },
];

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    sla: '',
    search: '',
    dateRange: null,
  });
  
  // Selection state for bulk operations
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Assignment modal state
  const [assignmentModal, setAssignmentModal] = useState({ open: false, ticketId: null, ticketCategory: null });

  // Pagination state
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  
  // Table ref for scroll position preservation
  const tableRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
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

  // Build query params - direct object creation since React Query handles memoization internally
  const queryParams = {
    ...(filters.status && { status: filters.status }),
    ...(filters.category && { category: filters.category }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.search && { search: filters.search }),
    page: pagination.current,
    limit: pagination.pageSize,
  };

  // Fetch tickets
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-tickets', filters.status, filters.category, filters.priority, filters.search, pagination.current, pagination.pageSize],
    queryFn: () => adminApi.getTickets(queryParams),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    onSuccess: restoreScrollPosition,
  });
  
  // Save scroll position when fetching starts
  useEffect(() => {
    if (isFetching && !isLoading) {
      saveScrollPosition();
    }
  }, [isFetching, isLoading, saveScrollPosition]);

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ticketIds, updates }) => {
      const promises = ticketIds.map(id => 
        agentApi.updateTicket(id, updates)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setSelectedRowKeys([]);
      message.success('Tickets updated successfully');
    },
    onError: (err) => {
      message.error(err.message || 'Failed to update tickets');
    },
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: ({ ticketId, agentId }) => agentApi.updateTicket(ticketId, { assignedToId: agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setAssignmentModal({ open: false, ticketId: null, ticketCategory: null });
      message.success('Agent assigned successfully');
    },
    onError: (err) => {
      message.error(err.message || 'Failed to assign agent');
    },
  });

  // Memoize tickets to ensure stable reference for downstream useMemos
  // Without this, the || [] fallback would create a new array each render when data?.tickets is undefined
  const tickets = useMemo(() => data?.tickets || [], [data?.tickets]);
  const total = data?.pagination?.total || tickets.length;

  // Calculate SLA statistics
  const slaStats = useMemo(() => {
    const stats = { breached: 0, atRisk: 0, onTrack: 0 };
    tickets.forEach(ticket => {
      if (ticket.status === 'resolved' || ticket.status === 'closed') return;
      const status = getSLAStatus(ticket.slaDueAt, ticket.slaBreached);
      if (status === 'breached') stats.breached++;
      else if (status === 'at-risk') stats.atRisk++;
      else stats.onTrack++;
    });
    const activeTickets = stats.breached + stats.atRisk + stats.onTrack;
    stats.breachRate = activeTickets > 0 ? Math.round((stats.breached / activeTickets) * 100) : 0;
    return stats;
  }, [tickets]);

  // Filter tickets by SLA status (client-side since backend may not support)
  const filteredTickets = useMemo(() => {
    let result = tickets;
    
    if (filters.sla) {
      result = result.filter(ticket => {
        if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
        const status = getSLAStatus(ticket.slaDueAt, ticket.slaBreached);
        return status === filters.sla;
      });
    }
    
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const [start, end] = filters.dateRange;
      result = result.filter(ticket => {
        const created = new Date(ticket.createdAt);
        return created >= start.startOf('day').toDate() && created <= end.endOf('day').toDate();
      });
    }
    
    return result;
  }, [tickets, filters.sla, filters.dateRange]);

  // Handle bulk status update
  const handleBulkStatusUpdate = (newStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select tickets first');
      return;
    }
    bulkUpdateMutation.mutate({ ticketIds: selectedRowKeys, updates: { status: newStatus } });
  };

  // Bulk action menu items
  const bulkActionItems = [
    { key: 'open', label: 'Set Open', onClick: () => handleBulkStatusUpdate('open') },
    { key: 'in-progress', label: 'Set In Progress', onClick: () => handleBulkStatusUpdate('in-progress') },
    { key: 'resolved', label: 'Set Resolved', onClick: () => handleBulkStatusUpdate('resolved') },
    { key: 'closed', label: 'Set Closed', onClick: () => handleBulkStatusUpdate('closed') },
  ];

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  // Table columns
  const columns = [
    {
      title: 'Ticket',
      key: 'ticket',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong style={{ fontSize: 12 }}>{record.subject}</Text>
            {record.slaBreached && (
              <Tag color="red" icon={<WarningOutlined />} style={{ fontSize: 10, padding: '0 4px' }}>SLA</Tag>
            )}
            {record.needsManualReview && (
              <Tag color="purple" style={{ fontSize: 10, padding: '0 4px' }}>Review</Tag>
            )}
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
      width: 90,
      render: (_, record) => (
        <SLADisplay 
          slaDueAt={record.slaDueAt} 
          slaBreached={record.slaBreached} 
          status={record.status} 
        />
      ),
    },
    {
      title: 'Assigned',
      key: 'assignedTo',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <Text style={{ fontSize: 11 }}>{record.assignedTo || 'Unassigned'}</Text>
          <Button 
            type="link" 
            size="small" 
            style={{ fontSize: 10, padding: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setAssignmentModal({ 
                open: true, 
                ticketId: record.id, 
                ticketCategory: record.category 
              });
            }}
          >
            Change
          </Button>
        </Space>
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
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <Title level={4} style={{ margin: 0 }}>
          Ticket Management
          {isFetching && !isLoading && (
            <Tooltip title="Auto-refreshing...">
              <SyncOutlined spin style={{ marginLeft: 8, fontSize: 14, color: '#22c55e' }} />
            </Tooltip>
          )}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>{total} total tickets • Auto-refreshes every 30s</Text>
      </div>

      {/* SLA Statistics */}
      <Row gutter={[12, 12]} style={{ flexShrink: 0 }}>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic 
              title={<span style={{ fontSize: 11 }}>SLA Breached</span>} 
              value={slaStats.breached}
              valueStyle={{ color: '#ef4444', fontSize: 20 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic 
              title={<span style={{ fontSize: 11 }}>At Risk</span>} 
              value={slaStats.atRisk}
              valueStyle={{ color: '#f59e0b', fontSize: 20 }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic 
              title={<span style={{ fontSize: 11 }}>On Track</span>} 
              value={slaStats.onTrack}
              valueStyle={{ color: '#22c55e', fontSize: 20 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic 
              title={<span style={{ fontSize: 11 }}>Breach Rate</span>} 
              value={slaStats.breachRate}
              valueStyle={{ color: slaStats.breachRate > 10 ? '#ef4444' : '#22c55e', fontSize: 20 }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" styles={{ body: { padding: 12 } }} style={{ flexShrink: 0 }}>
        <Space wrap size={8}>
          <Input
            placeholder="Search subject/email..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 200 }}
            size="small"
            allowClear
          />
          <Select
            value={filters.status || ''}
            onChange={(v) => setFilters({ ...filters, status: v })}
            style={{ width: 120 }}
            size="small"
            options={STATUS_OPTIONS}
          />
          <Select
            value={filters.category || ''}
            onChange={(v) => setFilters({ ...filters, category: v })}
            style={{ width: 130 }}
            size="small"
            options={CATEGORY_OPTIONS}
          />
          <Select
            value={filters.priority || ''}
            onChange={(v) => setFilters({ ...filters, priority: v })}
            style={{ width: 120 }}
            size="small"
            options={PRIORITY_OPTIONS}
          />
          <Select
            value={filters.sla || ''}
            onChange={(v) => setFilters({ ...filters, sla: v })}
            style={{ width: 110 }}
            size="small"
            options={SLA_OPTIONS}
          />
          <RangePicker
            size="small"
            style={{ width: 220 }}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            placeholder={['Start Date', 'End Date']}
          />
          <Button 
            icon={<ReloadOutlined />} 
            size="small" 
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card size="small" styles={{ body: { padding: 8 } }} style={{ flexShrink: 0 }}>
          <Space>
            <Text style={{ fontSize: 12 }}>{selectedRowKeys.length} selected</Text>
            <Dropdown menu={{ items: bulkActionItems }} trigger={['click']}>
              <Button size="small" loading={bulkUpdateMutation.isPending}>
                Bulk Actions <DownOutlined />
              </Button>
            </Dropdown>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>
              Clear Selection
            </Button>
          </Space>
        </Card>
      )}

      {/* Tickets Table */}
      <Card size="small" styles={{ body: { padding: 0 } }} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} ref={tableRef}>
        <Table
          columns={columns}
          dataSource={filteredTickets}
          rowKey="id"
          loading={isLoading}
          size="small"
          rowSelection={rowSelection}
          scroll={{ y: 'calc(100vh - 420px)' }}
          onRow={(record) => ({
            onClick: () => navigate(`/agent/tickets/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showTotal: (total) => `${total} tickets`,
            size: 'small',
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      </Card>

      {/* Agent Assignment Modal */}
      <Modal
        title="Assign Agent"
        open={assignmentModal.open}
        onCancel={() => setAssignmentModal({ open: false, ticketId: null, ticketCategory: null })}
        footer={null}
        width={400}
      >
        <div style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
            Select an agent to assign this ticket:
          </Text>
          <AgentSelect
            ticketCategory={assignmentModal.ticketCategory}
            onSelect={(agentId) => {
              assignMutation.mutate({ 
                ticketId: assignmentModal.ticketId, 
                agentId 
              });
            }}
            placeholder="Select agent..."
          />
          {assignMutation.isPending && (
            <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
              Assigning agent...
            </Text>
          )}
        </div>
      </Modal>
    </div>
  );
}
