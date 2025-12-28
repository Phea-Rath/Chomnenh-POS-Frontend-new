import { useEffect } from 'react';
import { BsFillQuestionOctagonFill } from "react-icons/bs";
import { motion, AnimatePresence } from 'framer-motion';

export default function AlertBox({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No',
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-10000 p-4"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center gap-3">
              <BsFillQuestionOctagonFill className="text-2xl text-white" />
              <h3 className="text-xl font-bold tracking-tight">{title}</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-base leading-relaxed">{message}</p>
            </div>
            <div className="bg-gray-100 px-4 py-3 flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="button"
                className="w-full sm:w-auto cursor-pointer inline-flex justify-center rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-200"
                onClick={onConfirm}
              >
                {confirmText}
              </button>
              <button
                type="button"
                className="w-full cursor-pointer sm:w-auto inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 transition-all duration-200"
                onClick={onCancel}
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}