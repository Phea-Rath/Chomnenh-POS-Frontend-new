const Pagination = ({ current, total, pageSize, onChange, t }) => {
  const totalPages = Math.ceil(total / pageSize);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 bg-primary border border-gray-200 rounded px-4 py-2">
      <div className="text-sm text-gray-600 dark:text-gray-100">
        {t("Showing")} {start} {t("to")} {end} {t("of")} {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(1)}
          disabled={current === 1}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ⟪
        </button>
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ⟨
        </button>
        <span className="px-3 py-1 text-sm">
          {t("Page")} {current} {t("of")} {totalPages}
        </span>
        <button
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ⟩
        </button>
        <button
          onClick={() => onChange(totalPages)}
          disabled={current === totalPages}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ⟫
        </button>
      </div>
    </div>
  );
};

export default Pagination;
