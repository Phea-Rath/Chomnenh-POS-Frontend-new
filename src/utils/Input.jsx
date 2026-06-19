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

  const commitValue = (newValue) => {
    let finalValue = newValue;

    if (type === "number") {
      const num = parseFloat(newValue);

      if (isNaN(num)) {
        finalValue = min !== -Infinity ? min : 0;
      } else {
        finalValue = Math.max(min, Math.min(max, num));
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
    // Use a higher precision to avoid floating point errors without rounding user input
    const next = current + Number(step);
    const correctedNext = Math.min(max, parseFloat(next.toPrecision(12)));
    commitValue(correctedNext);
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    const current = parseFloat(internalValue || 0);
    // Use a higher precision to avoid floating point errors without rounding user input
    const next = current - Number(step);
    const correctedNext = Math.max(min, parseFloat(next.toPrecision(12)));
    commitValue(correctedNext);
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
    <div className="w-full min-w-20 flex items-center group">
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
            w-full px-3 min-w-25 py-1.5 bg-white dark:bg-gray-600/70
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400
            border border-slate-200 dark:border-gray-600
            transition-all outline-none rounded-none
            focus:border-[#13b5ea] focus:ring-0
            text-[13px] h-[38px]
            ${type === "number" && spinner ? "pr-8" : "pr-3"}
            ${props.className || ''}
          `}
        />

        {spinner && type === "number" && (
          <div className="absolute -right-1 top-0 bottom-[1px] flex flex-col w-7 h-[38px] border-l bg-gray-100 border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleIncrement}
              disabled={numericValue >= max}
              className="
                bg-gradient-to-b from-gray-50 border border-gray-200 to-gray-200 
                flex-1 flex items-center justify-center
                hover:bg-slate-50 dark:hover:bg-slate-800
                disabled:opacity-30
                disabled:cursor-not-allowed
                transition-colors
                text-black hover:text-[#13b5ea]
              "
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleDecrement}
              disabled={numericValue <= min}
              className="
                bg-gradient-to-b from-gray-50 border border-gray-200 to-gray-200 
                flex-1 flex items-center justify-center
                hover:bg-slate-50 dark:hover:bg-slate-800
                disabled:opacity-30
                disabled:cursor-not-allowed
                transition-colors
                text-black hover:text-[#13b5ea]
              "
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {addonAfter && (
        <div className="flex items-center justify-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold uppercase border border-l-0 border-slate-300 dark:border-slate-700 rounded-r-[2px] h-full self-stretch tracking-tight">
          {addonAfter}
        </div>
      )}
    </div>
  );
};

export default Input;