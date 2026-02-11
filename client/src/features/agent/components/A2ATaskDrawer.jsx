import { useState } from 'react';
import { Drawer, List, Tag, Typography, Spin, Empty, Button, Space, Tooltip, Badge } from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useA2ATasks } from '../api/useA2ATasks';

const { Text, Paragraph } = Typography;

const STATUS_CONFIG = {
  completed: { color: 'green', icon: <CheckCircleOutlined />, label: 'Completed' },
  submitted: { color: 'blue', icon: <ClockCircleOutlined />, label: 'Submitted' },
  working: { color: 'processing', icon: <SyncOutlined spin />, label: 'Working' },
  'input-required': { color: 'orange', icon: <ExclamationCircleOutlined />, label: 'Input Required' },
  failed: { color: 'red', icon: <ExclamationCircleOutlined />, label: 'Failed' },
  canceled: { color: 'default', icon: <ExclamationCircleOutlined />, label: 'Canceled' },
};

/**
 * A2ATaskDrawer — shows a sliding drawer with live A2A task statuses.
 * Includes a floating button to toggle the drawer.
 */
export default function A2ATaskDrawer() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isFetching, refetch } = useA2ATasks({ enabled: open });

  const tasks = data?.tasks || data || [];
  const taskList = Array.isArray(tasks) ? tasks : [];
  const activeTasks = taskList.filter((t) => t.status?.state === 'working' || t.status?.state === 'submitted');

  const extractSummary = (task) => {
    const history = task.history || [];
    for (let i = history.length - 1; i >= 0; i--) {
      const textPart = history[i]?.parts?.find((p) => p.type === 'text');
      if (textPart?.text) return textPart.text;
    }
    const artifact = task.artifacts?.[0];
    if (artifact) {
      const textPart = artifact.parts?.find((p) => p.type === 'text');
      if (textPart?.text) return textPart.text;
    }
    return null;
  };

  return (
    <>
      {/* Floating toggle button */}
      <Tooltip title="A2A Tasks" placement="left">
        <Badge count={activeTasks.length} size="small" offset={[-4, 4]}>
          <Button
            shape="circle"
            icon={<ThunderboltOutlined />}
            onClick={() => setOpen(true)}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 100,
              width: 42,
              height: 42,
              background: '#22c55e',
              borderColor: '#22c55e',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(34,197,94,0.4)',
            }}
          />
        </Badge>
      </Tooltip>

      <Drawer
        title={
          <Space>
            <ThunderboltOutlined />
            <span>A2A Tasks</span>
            {isFetching && <Spin size="small" />}
          </Space>
        }
        placement="right"
        width={380}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        }
      >
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        )}

        {!isLoading && taskList.length === 0 && (
          <Empty description="No A2A tasks yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}

        {taskList.length > 0 && (
          <List
            size="small"
            dataSource={taskList}
            renderItem={(task) => {
              const state = task.status?.state || 'submitted';
              const cfg = STATUS_CONFIG[state] || STATUS_CONFIG.submitted;
              const summary = extractSummary(task);
              const ticketId = task.metadata?.ticketId;
              const createdAt = task.metadata?.createdAt || task.id;

              return (
                <List.Item style={{ padding: '10px 0', alignItems: 'flex-start' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Space size={6}>
                        <Tag icon={cfg.icon} color={cfg.color} style={{ fontSize: 10, padding: '0 6px' }}>
                          {cfg.label}
                        </Tag>
                        {ticketId && (
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            Ticket: {ticketId.slice(-6)}
                          </Text>
                        )}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {typeof createdAt === 'string' && createdAt.includes('T')
                          ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </Text>
                    </div>

                    {task.status?.message && (
                      <Text style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                        {task.status.message}
                      </Text>
                    )}

                    {summary && (
                      <Paragraph
                        type="secondary"
                        style={{ fontSize: 11, margin: 0 }}
                        ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                      >
                        {summary}
                      </Paragraph>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>
    </>
  );
}
