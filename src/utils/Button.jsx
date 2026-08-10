import React from 'react';
import { definePermission } from '../services/serviceFunction';

const Button = ({
  children,
  menuId=null,
  actionType = '',
  variant = 'primary', // add, update, delete
  outline = false,
  className = '',
  ...props
}) => {

  // Base styles for all buttons
  const baseStyles = "px-6 py-2 rounded-[2px] h-8 text-[13px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  // Configuration for different action types
  const variants = {
    primary: {
      solid: " bg-blue-500 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20",
      outline: "border-1 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
    },
    success: {
      solid: " bg-emerald-500ld-800 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20",
      outline: "border-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
    },
    warning: {
      solid: " bg-yellow-500 text-white hover:bg-yellow-700 shadow-md shadow-yellow-500/20",
      outline: "border-1 border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
    },
    danger: {
      solid: " bg-rose-500 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20",
      outline: "border-1 border-rose-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
    },
    cancel: {
      solid: " bg-gray-300 text-white hover:bg-gray-700",
      outline: "border-1 border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20"
    },
    save: {
      solid: " bg-cyan-500 text-white hover:bg-cyan-600 shadow-md shadow-cyan-500/20",
      outline: "border-1 border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
    },
    approve: {
      solid: " bg-lime-300 text-white hover:bg-lime-700 shadow-md shadow-lime-500/20",
      outline: "border-1 border-lime-600 text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/20"
    },
    siliver: {
      solid: " bg-gray-50 dark:from-gray-500 dark:to-gray-600 border border-gray-500 dark:border-gray-500 !text-cyan-500 hover:bg-gray-700",
    }
  };


  const selectedStyles = outline ? variants[variant]?.outline : variants[variant]?.solid;

  return (
    <button
      className={`${baseStyles} ${selectedStyles} ${className}`}
      disabled={menuId?!definePermission(menuId)[actionType]:false}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;