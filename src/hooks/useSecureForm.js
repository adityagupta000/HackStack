import { useState, useCallback } from "react";
import { sanitizeInput } from "../utils/sanitize";
import { handleAPIError } from "../utils/errorHandler";
import logger from "../utils/logger";

/**
 * Custom hook for secure form handling
 * @param {Object} initialValues - Initial form values
 * @param {Function} validationSchema - Validation function
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state and handlers
 */
export const useSecureForm = (
  initialValues = {},
  validationSchema = null,
  onSubmit = null
) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  /**
   * Handle input change with sanitization
   */
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      let sanitizedValue = value;

      // Sanitize text inputs (not passwords)
      if (
        type === "text" ||
        type === "email" ||
        type === "search" ||
        type === "tel" ||
        type === "url"
      ) {
        sanitizedValue = sanitizeInput(value);
      } else if (type === "checkbox") {
        sanitizedValue = checked;
      } else if (type === "number") {
        sanitizedValue = value === "" ? "" : parseFloat(value);
      }

      setValues((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }));

      // Clear error for this field
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  /**
   * Handle input blur
   */
  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate field on blur if validation schema exists
      if (validationSchema) {
        validateField(name, values[name]);
      }
    },
    [values, validationSchema]
  );

  /**
   * Validate single field
   */
  const validateField = useCallback(
    (fieldName, value) => {
      if (!validationSchema) return true;

      try {
        const fieldValidation = validationSchema[fieldName];

        if (fieldValidation) {
          const result = fieldValidation(value, values);

          if (result && !result.isValid) {
            setErrors((prev) => ({
              ...prev,
              [fieldName]: result.error,
            }));
            return false;
          } else {
            setErrors((prev) => ({
              ...prev,
              [fieldName]: undefined,
            }));
            return true;
          }
        }

        return true;
      } catch (error) {
        logger.error("Field validation error", error, { fieldName });
        return false;
      }
    },
    [validationSchema, values]
  );

  /**
   * Validate all fields
   */
  const validateForm = useCallback(() => {
    if (!validationSchema) return true;

    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach((fieldName) => {
      const value = values[fieldName];
      const fieldValidation = validationSchema[fieldName];

      if (fieldValidation) {
        try {
          const result = fieldValidation(value, values);

          if (result && !result.isValid) {
            newErrors[fieldName] = result.error;
            isValid = false;
          }
        } catch (error) {
          logger.error("Form validation error", error, { fieldName });
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, values]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e) => {
      if (e) {
        e.preventDefault();
      }

      setSubmitCount((prev) => prev + 1);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Validate form
      const isValid = validateForm();

      if (!isValid) {
        logger.warn("Form validation failed", { errors });
        return;
      }

      if (!onSubmit) {
        logger.warn("No onSubmit handler provided");
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(values);
        logger.info("Form submitted successfully");
      } catch (error) {
        logger.error("Form submission error", error);
        handleAPIError(error, {
          showToast: true,
          fallbackMessage: "Form submission failed",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit, errors]
  );

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
    logger.debug("Form reset");
  }, [initialValues]);

  /**
   * Set field value programmatically
   */
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Set field error programmatically
   */
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  /**
   * Set field touched programmatically
   */
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }));
  }, []);

  /**
   * Check if field has error and is touched
   */
  const getFieldError = useCallback(
    (name) => {
      return touched[name] && errors[name] ? errors[name] : null;
    },
    [touched, errors]
  );

  /**
   * Check if form is valid
   */
  const isValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Check if form is dirty (has changes)
   */
  const isDirty = useCallback(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    getFieldError,
    validateField,
    validateForm,
    isValid: isValid(),
    isDirty: isDirty(),
  };
};

export default useSecureForm;
