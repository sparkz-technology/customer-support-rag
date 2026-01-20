/**
 * Rate Limit Alert Component
 * 
 * Displays a countdown timer when rate limiting is detected (429 errors).
 * Shows remaining time until retry is allowed.
 * 
 * Requirements: 10.2
 */

import { useState, useEffect } from 'react';
import { Alert, Progress, Space, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { formatRetryTime } from '../../utils';

const { Text } = Typography;

/**
 * RateLimitAlert component for displaying rate limit countdown
 * 
 * @param {Object} props
 * @param {number} props.retryAfter - Seconds until retry is allowed
 * @param {Function} props.onExpire - Callback when countdown expires
 * @param {Function} props.onDismiss - Callback to dismiss the alert
 * @param {string} props.message - Custom message to display
 */
export function RateLimitAlert({ 
  retryAfter = 60, 
  onExpire, 
  onDismiss,
  message = 'You have made too many requests.'
}) {
  const [remaining, setRemaining] = useState(retryAfter);
  const [initialTime] = useState(retryAfter);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onExpire]);

  const progressPercent = Math.round((remaining / initialTime) * 100);

  if (remaining <= 0) {
    return null;
  }

  return (
    <Alert
      type="warning"
      icon={<ClockCircleOutlined />}
      showIcon
      closable={!!onDismiss}
      onClose={onDismiss}
      message="Rate Limit Reached"
      description={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text>{message}</Text>
          <Space>
            <ClockCircleOutlined />
            <Text strong>Retry available in: {formatRetryTime(remaining)}</Text>
          </Space>
          <Progress 
            percent={progressPercent} 
            showInfo={false}
            status="active"
            strokeColor="#faad14"
            size="small"
          />
        </Space>
      }
      style={{ marginBottom: 16 }}
    />
  );
}

export default RateLimitAlert;
