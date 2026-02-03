import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentTicket, useAgentReply, useAgentUpdateTicket, useReassignTicket } from '../api/useAgent';
import { Input, Button, Tag, Typography, Spin, Empty, Space, Select, Avatar, Alert, Collapse, Divider, Tooltip } from 'antd';
import {
  ArrowLeftOutlined, SendOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, UserOutlined, RobotOutlined, ReloadOutlined,
  WarningOutlined, ThunderboltOutlined, SettingOutlined, SwapOutlined, SyncOutlined,
} from '@ant-design/icons';
import { SLADisplay, ManualReviewBadge, ReopenBadge, AgentSelect } from '../../tickets/components';
import { getSLAStatus } from '../../tickets/utils/slaUtils';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function AgentChatPage({ backPath = '/agent/tickets' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const { data, isLoading, refetch, isFetching } = useAgentTicket(id);
  const replyMutation = useAgentReply(id);
  const updateMutation = useAgentUpdateTicket(id);
  const reassignMutation = useReassignTicket(id);

  const ticket = data?.ticket;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.conversation?.length]);

  const handleSend = () => {
    if (!message.trim() || replyMutation.isPending) return;
    replyMutation.mutate({ message: message.trim(), useAI: false }, {
      onSuccess: () => setMessage(''),
    });
  };

  const handleAIReply = () => {
    replyMutation.mutate({ message: '', useAI: true });
  };

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="Ticket not found">
          <Button onClick={() => navigate(backPath)}>Back to tickets</Button>
        </Empty>
      </div>
    );
  }

  const statusConfig = {
    open: { color: 'orange', icon: <ClockCircleOutlined /> },
    'in-progress': { color: 'blue', icon: <ExclamationCircleOutlined /> },
    resolved: { color: 'green', icon: <CheckCircleOutlined /> },
    closed: { color: 'default', icon: <CheckCircleOutlined /> },
  };

  const status = statusConfig[ticket.status] || statusConfig.open;
  const slaStatus = ticket.slaDueAt ? getSLAStatus(ticket.slaDueAt, ticket.slaBreached) : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #303030', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate(backPath)} />
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0, fontSize: 14 }}>{ticket.subject}</Title>
          <Space size={4} style={{ marginTop: 2 }} wrap>
            <Tag color={status.color} icon={status.icon} style={{ fontSize: 10 }}>{ticket.status}</Tag>
            <Tag style={{ fontSize: 10 }}>{ticket.priority}</Tag>
            <Tag style={{ fontSize: 10 }}>{ticket.category}</Tag>
            <SLADisplay slaDueAt={ticket.slaDueAt} slaBreached={ticket.slaBreached} status={ticket.status} />
            <ManualReviewBadge needsManualReview={ticket.needsManualReview} />
            <ReopenBadge reopenCount={ticket.reopenCount} reopenedAt={ticket.reopenedAt} />
            <Text type="secondary" style={{ fontSize: 11 }}>{ticket.customerEmail}</Text>
          </Space>
        </div>
        <Tooltip title={isFetching ? 'Refreshing...' : 'Auto-refreshes every 10s'}>
          <Button size="small" icon={isFetching ? <SyncOutlined spin /> : <ReloadOutlined />} onClick={() => refetch()} />
        </Tooltip>
      </div>

      {/* Settings Panel */}
      <Collapse
        ghost
        size="small"
        items={[{
          key: 'settings',
          label: <span style={{ fontSize: 12 }}><SettingOutlined /> Settings</span>,
          children: (
            <div>
              <Space wrap size={8}>
                <Select value={ticket.status} onChange={(v) => updateMutation.mutate({ status: v })} style={{ width: 110 }} size="small"
                  options={[{ value: 'open', label: 'Open' }, { value: 'in-progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }]} />
                <Select value={ticket.priority} onChange={(v) => updateMutation.mutate({ priority: v })} style={{ width: 100 }} size="small"
                  options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
                <Select value={ticket.category} onChange={(v) => updateMutation.mutate({ category: v })} style={{ width: 110 }} size="small"
                  options={[{ value: 'account', label: 'Account' }, { value: 'billing', label: 'Billing' }, { value: 'technical', label: 'Technical' }, { value: 'gameplay', label: 'Gameplay' }, { value: 'security', label: 'Security' }, { value: 'general', label: 'General' }]} />
              </Space>
              
              {/* Agent Reassignment */}
              <Divider style={{ margin: '12px 0', borderColor: '#303030' }} />
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  <SwapOutlined /> Reassign to Agent
                </Text>
                <AgentSelect
                  currentAgentId={ticket.assignedToId}
                  ticketCategory={ticket.category}
                  onSelect={(agentId) => reassignMutation.mutate(agentId)}
                  disabled={reassignMutation.isPending || ticket.status === 'resolved' || ticket.status === 'closed'}
                  placeholder="Select agent to reassign"
                />
              </div>
              
              {/* Reopen History */}
              {ticket.reopenCount > 0 && (
                <>
                  <Divider style={{ margin: '12px 0', borderColor: '#303030' }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                      <ReloadOutlined /> Reopen History
                    </Text>
                    <Text style={{ fontSize: 12 }}>
                      Reopened {ticket.reopenCount} time{ticket.reopenCount > 1 ? 's' : ''}
                    </Text>
                    {ticket.reopenedAt && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        Last reopened: {new Date(ticket.reopenedAt).toLocaleString()}
                      </Text>
                    )}
                  </div>
                </>
              )}
            </div>
          ),
        }]}
      />

      {/* SLA Alert - Show for breached or at-risk */}
      {ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.slaDueAt && (
        <>
          {slaStatus === 'breached' && (
            <Alert
              description={<span style={{ fontSize: 12 }}>SLA BREACHED - Due: {new Date(ticket.slaDueAt).toLocaleString()}</span>}
              type="error"
              showIcon
              icon={<WarningOutlined />}
              style={{ margin: '0 16px', padding: '6px 12px' }}
            />
          )}
          {slaStatus === 'at-risk' && (
            <Alert
              description={<span style={{ fontSize: 12 }}>SLA AT RISK - Due: {new Date(ticket.slaDueAt).toLocaleString()}</span>}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ margin: '0 16px', padding: '6px 12px' }}
            />
          )}
        </>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {ticket.conversation?.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'customer' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              {msg.role !== 'customer' && (
                <Avatar size={28} icon={msg.role === 'agent' ? <RobotOutlined /> : <ExclamationCircleOutlined />}
                  style={{ background: msg.role === 'agent' ? '#22c55e' : '#404040', marginRight: 8 }} />
              )}
              <div style={{
                maxWidth: '70%', padding: '10px 14px',
                borderRadius: msg.role === 'customer' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'customer' ? '#22c55e' : msg.role === 'agent' ? '#262626' : '#1f1f1f',
                color: msg.role === 'customer' ? '#fff' : '#e5e5e5',
                border: msg.role === 'agent' ? '1px solid #303030' : 'none',
              }}>
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13, color: 'inherit' }}>{msg.content}</Paragraph>
                {msg.timestamp && (
                  <Text style={{ fontSize: 10, display: 'block', marginTop: 2, color: msg.role === 'customer' ? 'rgba(255,255,255,0.7)' : '#737373' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.agentEmail && ` • ${msg.agentEmail}`}
                  </Text>
                )}
              </div>
              {msg.role === 'customer' && (
                <Avatar size={28} icon={<UserOutlined />} style={{ background: '#16a34a', marginLeft: 8 }} />
              )}
            </div>
          ))}
          {replyMutation.isPending && (
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <Avatar size={28} icon={<RobotOutlined />} style={{ background: '#22c55e', marginRight: 8 }} />
              <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#262626', border: '1px solid #303030' }}>
                <Spin size="small" /> <Text type="secondary" style={{ fontSize: 12 }}>Sending...</Text>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {ticket.status !== 'closed' && (
        <div style={{ padding: 16, borderTop: '1px solid #303030', background: '#1f1f1f' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 8 }}>
            <TextArea
              rows={2}
              placeholder="Type your reply..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={replyMutation.isPending}
              style={{ fontSize: 13 }}
            />
            <Space.Compact>
              <Button size="small" icon={<ThunderboltOutlined />} onClick={handleAIReply} disabled={replyMutation.isPending} title="AI Reply">AI</Button>
              <Button size="small" type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!message.trim() || replyMutation.isPending}>Send</Button>
            </Space.Compact>
          </div>
        </div>
      )}
    </div>
  );
}
