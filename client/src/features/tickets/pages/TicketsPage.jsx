import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets, useCreateTicket } from '../api/useTickets';
import { useUIStore } from '../../../store/uiStore';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Select, Typography, Empty, Badge, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { SLADisplay } from '../components/SLADisplay';
import { formatFirstResponseTime } from './ticketsPageUtils';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Category options for filter dropdown
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'account', label: 'Account' },
  { value: 'general', label: 'General' },
];

export default function TicketsPage() {
  const navigate = useNavigate();
  const { ticketFilter, setTicketFilter, categoryFilter, setCategoryFilter, createTicketModal, openCreateTicket, closeCreateTicket } = useUIStore();
  const tableRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
  // Build filter object for API call
  const filterParams = {};
  if (ticketFilter) filterParams.status = ticketFilter;
  if (categoryFilter) filterParams.category = categoryFilter;
  
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
  
  const { data, isLoading, isFetching } = useTickets(filterParams, {
    onSuccess: restoreScrollPosition,
  });
  
  // Save scroll position when fetching starts
  useEffect(() => {
    if (isFetching && !isLoading) {
      saveScrollPosition();
    }
  }, [isFetching, isLoading, saveScrollPosition]);
  
  const createMutation = useCreateTicket();
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  const handleCreate = async (values) => {
    const result = await createMutation.mutateAsync(values);
    closeCreateTicket();
    form.resetFields();
    navigate(`/tickets/${result.ticket.id}`);
  };

  const tickets = data?.tickets || [];
  const filteredTickets = searchQuery 
    ? tickets.filter(t => t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : tickets;

  const statusConfig = {
    open: { color: 'orange', icon: <ClockCircleOutlined /> },
    'in-progress': { color: 'blue', icon: <ExclamationCircleOutlined /> },
    resolved: { color: 'green', icon: <CheckCircleOutlined /> },
    closed: { color: 'default', icon: <CheckCircleOutlined /> },
  };

  const priorityConfig = { urgent: 'red', high: 'orange', medium: 'gold', low: 'green' };

  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>{text}</Text>
          <div><Tag style={{ fontSize: 10, padding: '0 4px' }}>{record.category}</Tag></div>
        </div>
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
      render: (priority) => <Tag color={priorityConfig[priority]} style={{ fontSize: 10 }}>{priority}</Tag>,
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
      title: 'First Response',
      key: 'firstResponse',
      width: 130,
      render: (_, record) => {
        const displayText = formatFirstResponseTime(record.firstResponseAt, record.status);
        const isAwaiting = displayText === 'Awaiting Response';
        return (
          <Tooltip title={isAwaiting ? 'No agent response yet' : `First response: ${displayText}`}>
            <Text 
              style={{ 
                fontSize: 11, 
                color: isAwaiting ? '#faad14' : undefined 
              }}
            >
              {displayText}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: 'Agent',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 100,
      render: (v) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: 'Msgs',
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 60,
      render: (count) => <Badge count={count} style={{ backgroundColor: '#22c55e', fontSize: 10 }} size="small" />,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 80,
      render: (date) => <Text style={{ fontSize: 11 }}>{new Date(date).toLocaleDateString()}</Text>,
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Tickets
            {isFetching && !isLoading && (
              <Tooltip title="Auto-refreshing...">
                <SyncOutlined spin style={{ marginLeft: 8, fontSize: 14, color: '#22c55e' }} />
              </Tooltip>
            )}
          </Title>
          <Text type="secondary" style={{ fontSize: 11 }}>{tickets.length} total • Auto-refreshes every 30s</Text>
        </div>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateTicket}>New Ticket</Button>
      </div>

      <Card size="small" styles={{ body: { padding: 8 } }} style={{ flexShrink: 0 }}>
        <Space wrap size="small">
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 180 }}
            size="small"
            allowClear
          />
          <Select
            value={ticketFilter || 'all'}
            onChange={(v) => setTicketFilter(v === 'all' ? '' : v)}
            style={{ width: 120 }}
            size="small"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
          <Select
            value={categoryFilter || ''}
            onChange={(v) => setCategoryFilter(v)}
            style={{ width: 130 }}
            size="small"
            options={CATEGORY_OPTIONS}
            placeholder="Category"
          />
        </Space>
      </Card>

      <Card size="small" styles={{ body: { padding: 0 } }} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} ref={tableRef}>
        <Table
          columns={columns}
          dataSource={filteredTickets}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ y: 'calc(100vh - 290px)' }}
          onRow={(record) => ({ onClick: () => navigate(`/tickets/${record.id}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tickets" /> }}
          pagination={{ pageSize: 20, size: 'small', showTotal: (total) => <span style={{ fontSize: 11 }}>{total} tickets</span> }}
        />
      </Card>

      <Modal title="Create Ticket" open={createTicketModal} onCancel={closeCreateTicket} footer={null} width={400}>
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ priority: 'medium' }} size="small">
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input placeholder="Brief summary" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Describe your issue..." />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending} block>Create</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
