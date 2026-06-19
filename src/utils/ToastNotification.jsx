import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

const ToastNotification = ({ isOpen, type = 'success', message, onClose, duration = 2000 }) => {
  // Automatically close the toast after the specified duration
  const navigate = useNavigate();
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
        // if(type == 'success'){
        //   navigate(-1);
        // }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    // Backdrop blur with standard Tailwind fade-in
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out animate-[fadeIn_0.2s_ease-out]">
      
      {/* Centered Card with inline spring animation definition */}
      <div 
        className="fixed top-1/2 left-1/2 w-72 bg-[#182533]/95 border border-[#243141] rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center select-none"
        style={{
          animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Style block to inject keyframes natively */}
        <style>{`
          @keyframes popIn {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes drawPath {
            100% { stroke-dashoffset: 0; }
          }
        `}</style>
        
        {/* Animated Icon Wrapper */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          type === 'success' ? 'bg-[#5288c1]/10' : 'bg-[#ec5b5b]/10'
        }`}>
          {type === 'success' ? (
            // Success Checkmark
            <svg 
              className="w-8 h-8 text-[#64b5f6]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline 
                points="20 6 9 17 4 12" 
                strokeDasharray="30"
                strokeDashoffset="30"
                style={{ animation: 'drawPath 0.3s ease-out 0.15s forwards' }}
              />
            </svg>
          ) : (
            // Fail X
            <svg 
              className="w-7 h-7 text-[#ec5b5b]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line 
                x1="18" y1="6" x2="6" y2="18" 
                strokeDasharray="20"
                strokeDashoffset="20"
                style={{ animation: 'drawPath 0.18s ease-out 0.12s forwards' }}
              />
              <line 
                x1="6" y1="6" x2="18" y2="18" 
                strokeDasharray="20"
                strokeDashoffset="20"
                style={{ animation: 'drawPath 0.18s ease-out 0.25s forwards' }}
              />
            </svg>
          )}
        </div>

        {/* Status Header */}
        <h3 className="text-base font-semibold text-[#f5f5f5] mb-1.5 tracking-wide">
          {type === 'success' ? 'Success' : 'Action Failed'}
        </h3>

        {/* Message description */}
        <p className="text-sm text-gray-400 font-normal leading-relaxed px-2">
          {message}
        </p>
      </div>
    </div>
  );
};

export default ToastNotification;