import React, { useState, useEffect, useRef } from 'react';

const Input = ({
  type = "text",
  label = "Label",
  placeholder = "0",
  value,
  onChange,
  step = 1,
  min = -Infinity,
  max = Infinity,
  addonAfter,
  spinner = true,
  ...props
}) => {
  const inputRef = useRef(null);
  const [internalValue, setInternalValue] = useState(value ?? '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const getPrecision = () => {
    return step.toString().split(".")[1]?.length || 0;
  };

  const commitValue = (newValue) => {
    let finalValue = newValue;

    if (type === "number") {
      const num = parseFloat(newValue);

      if (isNaN(num)) {
        finalValue = min !== -Infinity ? min : 0;
      } else {
        finalValue = Math.max(min, Math.min(max, num));

        const precision = getPrecision();

        finalValue = parseFloat(
          Number(finalValue).toFixed(precision)
        );
      }
    }

    setInternalValue(finalValue);

    if (onChange) {
      onChange(finalValue);
    }
  };

  const handleIncrement = (e) => {
    e.preventDefault();

    const current = parseFloat(internalValue || 0);

    const precision = getPrecision();

    const next = Math.min(
      max,
      parseFloat((current + Number(step)).toFixed(precision))
    );

    commitValue(next);
  };

  const handleDecrement = (e) => {
    e.preventDefault();

    const current = parseFloat(internalValue || 0);

    const precision = getPrecision();

    const next = Math.max(
      min,
      parseFloat((current - Number(step)).toFixed(precision))
    );

    commitValue(next);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;

    if (type === "number") {
      // allow typing incomplete numbers
      if (
        val === "" ||
        val === "-" ||
        val === "." ||
        val === "-." ||
        /^-?\d*\.?\d*$/.test(val)
      ) {
        setInternalValue(val);

        const num = parseFloat(val);

        if (!isNaN(num) && onChange) {
          onChange(num);
        }
      }

      return;
    }

    setInternalValue(val);

    if (onChange) {
      onChange(val);
    }
  };

  const handleBlur = () => {
    if (type === "number") {
      commitValue(internalValue);
    }
  };

  const numericValue = parseFloat(internalValue || 0);

  return (
    <div className="w-full min-w-20 border border-gray-400 dark:border-gray-400 flex items-center">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type={type === "number" ? "text" : type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={internalValue ?? ''}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          min={min !== -Infinity ? min : undefined}
          max={max !== Infinity ? max : undefined}
          {...props}
          className={`
            w-full px-4 py-2 bg-transparent
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400
            outline-none transition-all
            focus:ring-4 focus:ring-blue-500/10
            focus:border-blue-500
            ${type === "number" && spinner ? "pr-10" : "pr-4"}
          `}
        />

        {spinner && type === "number" && (
          <div className="absolute right-1 top-1 bottom-1 flex flex-col w-7 bg-gray-50 dark:bg-blue-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={handleIncrement}
              disabled={numericValue >= max}
              className="
                flex-1 flex items-center justify-center
                hover:bg-blue-500 hover:text-white
                disabled:opacity-30
                disabled:cursor-not-allowed
                disabled:hover:bg-transparent
                transition-all
                border-b border-gray-200 dark:border-gray-700
                dark:text-gray-400
              "
            >
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleDecrement}
              disabled={numericValue <= min}
              className="
                flex-1 flex items-center justify-center
                hover:bg-blue-500 hover:text-white
                disabled:opacity-30
                disabled:cursor-not-allowed
                disabled:hover:bg-transparent
                transition-all
                dark:text-gray-400
              "
            >
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {addonAfter && (
        <div className="flex items-center justify-center px-2 py-2 border-l border-gray-200 dark:border-gray-400">
          {addonAfter}
        </div>
      )}
    </div>
  );
};

export default Input;