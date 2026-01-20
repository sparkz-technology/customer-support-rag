/**
 * Form Fields Hook
 * 
 * Provides form state management with validation support.
 * Cross-cutting hook used across multiple features.
 * 
 * Requirements: 3.2
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing form field state with validation
 * 
 * @param {Object} initialValues - Initial form values
 * @returns {Object} Form state and handlers
 */
export function useFormFields(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValue(name, value);
    // Clear error when user starts typing
    if (errors[name]) {
      setError(name, null);
    }
  }, [errors, setValue, setError]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name);
  }, [setFieldTouched]);

  const setServerErrors = useCallback((serverErrors) => {
    if (serverErrors) {
      setErrors(prev => ({ ...prev, ...serverErrors }));
      // Mark all error fields as touched
      const touchedFields = {};
      Object.keys(serverErrors).forEach(key => {
        touchedFields[key] = true;
      });
      setTouched(prev => ({ ...prev, ...touchedFields }));
    }
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setFieldTouched,
    handleChange,
    handleBlur,
    setServerErrors,
    reset,
    clearErrors,
    setValues,
    setErrors,
  };
}

export default useFormFields;
