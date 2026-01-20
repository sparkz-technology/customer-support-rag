/**
 * Form Field Utility Functions
 * 
 * Utility functions for form validation and field props.
 * Separated from components to maintain fast-refresh compatibility.
 * 
 * Requirements: 10.4
 */

import { ExclamationCircleOutlined } from '@ant-design/icons';

/**
 * Get validation status props for Ant Design Form.Item
 * @param {string|null} error - Error message
 * @param {boolean} touched - Whether field has been touched
 * @returns {Object} Props for Form.Item
 */
export function getValidationProps(error, touched = true) {
  if (!error || !touched) {
    return {};
  }
  return {
    validateStatus: 'error',
    help: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <ExclamationCircleOutlined style={{ fontSize: 12 }} />
        {error}
      </span>
    ),
  };
}

// Re-export useFormFields from shared hooks for backward compatibility
export { useFormFields } from '../../hooks';
