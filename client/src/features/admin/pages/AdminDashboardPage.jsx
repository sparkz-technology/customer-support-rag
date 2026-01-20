import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { Card, Row, Col, Statistic, Progress, List, Typography, Spin, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, WarningOutlined,
  TeamOutlined, UserOutlined, SafetyOutlined, SyncOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const stats = data?.stats;

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const quickLinks = [
    { title: 'All Tickets', icon: <FileTextOutlined />, path: '/admin/tickets', color: '#22c55e' },
    { title: 'Agents', icon: <TeamOutlined />, path: '/admin/agents', color: '#3b82f6' },
    { title: 'Users', icon: <UserOutlined />, path: '/admin/users', color: '#8b5cf6' },
    { title: 'Agent View', icon: <SafetyOutlined />, path: '/agent/tickets', color: '#f59e0b' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Admin Dashboard
          {isFetching && !isLoading && (
            <Tooltip title="Auto-refreshing...">
              <SyncOutlined spin style={{ marginLeft: 8, fontSize: 14, color: '#22c55e' }} />
            </Tooltip>
          )}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>System overview • Auto-refreshes every 30s</Text>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Total Tickets</span>} value={stats?.tickets?.total || 0}
              prefix={<FileTextOutlined style={{ color: '#22c55e', fontSize: 14 }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Open</span>} value={stats?.tickets?.open || 0}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b', fontSize: 14 }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Resolved</span>} value={stats?.tickets?.resolved || 0}
              prefix={<CheckCircleOutlined style={{ color: '#22c55e', fontSize: 14 }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Breached</span>} value={stats?.tickets?.breached || 0}
              prefix={<WarningOutlined style={{ color: '#ef4444', fontSize: 14 }} />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Users</span>} value={stats?.users?.total || 0}
              prefix={<UserOutlined style={{ color: '#8b5cf6', fontSize: 14 }} />} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Active Agents</span>} value={stats?.agents?.active || 0}
              suffix={<span style={{ fontSize: 12 }}>/ {stats?.agents?.total || 0}</span>}
              prefix={<TeamOutlined style={{ color: '#22c55e', fontSize: 14 }} />} />
          </Card>
        </Col>
      </Row>

      {stats?.agentWorkloads?.length > 0 && (
        <Card size="small" title={<span style={{ fontSize: 13 }}>Agent Workloads</span>} style={{ marginBottom: 16 }} styles={{ body: { padding: 8 } }}>
          <List
            size="small"
            dataSource={stats.agentWorkloads}
            renderItem={(agent) => {
              const util = Math.round((agent.currentLoad / agent.maxLoad) * 100);
              const color = util > 80 ? '#ef4444' : util > 50 ? '#f59e0b' : '#22c55e';
              return (
                <List.Item style={{ padding: '6px 0' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ fontSize: 12 }}>{agent.name}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{agent.currentLoad}/{agent.maxLoad}</Text>
                    </div>
                    <Progress percent={util} strokeColor={color} showInfo={false} size="small" />
                  </div>
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      <Card size="small" title={<span style={{ fontSize: 13 }}>Quick Actions</span>} styles={{ body: { padding: 12 } }}>
        <Row gutter={[12, 12]}>
          {quickLinks.map((link) => (
            <Col xs={12} sm={6} key={link.title}>
              <Card size="small" hoverable style={{ textAlign: 'center' }} styles={{ body: { padding: 12 } }} onClick={() => navigate(link.path)}>
                <div style={{ color: link.color, fontSize: 20, marginBottom: 4 }}>{link.icon}</div>
                <Text style={{ fontSize: 12 }}>{link.title}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
