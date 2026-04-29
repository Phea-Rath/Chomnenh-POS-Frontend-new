const Input = ({ value, onChange, placeholder, type = 'text', icon, className = '', darkMode = false }) => (
    <div className="relative">
        {icon && <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? '!text-slate-500' : 'text-gray-400'}`}>{icon}</div>}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${icon ? 'pl-10' : ''} ${darkMode ? '!border-slate-700 !bg-slate-900 !text-slate-100 !placeholder-slate-500' : 'border-gray-300 bg-white text-gray-900'} ${className}`}
        />
    </div>
);
export default Input