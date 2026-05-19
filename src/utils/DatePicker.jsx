import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DatePicker = ({ label = "Select Date", onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isYearMode, setIsYearMode] = useState(false); // Toggle between Day and Year view
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(null); 
  const containerRef = useRef(null);
  const calendarRef = useRef(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0, width: 288 });

  useEffect(() => {
    const handleClick = (e) => {
      const clickedInput = containerRef.current?.contains(e.target);
      const clickedCalendar = calendarRef.current?.contains(e.target);

      if (!clickedInput && !clickedCalendar) {
        setIsOpen(false);
        setIsYearMode(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateCalendarPosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setCalendarPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 288),
      });
    };

    updateCalendarPosition();
    window.addEventListener("resize", updateCalendarPosition);
    window.addEventListener("scroll", updateCalendarPosition, true);

    return () => {
      window.removeEventListener("resize", updateCalendarPosition);
      window.removeEventListener("scroll", updateCalendarPosition, true);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewDate);
  
  // Day View Logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Year View Logic (Shows a range of 12 years)
  const startYear = Math.floor(year / 12) * 12;
  const yearsArray = Array.from({ length: 12 }, (_, i) => startYear + i);

  const handleDateSelect = (day) => {
    const date = new Date(year, month, day);
    
    setSelectedDate(date);
    setIsOpen(false);
    if (onChange) onChange(date.toISOString().split('T')[0]);
  };

  const jumpToToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
    setIsOpen(false);
    if (onChange) onChange(today.toISOString().split('T')[0]);
  };

  return (
    <>
    <div className="relative w-full max-w-[280px]" ref={containerRef}>

      <div onClick={() => setIsOpen(!isOpen)} className="group relative flex items-center cursor-pointer">
        <div className="absolute left-3 text-gray-400 group-hover:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <input
          type="text"
          readOnly
          value={selectedDate ? selectedDate.toISOString().split('T')[0] : ""}
          placeholder="Select a date"
          className="w-full pl-10 pr-4 py-2.5 min-w-[150px] bg-transparent border border-gray-300 dark:border-gray-700 rounded-sm text-sm focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer dark:text-white"
        />
      </div>
    </div>

      {isOpen && createPortal(
        <div
        ref={calendarRef}
        style={{
          position: "fixed",
          top: `${calendarPosition.top}px`,
          left: `${calendarPosition.left}px`,
          width: `${calendarPosition.width}px`,
          zIndex: 9999,
        }}
        className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <button 
              onClick={(e) =>{ e.preventDefault(); setViewDate(new Date(year, isYearMode ? month - 144 : month - 1, 1))}}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>

            {/* Clickable Header to switch to Year Mode */}
            <button 
              onClick={(e) =>{ e.preventDefault(); setIsYearMode(!isYearMode)}}
              className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              {isYearMode ? `${yearsArray[0]} - ${yearsArray[11]}` : `${monthName} ${year}`}
            </button>

            <button 
              onClick={(e) =>{ e.preventDefault(); setViewDate(new Date(year, isYearMode ? month + 144 : month + 1, 1))}}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="p-3">
            {isYearMode ? (
              /* Year Selection Grid */
              <div className="grid grid-cols-3 gap-2">
                {yearsArray.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setViewDate(new Date(y, month, 1));
                      setIsYearMode(false);
                    }}
                    className={`py-2 text-sm rounded-lg transition-colors ${y === year ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-50 dark:hover:bg-blue-900/40 dark:text-gray-300'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              /* Day Selection Grid */
              <>
                <div className="grid grid-cols-7 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <span key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase">{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
                    return (
                      <button
                        key={d}
                        onClick={() => handleDateSelect(d)}
                        className={`h-8 w-8 text-sm rounded-lg transition-all ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30' : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/40'}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
            <button onClick={jumpToToday} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Today
            </button>
            <button onClick={() => { setSelectedDate(null); setIsOpen(false); }} className="text-xs font-medium text-gray-500 hover:text-red-500">
              Clear
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DatePicker;
