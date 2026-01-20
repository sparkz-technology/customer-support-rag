import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { triageApi } from '../api/client';
import { useCreateTicket } from '../features/tickets/api/useTickets';
import toast from 'react-hot-toast';
import { Input, Button, Typography, Avatar, Spin, Space } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, DeleteOutlined, FileAddOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function AIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hi! I'm your AI support assistant. How can I help you today?" }]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const createTicketMutation = useCreateTicket();

  const chatMutation = useMutation({
    mutationFn: (message) => triageApi.analyze(message),
    onMutate: (message) => { setMessages(prev => [...prev, { role: 'user', content: message }]); },
    onSuccess: (data) => { setMessages(prev => [...prev, { role: 'assistant', content: data.response }]); },
    onError: (err) => {
      toast.error(err.message || 'Failed');
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, error occurred. Try again or create a ticket." }]);
    },
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;
    const msg = input.trim();
    setInput('');
    chatMutation.mutate(msg);
  };

  const handleClear = () => { setMessages([{ role: 'assistant', content: "Chat cleared! How can I help?" }]); toast.success('Cleared'); };

  const handleCreateTicket = async () => {
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length === 0) { toast.error('Start a conversation first'); return; }
    try {
      const result = await createTicketMutation.mutateAsync({ subject: userMsgs[0].content.slice(0, 100), description: userMsgs.map(m => m.content).join('\n\n'), priority: 'medium' });
      navigate(`/tickets/${result.ticket.id}`);
    } catch {
      // Error is handled by mutation's onError
    }
  };

  const suggestions = ["How do I reset my password?", "Help with billing", "Game keeps crashing", "Enable 2FA"];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #303030', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={32} icon={<RobotOutlined />} style={{ background: '#22c55e' }} />
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 14 }}>AI Assistant</Title>
            <Text type="secondary" style={{ fontSize: 10 }}>Ask anything</Text>
          </div>
        </div>
        <Space size="small">
          <Button size="small" icon={<FileAddOutlined />} onClick={handleCreateTicket} disabled={messages.filter(m => m.role === 'user').length === 0 || createTicketMutation.isPending}>Create Ticket</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={handleClear}>Clear</Button>
        </Space>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              {msg.role === 'assistant' && <Avatar size={28} icon={<RobotOutlined />} style={{ background: '#22c55e', marginRight: 8 }} />}
              <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: msg.role === 'user' ? '#22c55e' : '#262626', color: msg.role === 'user' ? '#fff' : '#e5e5e5', border: msg.role === 'assistant' ? '1px solid #303030' : 'none' }}>
                <Paragraph style={{ margin: 0, fontSize: 13, color: 'inherit', whiteSpace: 'pre-wrap' }}>{msg.content}</Paragraph>
              </div>
              {msg.role === 'user' && <Avatar size={28} icon={<UserOutlined />} style={{ background: '#16a34a', marginLeft: 8 }} />}
            </div>
          ))}
          {chatMutation.isPending && (
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <Avatar size={28} icon={<RobotOutlined />} style={{ background: '#22c55e', marginRight: 8 }} />
              <div style={{ padding: '8px 12px', borderRadius: '12px 12px 12px 2px', background: '#262626', border: '1px solid #303030' }}><Spin size="small" /> <Text type="secondary" style={{ fontSize: 12 }}>Thinking...</Text></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length <= 2 && !chatMutation.isPending && (
        <div style={{ padding: '0 16px 8px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
          <Text type="secondary" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><ThunderboltOutlined /> Quick</Text>
          <Space wrap size="small">{suggestions.map((s, i) => <Button key={i} size="small" onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}</Button>)}</Space>
        </div>
      )}

      <div style={{ padding: 12, borderTop: '1px solid #303030', background: '#1f1f1f' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 8 }}>
          <Input ref={inputRef} placeholder="Type your question..." value={input} onChange={(e) => setInput(e.target.value)} onPressEnter={handleSend} disabled={chatMutation.isPending} />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim() || chatMutation.isPending} loading={chatMutation.isPending}>Send</Button>
        </div>
        <div style={{ maxWidth: 700, margin: '4px auto 0', textAlign: 'center' }}><Text type="secondary" style={{ fontSize: 10 }}>Need more help? Create a ticket</Text></div>
      </div>
    </div>
  );
}
