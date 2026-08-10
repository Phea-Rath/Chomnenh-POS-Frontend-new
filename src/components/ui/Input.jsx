import React, { forwardRef } from 'react';

/**
 * Enterprise Reusable Input Primitive
 */
export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      className = '',
      wrapperClassName = '',
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {Icon && (
            <div className="absolute left-3 text-gray-400 pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`w-full rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 ${
              Icon ? 'pl-9' : 'pl-3'
            } ${
              error
                ? 'border-red-500 focus:ring-red-400 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
