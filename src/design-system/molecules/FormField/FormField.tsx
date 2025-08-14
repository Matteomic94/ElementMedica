/**
 * Design System - FormField Component (Molecule)
 * Week 8 Implementation - Component Library
 */

import React from 'react';
import { cn } from '../../utils';
import { Input } from '../../atoms/Input';

export type FormFieldType = 'text' | 'textarea' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio' | 'date';
export type FormFieldSize = 'sm' | 'md' | 'lg';
export type FormFieldVariant = 'default' | 'filled' | 'outlined' | 'flushed';

export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormFieldProps {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Field type */
  type?: FormFieldType;
  /** Field value */
  value?: string | number | boolean;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Field variant */
  variant?: FormFieldVariant;
  /** Field size */
  size?: FormFieldSize;
  /** Required field */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Options for select/radio - can be array of strings or objects */
  options?: (string | FormFieldOption)[];
  /** Textarea rows */
  rows?: number;
  /** Min value for number inputs */
  min?: number;
  /** Max value for number inputs */
  max?: number;
  /** Step for number inputs */
  step?: number;
  /** Custom className */
  className?: string;
  /** Label className */
  labelClassName?: string;
  /** Input className */
  inputClassName?: string;
  /** Show asterisk for required fields */
  showRequiredAsterisk?: boolean;
}

// Size styles
const sizeStyles: Record<FormFieldSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

// Variant styles for labels
const labelVariantStyles: Record<FormFieldVariant, string> = {
  default: 'text-gray-700 font-medium',
  filled: 'text-gray-600 font-medium',
  outlined: 'text-gray-700 font-semibold',
  flushed: 'text-gray-700 font-medium'
};

// Helper function to normalize options
const normalizeOptions = (options: (string | FormFieldOption)[]): FormFieldOption[] => {
  return options.map(option => 
    typeof option === 'string' 
      ? { value: option, label: option }
      : option
  );
};

/**
 * FormField component - A complete form field with label, input, and error handling
 */
export const FormField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FormFieldProps
>((
  {
    name,
    label,
    type = 'text',
    value,
    onChange,
    variant = 'default',
    size = 'md',
    required = false,
    placeholder,
    error,
    helpText,
    disabled = false,
    readOnly = false,
    options = [],
    rows = 3,
    min,
    max,
    step,
    className,
    labelClassName,
    inputClassName,
    showRequiredAsterisk = true,
    ...props
  },
  ref
) => {
  const fieldId = `field-${name}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  
  // Normalize options to ensure consistent format
  const normalizedOptions = normalizeOptions(options);

  const baseInputClasses = cn(
    'w-full transition-colors duration-200',
    sizeStyles[size],
    inputClassName
  );

  const textareaClasses = cn(
    baseInputClasses,
    {
      'border-red-300 focus:border-red-500 focus:ring-red-500': error,
      'opacity-50 cursor-not-allowed': disabled,
      'bg-gray-50': readOnly
    }
  );

  const renderInput = () => {
    const isControlled = value !== undefined;
    const baseProps = {
      id: fieldId,
      name,
      disabled,
      readOnly,
      required,
      'aria-invalid': !!error,
      'aria-describedby': cn(errorId, helpId).trim() || undefined,
      ...props
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...baseProps}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...(isControlled ? { value: value as string } : {})}
            {...(onChange ? { onChange } : {})}
            placeholder={placeholder}
            rows={rows}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20',
              'transition-all duration-200 focus:outline-none',
              'placeholder:text-gray-400 resize-vertical',
              textareaClasses
            )}
          />
        );

      case 'select':
        return (
          <select
            {...baseProps}
            ref={ref as React.Ref<HTMLSelectElement>}
            {...(isControlled ? { value: value as string } : {})}
            {...(onChange ? { onChange } : {})}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20',
              'transition-all duration-200 focus:outline-none',
              'bg-white',
              textareaClasses
            )}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {normalizedOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            {...baseProps}
            ref={ref as React.Ref<HTMLInputElement>}
            type="checkbox"
            {...(isControlled ? { checked: value as boolean } : {})}
            {...(onChange ? { onChange } : {})}
            className={cn(
              'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
              inputClassName
            )}
          />
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {normalizedOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  {...(isControlled ? { checked: value === option.value } : {})}
                  {...(onChange ? { onChange } : {})}
                  disabled={disabled || option.disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className={cn('text-sm', { 'text-gray-400': disabled || option.disabled })}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <Input
            {...baseProps}
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            {...(isControlled ? { value: value as string | number } : {})}
            {...(onChange ? { onChange } : {})}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            variant={variant === 'outlined' ? 'outline' : variant === 'filled' ? 'filled' : variant === 'flushed' ? 'flushed' : 'default'}
            size={size}
            state={error ? 'error' : 'default'}
            className={inputClassName}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Label */}
      {type !== 'checkbox' && label && (
        <label
          htmlFor={fieldId}
          className={cn(
            'block text-sm',
            labelVariantStyles[variant],
            sizeStyles[size],
            labelClassName
          )}
        >
          {label}
          {required && showRequiredAsterisk && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Checkbox with inline label */}
      {type === 'checkbox' && label && (
        <label
          htmlFor={fieldId}
          className={cn(
            'flex items-center space-x-2 text-sm cursor-pointer',
            labelVariantStyles[variant],
            sizeStyles[size],
            { 'cursor-not-allowed opacity-50': disabled },
            labelClassName
          )}
        >
          {renderInput()}
          <span>
            {label}
            {required && showRequiredAsterisk && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </span>
        </label>
      )}

      {/* Checkbox without label */}
      {type === 'checkbox' && !label && renderInput()}

      {/* Input (non-checkbox) */}
      {type !== 'checkbox' && renderInput()}

      {/* Help text */}
      {helpText && !error && (
        <p
          id={helpId}
          className="text-sm text-gray-600"
        >
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;