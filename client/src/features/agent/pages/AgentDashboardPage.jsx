import { useAuthStore } from '../../../store/authStore';
import { useAgentStats } from '../api/useAgent';
import { Card, Row, Col, Statistic, Typography, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  const { data: stats, isLoading } = useAgentStats();

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const statCards = [
    { title: 'All Tickets', value: stats?.stats?.total || 0, icon: <FileTextOutlined />, color: '#22c55e' },
    { title: 'Open', value: stats?.stats?.open || 0, icon: <ClockCircleOutlined />, color: '#f59e0b' },
    { title: 'In Progress', value: stats?.stats?.inProgress || 0, icon: <ExclamationCircleOutlined />, color: '#3b82f6' },
    { title: 'Resolved', value: stats?.stats?.resolved || 0, icon: <CheckCircleOutlined />, color: '#22c55e' },
    { title: 'SLA Breached', value: stats?.stats?.breached || 0, icon: <WarningOutlined />, color: '#ef4444' },
    { title: 'My Tickets', value: stats?.myStats?.total || 0, icon: <TeamOutlined />, color: '#8b5cf6' },
  ];

  const quickActions = [
    { title: 'All Tickets', icon: <FileTextOutlined />, path: '/agent/tickets', color: '#22c55e' },
    { title: 'My Tickets', icon: <TeamOutlined />, path: '/agent/tickets?assignedToMe=true', color: '#3b82f6' },
    { title: 'Open', icon: <ClockCircleOutlined />, path: '/agent/tickets?status=open', color: '#f59e0b' },
    { title: 'Urgent', icon: <WarningOutlined />, path: '/agent/tickets?priority=urgent', color: '#ef4444' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Agent Dashboard</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>Welcome, {user?.agentName || user?.name}</Text>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {statCards.map((stat) => (
          <Col xs={12} sm={8} md={4} key={stat.title}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title={<span style={{ fontSize: 11 }}>{stat.title}</span>}
                value={stat.value}
                prefix={<span style={{ color: stat.color, fontSize: 14 }}>{stat.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card size="small" title={<span style={{ fontSize: 13 }}>Quick Actions</span>} styles={{ body: { padding: 12 } }}>
        <Row gutter={[12, 12]}>
          {quickActions.map((action) => (
            <Col xs={12} sm={6} key={action.title}>
              <Card
                size="small"
                hoverable
                style={{ textAlign: 'center' }}
                styles={{ body: { padding: 12 } }}
                onClick={() => navigate(action.path)}
              >
                <div style={{ color: action.color, fontSize: 20, marginBottom: 4 }}>
                  {action.icon}
                </div>
                <Text style={{ fontSize: 12 }}>{action.title}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
