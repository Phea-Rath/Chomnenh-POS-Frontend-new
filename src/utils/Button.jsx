import React from 'react';
 
const Button = ({ 
  children, 
  variant = 'primary', // add, update, delete
  outline = false, 
  className = '', 
  ...props 
}) => {
  
  // Base styles for all buttons
  const baseStyles = "px-5 py-2.5 text-xs box-border font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  // Configuration for different action types
  const variants = {
    primary: {
      solid: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20",
      outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
    },
    success: {
      solid: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20",
      outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
    },
    danger: {
      solid: "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20",
      outline: "border-2 border-rose-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
    }
  };

  
  const selectedStyles = outline ? variants[variant].outline : variants[variant].solid;

  return (
    <button 
      className={`${baseStyles} ${selectedStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;