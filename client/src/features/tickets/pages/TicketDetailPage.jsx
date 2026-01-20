import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicket, useSendMessage, useUpdateTicketStatus } from '../api/useTickets';
import { Input, Button, Tag, Typography, Spin, Empty, Space, Dropdown, Avatar, Alert, notification, Tooltip } from 'antd';
import { ArrowLeftOutlined, SendOutlined, MoreOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, UserOutlined, RobotOutlined, ReloadOutlined, WarningOutlined, StopOutlined, SyncOutlined } from '@ant-design/icons';
import { SLADisplay } from '../components/SLADisplay';
import { ReopenBadge } from '../components/TicketBadges';

const { Title, Text, Paragraph } = Typography;

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [prevReopenCount, setPrevReopenCount] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data, isLoading, refetch, isFetching } = useTicket(id);
  const sendMutation = useSendMessage(id);
  const statusMutation = useUpdateTicketStatus(id);
  const ticket = data?.ticket;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.conversation?.length]);
  useEffect(() => { if (!isLoading && ticket) inputRef.current?.focus(); }, [isLoading, ticket]);

  // Track reopen count changes and show notification
  useEffect(() => {
    if (ticket?.reopenCount !== undefined) {
      if (prevReopenCount !== null && ticket.reopenCount > prevReopenCount) {
        notification.info({
          message: 'Ticket Reopened',
          description: 'This ticket has been reopened due to a new customer reply.',
          placement: 'topRight',
        });
      }
      // Use requestAnimationFrame to defer state update
      requestAnimationFrame(() => {
        setPrevReopenCount(ticket.reopenCount);
      });
    }
  }, [ticket?.reopenCount, prevReopenCount]);

  const handleSend = async () => {
    if (!message.trim() || sendMutation.isPending) return;
    const msg = message.trim();
    setMessage('');
    await sendMutation.mutateAsync(msg);
  };

  if (isLoading) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>;
  if (!ticket) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description="Not found"><Button size="small" onClick={() => navigate('/tickets')}>Back</Button></Empty></div>;

  const statusConfig = {
    open: { color: 'orange', icon: <ClockCircleOutlined /> },
    'in-progress': { color: 'blue', icon: <ExclamationCircleOutlined /> },
    resolved: { color: 'green', icon: <CheckCircleOutlined /> },
    closed: { color: 'default', icon: <CheckCircleOutlined /> },
  };
  const status = statusConfig[ticket.status] || statusConfig.open;
  const canReply = ticket.status !== 'closed';
  const isClosed = ticket.status === 'closed';

  const menuItems = [{ key: 'resolve', label: 'Mark Resolved', icon: <CheckCircleOutlined />, disabled: ticket.status === 'resolved' || ticket.status === 'closed', onClick: () => statusMutation.mutateAsync('resolved') }];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #303030', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate('/tickets')} />
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0, fontSize: 14 }}>{ticket.subject}</Title>
          <Space size={4} style={{ marginTop: 2 }}>
            <Tag color={status.color} icon={status.icon} style={{ fontSize: 10, padding: '0 4px' }}>{ticket.status}</Tag>
            <Tag style={{ fontSize: 10, padding: '0 4px' }}>{ticket.priority}</Tag>
            <Tag style={{ fontSize: 10, padding: '0 4px' }}>{ticket.category}</Tag>
            <SLADisplay slaDueAt={ticket.slaDueAt} slaBreached={ticket.slaBreached} status={ticket.status} />
            <ReopenBadge reopenCount={ticket.reopenCount} reopenedAt={ticket.reopenedAt} />
            <Text type="secondary" style={{ fontSize: 10 }}>{ticket.assignedTo}</Text>
          </Space>
        </div>
        <Tooltip title={isFetching ? 'Refreshing...' : 'Auto-refreshes every 10s'}>
          <Button size="small" icon={isFetching ? <SyncOutlined spin /> : <ReloadOutlined />} onClick={() => refetch()} />
        </Tooltip>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}><Button size="small" icon={<MoreOutlined />} /></Dropdown>
      </div>

      {ticket.slaBreached && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
        <Alert description="SLA Breached" type="error" showIcon icon={<WarningOutlined />} style={{ margin: '8px 16px', padding: '4px 12px' }} />
      )}

      {isClosed && (
        <Alert 
          message="Ticket Closed" 
          description={ticket.closureReason ? `Reason: ${ticket.closureReason}` : 'This ticket has been closed and cannot receive new messages.'}
          type="info" 
          showIcon 
          icon={<StopOutlined />} 
          style={{ margin: '8px 16px', padding: '8px 12px' }} 
        />
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {ticket.conversation?.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'customer' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              {msg.role !== 'customer' && <Avatar size={28} icon={msg.role === 'agent' ? <RobotOutlined /> : <ExclamationCircleOutlined />} style={{ background: msg.role === 'agent' ? '#22c55e' : '#404040', marginRight: 8 }} />}
              <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: msg.role === 'customer' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: msg.role === 'customer' ? '#22c55e' : '#262626', color: msg.role === 'customer' ? '#fff' : '#e5e5e5', border: msg.role === 'agent' ? '1px solid #303030' : 'none' }}>
                <Paragraph style={{ margin: 0, fontSize: 13, color: 'inherit', whiteSpace: 'pre-wrap' }}>{msg.content}</Paragraph>
                {msg.timestamp && <Text style={{ fontSize: 10, color: msg.role === 'customer' ? 'rgba(255,255,255,0.7)' : '#737373', display: 'block', marginTop: 2 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
              </div>
              {msg.role === 'customer' && <Avatar size={28} icon={<UserOutlined />} style={{ background: '#16a34a', marginLeft: 8 }} />}
            </div>
          ))}
          {sendMutation.isPending && (
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <Avatar size={28} icon={<RobotOutlined />} style={{ background: '#22c55e', marginRight: 8 }} />
              <div style={{ padding: '8px 12px', borderRadius: '12px 12px 12px 2px', background: '#262626', border: '1px solid #303030' }}><Spin size="small" /> <Text type="secondary" style={{ fontSize: 12 }}>Thinking...</Text></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {canReply ? (
        <div style={{ padding: 12, borderTop: '1px solid #303030', background: '#1f1f1f' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 8 }}>
            <Input ref={inputRef} placeholder={ticket.status === 'resolved' ? 'Send to reopen...' : 'Type message...'} value={message} onChange={(e) => setMessage(e.target.value)} onPressEnter={handleSend} disabled={sendMutation.isPending} />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!message.trim() || sendMutation.isPending} loading={sendMutation.isPending}>Send</Button>
          </div>
        </div>
      ) : (
        <div style={{ padding: 12, borderTop: '1px solid #303030', background: '#1f1f1f', textAlign: 'center' }}><Text type="secondary" style={{ fontSize: 12 }}>Ticket closed</Text></div>
      )}
    </div>
  );
}
