import { motion } from "framer-motion";
const Modal = ({ open, onClose, children, width = 500, darkMode = false }) => {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose} // close when clicking backdrop
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                className={`relative max-h-[90vh] overflow-auto shadow-lg ${darkMode ? '!border !border-slate-700 !bg-slate-900 !text-slate-100' : 'bg-white'}`}
                style={{ width: typeof width === "number" ? `${width}px` : width }}
            >
                <button
                    onClick={onClose}
                    className={`absolute top-3 right-3 z-5 ${darkMode ? '!text-slate-500 hover:!text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    ✕
                </button>

                {children}
            </motion.div>
        </div>
    );
};

export default Modal;