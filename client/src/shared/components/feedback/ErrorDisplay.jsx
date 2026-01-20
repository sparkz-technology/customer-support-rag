/**
 * Error Display Component
 * 
 * Displays user-friendly error messages with retry functionality
 * and rate limit countdown timers.
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { useState, useEffect } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { ReloadOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getErrorMessage, isRetryableError, formatRetryTime } from '../../utils';

const { Text } = Typography;

/**
 * ErrorDisplay component for showing API errors with retry functionality
 * 
 * @param {Object} props
 * @param {Error|ApiError|string} props.error - The error to display
 * @param {Function} props.onRetry - Callback function for retry button
 * @param {string} props.title - Optional title for the error alert
 * @param {boolean} props.showRetry - Whether to show retry button (default: auto-detect)
 * @param {string} props.className - Additional CSS class
 */
export function ErrorDisplay({ 
  error, 
  onRetry, 
  title = 'Error',
  showRetry,
  className = ''
}) {
  // Initialize countdown and canRetry based on error props
  const initialCountdown = error?.isRateLimited && error?.retryAfter ? error.retryAfter : null;
  const [countdown, setCountdown] = useState(initialCountdown);
  const [canRetry, setCanRetry] = useState(!initialCountdown);

  // Update state when error changes (only when error reference changes)
  const errorRef = error?.isRateLimited && error?.retryAfter ? `${error.retryAfter}` : null;
  useEffect(() => {
    if (error?.isRateLimited && error?.retryAfter) {
      // Use requestAnimationFrame to defer state update and avoid synchronous setState warning
      requestAnimationFrame(() => {
        setCountdown(error.retryAfter);
        setCanRetry(false);
      });
    }
  }, [errorRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer for rate limiting
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) {
        // Use requestAnimationFrame to defer state update
        requestAnimationFrame(() => {
          setCanRetry(true);
        });
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Use requestAnimationFrame to avoid synchronous setState
          requestAnimationFrame(() => {
            setCanRetry(true);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const message = getErrorMessage(error);
  const shouldShowRetry = showRetry !== undefined 
    ? showRetry 
    : (isRetryableError(error) || error?.isRateLimited);

  const getAlertType = () => {
    if (error?.isRateLimited) return 'warning';
    if (error?.isServerError) return 'error';
    if (error?.isNetworkError) return 'warning';
    return 'error';
  };

  const getIcon = () => {
    if (error?.isRateLimited) return <ClockCircleOutlined />;
    return <WarningOutlined />;
  };

  return (
    <Alert
      className={className}
      type={getAlertType()}
      icon={getIcon()}
      showIcon
      message={title}
      description={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text>{message}</Text>
          
          {error?.isRateLimited && countdown > 0 && (
            <Text type="secondary">
              <ClockCircleOutlined /> Retry available in {formatRetryTime(countdown)}
            </Text>
          )}
          
          {shouldShowRetry && onRetry && (
            <Button 
              type="primary" 
              size="small"
              icon={<ReloadOutlined />}
              onClick={onRetry}
              disabled={!canRetry}
              style={{ marginTop: 8 }}
            >
              {canRetry ? 'Try Again' : `Wait ${formatRetryTime(countdown)}`}
            </Button>
          )}
        </Space>
      }
    />
  );
}

/**
 * Inline error message for form fields
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {string} props.className - Additional CSS class
 */
export function InlineError({ message, className = '' }) {
  if (!message) return null;
  
  return (
    <Text type="danger" className={className} style={{ fontSize: '12px' }}>
      {message}
    </Text>
  );
}

export default ErrorDisplay;
