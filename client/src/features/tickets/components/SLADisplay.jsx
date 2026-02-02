import { Tag, Tooltip } from 'antd';
import { ClockCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import { formatSLATime, getSLAStatus } from '../utils/slaUtils';

/**
 * SLA Display Component
 * Shows SLA status with appropriate styling based on state
 */
export const SLADisplay = ({ slaDueAt, slaBreached, status }) => {
  // Hide SLA for resolved or closed tickets
  if (status === 'resolved' || status === 'closed') {
    return null;
  }
  
  if (!slaDueAt) {
    return null;
  }
  
  const slaStatus = getSLAStatus(slaDueAt, slaBreached);
  const timeStr = formatSLATime(slaDueAt);
  
  const statusConfig = {
    'on-track': {
      color: 'green',
      icon: <ClockCircleOutlined />,
      label: 'On Track',
    },
    'at-risk': {
      color: 'orange',
      icon: <WarningOutlined />,
      label: 'At Risk',
    },
    'breached': {
      color: 'red',
      icon: <ExclamationCircleOutlined />,
      label: 'Breached',
    },
  };
  
  const config = statusConfig[slaStatus];
  
  return (
    <Tooltip title={`SLA: ${timeStr}`}>
      <Tag 
        color={config.color} 
        icon={config.icon}
        style={{ fontSize: 10, padding: '0 4px' }}
      >
        {config.label}
      </Tag>
    </Tooltip>
  );
};

export default SLADisplay;
