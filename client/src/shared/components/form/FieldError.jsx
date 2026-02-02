/**
 * Field Error and Validated Form Components
 * 
 * Provides consistent field-level error highlighting and inline validation feedback.
 * 
 * Requirements: 10.4
 */

import { Form, Input, Select, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { getValidationProps } from '../../utils/formUtils.js';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * ValidatedInput - Input with built-in error display
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name
 * @param {string} props.value - Field value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.touched - Whether field has been touched
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.type - Input type (text, email, password)
 * @param {boolean} props.disabled - Whether field is disabled
 */
export function ValidatedInput({
  label,
  name,
  value,
  onChange,
  error,
  touched = true,
  required = false,
  placeholder,
  type = 'text',
  disabled = false,
  ...rest
}) {
  const validationProps = getValidationProps(error, touched);
  
  return (
    <Form.Item
      label={label}
      required={required}
      {...validationProps}
    >
      <Input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        status={error && touched ? 'error' : ''}
        {...rest}
      />
    </Form.Item>
  );
}

/**
 * ValidatedTextArea - TextArea with built-in error display
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name
 * @param {string} props.value - Field value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.touched - Whether field has been touched
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.rows - Number of rows
 * @param {boolean} props.disabled - Whether field is disabled
 */
export function ValidatedTextArea({
  label,
  name,
  value,
  onChange,
  error,
  touched = true,
  required = false,
  placeholder,
  rows = 4,
  disabled = false,
  ...rest
}) {
  const validationProps = getValidationProps(error, touched);
  
  return (
    <Form.Item
      label={label}
      required={required}
      {...validationProps}
    >
      <TextArea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        status={error && touched ? 'error' : ''}
        {...rest}
      />
    </Form.Item>
  );
}

/**
 * ValidatedSelect - Select with built-in error display
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name
 * @param {string} props.value - Field value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.touched - Whether field has been touched
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.placeholder - Placeholder text
 * @param {Array} props.options - Select options
 * @param {boolean} props.disabled - Whether field is disabled
 */
export function ValidatedSelect({
  label,
  // eslint-disable-next-line no-unused-vars
  name,
  value,
  onChange,
  error,
  touched = true,
  required = false,
  placeholder,
  options = [],
  disabled = false,
  ...rest
}) {
  const validationProps = getValidationProps(error, touched);
  
  return (
    <Form.Item
      label={label}
      required={required}
      {...validationProps}
    >
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        status={error && touched ? 'error' : ''}
        options={options}
        {...rest}
      />
    </Form.Item>
  );
}

/**
 * FieldError - Standalone inline error message
 * 
 * @param {Object} props
 * @param {string} props.error - Error message
 * @param {string} props.className - Additional CSS class
 */
export function FieldError({ error, className = '' }) {
  if (!error) return null;
  
  return (
    <Text 
      type="danger" 
      className={className}
      style={{ 
        fontSize: 12, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 4,
        marginTop: 4 
      }}
    >
      <ExclamationCircleOutlined style={{ fontSize: 12 }} />
      {error}
    </Text>
  );
}

export default FieldError;
