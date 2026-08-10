import React from 'react';

/**
 * Enterprise Reusable Button Primitive
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400 shadow-sm shadow-blue-500/20',
    secondary:
      'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-400 shadow-sm shadow-emerald-500/20',
    danger:
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400 shadow-sm shadow-red-500/20',
    warning:
      'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400 shadow-sm shadow-amber-500/20',
    outline:
      'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
    ghost:
      'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
