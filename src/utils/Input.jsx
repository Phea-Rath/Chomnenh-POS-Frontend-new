import React, { useState, useEffect } from 'react';

const Input = ({ 
  type = "text", 
  label = "Label", 
  placeholder = "0", 
  value, 
  min = 0, 
  max = 100, 
  step = 1,
  onChange,
  addonAfter,
  spinner = true,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value ?? (type === "number" ? min : ""));

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  // This function is for buttons and final cleaning
  const commitValue = (newValue) => {
    let finalValue = newValue;
    if (type === "number") {
      const num = parseFloat(newValue);
      if (isNaN(num)) {
        finalValue = min;
      } else {
        // Clamp between min and max
        finalValue = Math.max(min, Math.min(max, num));
        // Fix JavaScript floating point math (e.g. 0.1 + 0.2)
        const precision = step.toString().split(".")[1]?.length || 0;
        finalValue = parseFloat(finalValue.toFixed(precision));
      }
    }
    setInternalValue(finalValue);
    if (onChange) onChange(finalValue);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    commitValue(Number(internalValue || 0) + Number(step));
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    commitValue(Number(internalValue || 0) - Number(step));
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    
    if (type === "number") {
      // 1. Allow the user to type decimal points, minus signs, or empty strings
      // regex allows: empty, "-", "1.", "1.0", "-0."
      if (val === "" || val === "-" || /^-?\d*\.?\d*$/.test(val)) {
        setInternalValue(val); // Update state with raw string so decimal stays
        
        // 2. Only trigger onChange if it's a valid complete number
        const num = parseFloat(val);
        if (!isNaN(num) && onChange) {
          onChange(num);
        }
      }
    } else {
      setInternalValue(val);
      if (onChange) onChange(val);
    }
  };

  const handleBlur = () => {
    if (type === "number") {
      // When user leaves the field, clean up trailing decimals or out-of-bounds
      commitValue(internalValue);
    }
  };

  return (
    <div className="w-full min-w-20 border border-gray-400 dark:border-gray-400 flex justify-center items-center">
      <div className="relative group w-full">
        <input
          type={type === "number" ? "text" : type}
          inputMode={type === "number" ? "decimal" : "text"} // Better mobile keyboard
          value={internalValue??''}
          onChange={handleInputChange}
          placeholder={placeholder}
          {...props}
          className={`
            w-full px-4 py-2 bg-transparent
            text-gray-900 dark:text-gray-100 placeholder:text-gray-400
             transition-all outline-none
            focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500
            ${type === 'number' ? 'pr-10' : 'pr-4'}
          `}
        />

        {spinner &&type === "number" && (
          <div className="absolute right-1 top-1 bottom-1 flex flex-col w-7 bg-gray-50 dark:bg-blue-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={handleIncrement}
              disabled={Number(internalValue) >= max}
              className="flex-1 flex items-center justify-center hover:bg-blue-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-400 transition-colors border-b border-gray-200 dark:border-gray-700"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={handleDecrement}
              disabled={Number(internalValue) <= min}
              className="flex-1 flex items-center justify-center hover:bg-blue-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-400 transition-colors"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
        {addonAfter && (
          <div className="flex justify-center items-center px-2 py-2 border-l border-gray-200 dark:border-gray-400">
            {addonAfter}
          </div>
        )}
    </div>
  );
};

export default Input;