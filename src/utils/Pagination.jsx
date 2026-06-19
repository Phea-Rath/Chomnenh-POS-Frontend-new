const Pagination = ({ current, total, pageSize, onChange, t }) => {
  const totalPages = Math.ceil(total / pageSize);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(1)}
          disabled={current === 1}
          className="w-10 h-8 flex items-center bg-white dark:bg-gray-900 justify-center border border-slate-200 dark:border-slate-700 rounded-[2px] disabled:opacity-30 text-slate-600 dark:text-slate-400 hover:bg-[#13b5ea] hover:text-white transition-all font-bold"
        >
          ⟪
        </button>
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="w-10 h-8 flex items-center bg-white dark:bg-gray-900 justify-center border border-slate-200 dark:border-slate-700 rounded-[2px] disabled:opacity-30 text-slate-600 dark:text-slate-400 hover:bg-[#13b5ea] hover:text-white transition-all font-bold"
        >
          ⟨
        </button>
        
        <div className="h-8 px-4 flex items-center bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 min-w-[100px] justify-center">
          {t("page")} {current} / {totalPages || 1}
        </div>

        <button
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages || total === 0}
          className="w-10 h-8 flex bg-white dark:bg-gray-900 items-center justify-center border border-slate-200 dark:border-slate-700 rounded-[2px] disabled:opacity-30 text-slate-600 dark:text-slate-400 hover:bg-[#13b5ea] hover:text-white transition-all font-bold"
        >
          ⟩
        </button>
        <button
          onClick={() => onChange(totalPages)}
          disabled={current === totalPages || total === 0}
          className="w-10 h-8 flex bg-white dark:bg-gray-900 items-center justify-center border border-slate-200 dark:border-slate-700 rounded-[2px] disabled:opacity-30 text-slate-600 dark:text-slate-400 hover:bg-[#13b5ea] hover:text-white transition-all font-bold"
        >
          ⟫
        </button>
      </div>
      
      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
        {t("Showing")} {start} {t("to")} {end} {t("of")} {total}
      </div>
    </div>
  );
};

export default Pagination;