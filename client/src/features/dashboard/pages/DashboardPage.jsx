import { useDashboardMetrics, useSlaAlerts } from '../api/useDashboard';
import { Card, Row, Col, Statistic, Progress, List, Tag, Typography, Spin, Button, Empty, Divider } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  RobotOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { data: metrics, isLoading, refetch, isFetching } = useDashboardMetrics();
  const { data: alerts } = useSlaAlerts();

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const stats = [
    { title: 'Total', value: metrics?.overview?.totalTickets || 0, icon: <FileTextOutlined />, color: '#22c55e' },
    { title: 'Open', value: metrics?.overview?.openTickets || 0, icon: <ClockCircleOutlined />, color: '#f59e0b' },
    { title: 'In Progress', value: metrics?.overview?.inProgressTickets || 0, icon: <ExclamationCircleOutlined />, color: '#3b82f6' },
    { title: 'Resolved', value: metrics?.overview?.resolvedTickets || 0, icon: <CheckCircleOutlined />, color: '#22c55e' },
  ];

  const priorityColors = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Real-time metrics</Text>
        </div>
        <Button size="small" icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()}>Refresh</Button>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {stats.map((stat) => (
          <Col xs={12} sm={6} key={stat.title}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title={<span style={{ fontSize: 11 }}>{stat.title}</span>}
                value={stat.value}
                prefix={<span style={{ color: stat.color, fontSize: 14 }}>{stat.icon}</span>}
                style={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Card size="small" title={<span style={{ fontSize: 13 }}><ThunderboltOutlined style={{ color: '#f59e0b' }} /> SLA</span>} styles={{ body: { padding: 12 } }}>
            <Row gutter={8}>
              <Col span={8}>
                <Statistic title={<span style={{ fontSize: 10 }}>Rate</span>} value={metrics?.sla?.breachRate || '0%'} />
              </Col>
              <Col span={8}>
                <Statistic title={<span style={{ fontSize: 10 }}>Breached</span>} value={metrics?.sla?.breachedCount || 0} />
              </Col>
              <Col span={8}>
                <Statistic title={<span style={{ fontSize: 10 }}>At Risk</span>} value={metrics?.sla?.atRiskCount || 0} />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card size="small" title={<span style={{ fontSize: 13 }}><ClockCircleOutlined style={{ color: '#3b82f6' }} /> Response</span>} styles={{ body: { padding: 12 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Avg Response</Text>
              <Text strong style={{ fontSize: 13 }}>{metrics?.responseTime?.averageFormatted || 'N/A'}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Avg Resolution</Text>
              <Text strong style={{ fontSize: 13 }}>{metrics?.resolutionTime?.averageFormatted || 'N/A'}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Resolved</Text>
              <Text strong style={{ fontSize: 13, color: '#22c55e' }}>{metrics?.resolutionTime?.totalResolved || 0}</Text>
            </div>
            <Divider style={{ margin: '8px 0', borderColor: '#303030' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}><RobotOutlined /> AI Deflection</Text>
              <Text strong style={{ fontSize: 13, color: '#8b5cf6' }}>{metrics?.aiMetrics?.deflectionRate || '0%'}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Avg Resolution (hrs)</Text>
              <Text strong style={{ fontSize: 13 }}>{metrics?.aiMetrics?.averageResolutionHours ?? 'N/A'}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card size="small" title={<span style={{ fontSize: 13 }}>Priority</span>} styles={{ body: { padding: 12 } }}>
            <Row gutter={[6, 6]}>
              {['urgent', 'high', 'medium', 'low'].map((p) => {
                const count = metrics?.distribution?.byPriority?.find(x => x.priority === p)?.count || 0;
                return (
                  <Col span={12} key={p}>
                    <div style={{ background: `${priorityColors[p]}10`, padding: '6px 8px', borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: priorityColors[p] }}>{count}</div>
                      <div style={{ fontSize: 10, textTransform: 'capitalize', color: '#6b7280' }}>{p}</div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} md={12}>
          <Card size="small" title={<span style={{ fontSize: 13 }}><TeamOutlined style={{ color: '#22c55e' }} /> Agents</span>} styles={{ body: { padding: 8 } }}>
            {metrics?.agents?.length > 0 ? (
              <List
                size="small"
                dataSource={metrics.agents}
                renderItem={(agent) => {
                  const util = parseInt(agent.utilization);
                  const color = util > 80 ? '#ef4444' : util > 50 ? '#f59e0b' : '#22c55e';
                  return (
                    <List.Item style={{ padding: '6px 0' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 12 }}>{agent.name}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{agent.currentLoad}/{agent.maxLoad}</Text>
                        </div>
                        <Progress percent={util} strokeColor={color} showInfo={false} size="small" style={{ marginBottom: 0 }} />
                      </div>
                    </List.Item>
                  );
                }}
              />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No agents" style={{ margin: '12px 0' }} />}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card size="small" title={<span style={{ fontSize: 13 }}><ExclamationCircleOutlined style={{ color: '#ef4444' }} /> SLA Alerts</span>} styles={{ body: { padding: 8, maxHeight: 200, overflow: 'auto' } }}>
            {(alerts?.atRisk?.length > 0 || alerts?.breached?.length > 0) ? (
              <List
                size="small"
                dataSource={[...(alerts?.breached || []).map(t => ({ ...t, type: 'breached' })), ...(alerts?.atRisk || []).map(t => ({ ...t, type: 'atRisk' }))]}
                renderItem={(ticket) => (
                  <List.Item style={{ padding: '4px 0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text ellipsis style={{ maxWidth: 180, fontSize: 12 }}>{ticket.subject}</Text>
                        <Tag color={ticket.type === 'breached' ? 'red' : 'orange'} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                          {ticket.type === 'breached' ? 'BREACH' : 'RISK'}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 10 }}>{ticket.customerEmail}</Text>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#22c55e' }} />
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>All within SLA</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card size="small" title={<span style={{ fontSize: 13 }}>Categories</span>} style={{ marginTop: 12 }} styles={{ body: { padding: 12 } }}>
        <Row gutter={[8, 8]}>
          {metrics?.distribution?.byCategory?.map(({ category, count }) => {
            const total = metrics.overview.totalTickets || 1;
            const percent = Math.round((count / total) * 100);
            return (
              <Col xs={8} sm={4} key={category}>
                <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: 4, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#22c55e' }}>{count}</div>
                  <div style={{ fontSize: 10, textTransform: 'capitalize', color: '#6b7280' }}>{category}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{percent}%</div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
}
