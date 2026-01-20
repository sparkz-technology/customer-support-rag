import { Tag, Tooltip, Space } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';

/**
 * Manual Review Badge Component
 * Shows "Needs Review" badge when ticket requires manual review
 * 
 * @param {boolean} needsManualReview - Whether the ticket needs manual review
 */
export const ManualReviewBadge = ({ needsManualReview }) => {
  if (!needsManualReview) return null;
  
  return (
    <Tooltip title="This ticket requires manual review by an agent">
      <Tag 
        color="purple" 
        icon={<ExclamationCircleOutlined />}
        style={{ fontSize: 10, padding: '0 4px' }}
      >
        Needs Review
      </Tag>
    </Tooltip>
  );
};

/**
 * Reopen Badge Component
 * Shows reopen count when ticket has been reopened
 * 
 * @param {number} reopenCount - Number of times the ticket has been reopened
 * @param {Date|string} reopenedAt - Last reopened timestamp
 */
export const ReopenBadge = ({ reopenCount, reopenedAt }) => {
  if (!reopenCount || reopenCount <= 0) return null;
  
  const formatReopenedAt = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const tooltipText = reopenedAt 
    ? `Reopened ${reopenCount} time${reopenCount > 1 ? 's' : ''} - Last: ${formatReopenedAt(reopenedAt)}`
    : `Reopened ${reopenCount} time${reopenCount > 1 ? 's' : ''}`;
  
  return (
    <Tooltip title={tooltipText}>
      <Tag 
        color="orange" 
        icon={<ReloadOutlined />}
        style={{ fontSize: 10, padding: '0 4px' }}
      >
        Reopened {reopenCount > 1 ? `(${reopenCount})` : ''}
      </Tag>
    </Tooltip>
  );
};

/**
 * First Response Badge Component
 * Shows first response status
 * 
 * @param {Date|string|null} firstResponseAt - First response timestamp
 * @param {string} status - Ticket status
 */
export const FirstResponseBadge = ({ firstResponseAt, status }) => {
  // Don't show for resolved/closed tickets without first response
  if ((status === 'resolved' || status === 'closed') && !firstResponseAt) {
    return null;
  }
  
  if (firstResponseAt) {
    const formatTime = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    return (
      <Tooltip title={`First response: ${formatTime(firstResponseAt)}`}>
        <Tag 
          color="green" 
          icon={<CheckCircleOutlined />}
          style={{ fontSize: 10, padding: '0 4px' }}
        >
          Responded
        </Tag>
      </Tooltip>
    );
  }
  
  return (
    <Tooltip title="Awaiting first response from agent">
      <Tag 
        color="default" 
        icon={<ClockCircleOutlined />}
        style={{ fontSize: 10, padding: '0 4px' }}
      >
        Awaiting Response
      </Tag>
    </Tooltip>
  );
};

/**
 * Ticket Badges Component
 * Renders all applicable badges for a ticket
 * 
 * @param {Object} ticket - The ticket object
 */
export const TicketBadges = ({ ticket }) => {
  if (!ticket) return null;
  
  const { 
    needsManualReview, 
    reopenCount, 
    reopenedAt, 
    firstResponseAt, 
    status 
  } = ticket;
  
  return (
    <Space size={4} wrap>
      <ManualReviewBadge needsManualReview={needsManualReview} />
      <ReopenBadge reopenCount={reopenCount} reopenedAt={reopenedAt} />
      <FirstResponseBadge firstResponseAt={firstResponseAt} status={status} />
    </Space>
  );
};

export default TicketBadges;
