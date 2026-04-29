const Button = ({ children, onClick, variant = 'default', size = 'md', icon, disabled, className = '', type = 'button', darkMode = false }) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-lg';
    const sizes = {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2.5 text-sm',
    };
    const variants = {
        default: darkMode
            ? '!border-slate-700 !bg-slate-800 !text-slate-100 hover:!bg-slate-700'
            : 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700',
        primary: 'border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white',
        danger: 'border border-red-600 bg-red-600 hover:bg-red-700 text-white',
        success: 'border border-green-600 bg-green-600 hover:bg-green-700 text-white',
        outline: darkMode
            ? '!border-slate-700 !bg-transparent !text-slate-200 hover:!bg-slate-800'
            : 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700',
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {icon && <span className="text-base">{icon}</span>}
            {children}
        </button>
    );
};

export default Button
