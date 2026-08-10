import React, { useEffect } from 'react';

/**
 * Enterprise Reusable Modal Primitive
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${maxWidth} bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden transform transition-all border border-gray-200 dark:border-gray-800`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg p-1 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
