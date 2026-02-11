import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentTicket, useAgentReply, useAgentUpdateTicket, useReassignTicket } from '../api/useAgent';
import { Input, Button, Tag, Typography, Spin, Empty, Space, Select, Avatar, Alert, Collapse, Divider, Tooltip, Modal, message as antdMessage } from 'antd';
import {
  ArrowLeftOutlined, SendOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, UserOutlined, RobotOutlined, ReloadOutlined,
  WarningOutlined, ThunderboltOutlined, SettingOutlined, SwapOutlined, SyncOutlined,
} from '@ant-design/icons';
import { SLADisplay, ManualReviewBadge, ReopenBadge, AgentSelect } from '../../tickets/components';
import { getSLAStatus } from '../../tickets/utils/slaUtils';
import { useAuthStore } from '../../../store/authStore';
import { a2aApi } from '../../../api/client';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function AgentChatPage({ backPath = '/agent/tickets' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [replyMessage, setReplyMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [remarkModal, setRemarkModal] = useState({ open: false, action: null, payload: null, title: '' });
  const [remarkText, setRemarkText] = useState('');
  const [a2aState, setA2aState] = useState({ open: false, loading: false, error: null, task: null, data: null });
  const [a2aRemark, setA2aRemark] = useState('');
  const [a2aApplyLoading, setA2aApplyLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isAdminUser = currentUser?.role === 'admin';
  const isAgentUser = currentUser?.role === 'agent';

  const { data, isLoading, refetch, isFetching } = useAgentTicket(id);
  const replyMutation = useAgentReply(id);
  const updateMutation = useAgentUpdateTicket(id);
  const reassignMutation = useReassignTicket(id);

  const ticket = data?.ticket;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.conversation?.length]);

  const handleSend = () => {
    if (!replyMessage.trim() || replyMutation.isPending) return;
    replyMutation.mutate({ message: replyMessage.trim(), useAI: false }, {
      onSuccess: () => setReplyMessage(''),
    });
  };

  const handleAIReply = () => {
    replyMutation.mutate({ message: '', useAI: true });
  };

  const extractA2AData = (task) => {
    const artifact = task?.artifacts?.find((a) => a.name === 'ticket-fix');
    const artifactData = artifact?.parts?.find((p) => p.type === 'data')?.data;
    if (artifactData) return artifactData;

    const history = task?.history || [];
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const part = history[i]?.parts?.find((p) => p.type === 'data');
      if (part?.data) return part.data;
    }
    return null;
  };

  const handleA2AAnalyze = async () => {
    if (!id) return;
    setA2aState({ open: true, loading: true, error: null, task: null, data: null });
    setA2aRemark('');
    try {
      const result = await a2aApi.analyzeTicket(id);
      const data = extractA2AData(result);
      setA2aState({ open: true, loading: false, error: null, task: result, data });
    } catch (err) {
      setA2aState({ open: true, loading: false, error: err.message || 'Failed to run A2A analysis', task: null, data: null });
    }
  };

  const handleA2AApply = async () => {
    const updates = a2aState.data?.proposedUpdates;
    if (!updates || Object.keys(updates).length === 0) return;
    const trimmed = a2aRemark.trim();
    if (isAgentUser && !trimmed) {
      antdMessage.error('Remark is required for agent updates');
      return;
    }
    setA2aApplyLoading(true);
    try {
      const result = await a2aApi.applyTicketUpdates(id, updates, trimmed || undefined);
      const data = extractA2AData(result);
      setA2aState({ open: true, loading: false, error: null, task: result, data });
      setA2aRemark('');
      antdMessage.success('A2A updates applied');
      refetch();
    } catch (err) {
      antdMessage.error(err.message || 'Failed to apply A2A updates');
    } finally {
      setA2aApplyLoading(false);
    }
  };

  const openRemarkModal = (action, payload, title) => {
    setRemarkText('');
    setRemarkModal({ open: true, action, payload, title });
  };

  const closeRemarkModal = () => {
    setRemarkModal({ open: false, action: null, payload: null, title: '' });
    setRemarkText('');
  };

  const submitRemark = () => {
    const trimmed = remarkText.trim();
    if (isAgentUser && !trimmed) {
      antdMessage.error('Remark is required for ticket updates');
      return;
    }

    const remarkPayload = trimmed ? { remark: trimmed } : {};
    if (remarkModal.action === 'reassign') {
      reassignMutation.mutate({ agentId: remarkModal.payload.agentId, ...remarkPayload });
    } else {
      updateMutation.mutate({ ...remarkModal.payload, ...remarkPayload });
    }

    closeRemarkModal();
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
        <Button size="small" icon={<ThunderboltOutlined />} onClick={handleA2AAnalyze} loading={a2aState.loading}>
          A2A Assist
        </Button>
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
                <Select value={ticket.status} onChange={(v) => openRemarkModal('update', { status: v }, 'Update Status')} style={{ width: 110 }} size="small"
                  options={[{ value: 'open', label: 'Open' }, { value: 'in-progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }]} />
                <Select value={ticket.priority} onChange={(v) => openRemarkModal('update', { priority: v }, 'Update Priority')} style={{ width: 100 }} size="small"
                  options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
                <Select value={ticket.category} onChange={(v) => openRemarkModal('update', { category: v }, 'Update Category')} style={{ width: 110 }} size="small"
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
                  onSelect={(agentId) => openRemarkModal('reassign', { agentId }, 'Reassign Ticket')}
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
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              disabled={replyMutation.isPending}
              style={{ fontSize: 13 }}
            />
            <Space.Compact>
              <Button size="small" icon={<ThunderboltOutlined />} onClick={handleAIReply} disabled={replyMutation.isPending} title="AI Reply">AI</Button>
              <Button size="small" type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!replyMessage.trim() || replyMutation.isPending}>Send</Button>
            </Space.Compact>
          </div>
        </div>
      )}

      <Modal
        title={remarkModal.title || 'Add Remark'}
        open={remarkModal.open}
        onCancel={closeRemarkModal}
        onOk={submitRemark}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ loading: updateMutation.isPending || reassignMutation.isPending }}
      >
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          {isAgentUser ? 'Remark is required and visible to the user and admins.' : 'Remark is optional and visible to the user and admins.'}
        </Text>
        <TextArea
          rows={3}
          maxLength={500}
          placeholder={isAgentUser ? 'Enter remark (required)' : 'Enter remark (optional)'}
          value={remarkText}
          onChange={(e) => setRemarkText(e.target.value)}
        />
      </Modal>

      <Modal
        title="A2A Ticket Assistant"
        open={a2aState.open}
        onCancel={() => setA2aState((prev) => ({ ...prev, open: false }))}
        footer={null}
        width={560}
      >
        {a2aState.loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin />
          </div>
        )}
        {!a2aState.loading && a2aState.error && (
          <Alert type="error" message={a2aState.error} showIcon />
        )}
        {!a2aState.loading && !a2aState.error && (
          <>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              Suggested Response
            </Text>
            <Input.TextArea
              rows={4}
              value={a2aState.data?.suggestedResponse || ''}
              readOnly
              placeholder="No response suggested"
              style={{ marginBottom: 8 }}
            />
            <Space style={{ marginBottom: 12 }}>
              <Button
                size="small"
                disabled={!a2aState.data?.suggestedResponse}
                onClick={() => {
                  if (!a2aState.data?.suggestedResponse) return;
                  setReplyMessage(a2aState.data.suggestedResponse);
                }}
              >
                Use Reply
              </Button>
            </Space>

            <Divider style={{ margin: '8px 0' }} />

            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              Proposed Updates
            </Text>
            {a2aState.data?.proposedUpdates && Object.keys(a2aState.data.proposedUpdates).length > 0 ? (
              <div style={{ marginBottom: 12 }}>
                {Object.entries(a2aState.data.proposedUpdates).map(([key, value]) => (
                  <Tag key={key} style={{ marginBottom: 6 }}>{key}: {String(value)}</Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>No updates proposed</Text>
            )}

            <Divider style={{ margin: '8px 0' }} />

            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              {isAgentUser ? 'Remark (required)' : 'Remark (optional)'}
            </Text>
            <Input.TextArea
              rows={3}
              maxLength={500}
              value={a2aRemark}
              onChange={(e) => setA2aRemark(e.target.value)}
              placeholder={isAgentUser ? 'Add remark to apply updates' : 'Add remark (optional)'}
              style={{ marginBottom: 12 }}
            />

            <Space>
              <Button
                type="primary"
                disabled={!a2aState.data?.proposedUpdates || Object.keys(a2aState.data.proposedUpdates || {}).length === 0}
                loading={a2aApplyLoading}
                onClick={handleA2AApply}
              >
                Apply Updates
              </Button>
              <Button onClick={() => setA2aState((prev) => ({ ...prev, open: false }))}>Close</Button>
            </Space>
          </>
        )}
      </Modal>
    </div>
  );
}
