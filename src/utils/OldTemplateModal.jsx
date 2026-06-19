import React from 'react';
import { LuSearch, LuArrowLeft } from 'react-icons/lu';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { Checkbox, Spin } from 'antd';
import Modal from './Modal';
import Button from './Button';

/**
 * OldTemplateModal - A reusable modal for selecting and importing old templates.
 * 
 * @param {boolean} open - Whether the modal is visible.
 * @param {function} onClose - Function to close the modal.
 * @param {string} title - The title of the modal.
 * @param {string} searchPlaceholder - Placeholder for the search input.
 * @param {string} searchTerm - The current search value.
 * @param {function} onSearchChange - Callback when search input changes.
 * @param {React.ReactNode} filters - Custom filter elements to display next to search.
 * @param {Array} selectedIds - Array of IDs for currently selected items.
 * @param {function} onToggleSelect - Callback to toggle selection of an item by ID.
 * @param {function} onSelectAll - Callback to toggle selection of all items on the current page.
 * @param {function} onClearSelection - Callback to clear all selections.
 * @param {function} onImport - Callback for the "Import Selected" action.
 * @param {string} importLabel - Label for the import button.
 * @param {Array} data - The array of template items to display.
 * @param {boolean} isLoading - Loading state for the data.
 * @param {Array} columns - Array of column definitions: { title, key, render, className, dataClassName }.
 * @param {object} pagination - Pagination state: { current, total, pageSize }.
 * @param {function} onPaginationChange - Callback when page changes.
 * @param {function} onUseTemplate - Callback when "Use Template" action is clicked for a single item.
 * @param {string} useTemplateLabel - Label for the single item use action.
 * @param {function} t - Translation function.
 */
const OldTemplateModal = ({
    open,
    onClose,
    title,
    searchPlaceholder,
    searchTerm,
    onSearchChange,
    filters,
    selectedIds = [],
    onToggleSelect,
    onSelectAll,
    onClearSelection,
    onImport,
    importLabel,
    data = [],
    isLoading,
    columns = [],
    pagination = { current: 1, total: 0, pageSize: 10 },
    onPaginationChange,
    onUseTemplate,
    useTemplateLabel,
    t
}) => {
    // Determine if all items on the current page are selected
    const isAllSelected = data.length > 0 && data.every(item => {
        const id = item.id || item.order_id || item.purchase_id || item.quotation_id;
        return selectedIds.includes(id);
    });

    return (
        <Modal open={open} onClose={onClose} width={1000}>
            <div className="flex flex-col max-h-[85vh] bg-white dark:bg-gray-700 overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        {title}
                    </h3>
                </div>

                {/* Filters Area */}
                <div className="p-4 bg-gradient-to-b from-slate-50 to-gray-100  dark:from-slate-700 dark:to-gray-700 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex gap-4 flex-col">
                        <div className={`col-span-12 ${filters ? 'lg:col-span-4' : ''} relative`}>
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder || (t ? t("searchTemplates") : "Search...")}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full h-10 border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-600 py-1.5 pl-10 pr-4 text-[13px] text-slate-900 dark:text-slate-100 rounded-[2px] outline-none focus:border-[#13b5ea]"
                            />
                        </div>
                        {filters}
                    </div>
                </div>

                {/* Selected Templates Summary */}
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2 bg-[#13b5ea]/5 dark:bg-[#13b5ea]/10 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-sm text-[#13b5ea]">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#13b5ea] text-[10px] font-bold text-white">
                                {selectedIds.length}
                            </span>
                            <span className="font-semibold">{t ? t("itemsSelected") : "Items Selected"}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={onClearSelection}
                                variant="danger"
                                outline={true}
                                size="small"
                                className="!py-1"
                            >
                                {t ? t("clearAll") : "Clear All"}
                            </Button>
                            <Button
                                onClick={onImport}
                                variant="primary"
                                size="small"
                                className="!py-1"
                            >
                                <FaCloudUploadAlt />
                                {importLabel || (t ? t("importSelected") : "Import Selected")}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Table Area */}
                <div className="flex-1 overflow-auto min-h-[300px] bg-gray-100 dark:bg-gray-700">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                            <tr className='bg-gradient-to-b from-white to-gray-100 text-slate-500 dark:text-gray-200 dark:from-gray-700 dark:to-gray-800'>
                                <th className="px-6 py-3 w-12 text-center border-r !border-gray-200 dark:!border-gray-400">
                                    <Checkbox
                                        onChange={onSelectAll}
                                        checked={isAllSelected}
                                    />
                                </th>
                                {columns.map((col, idx) => (
                                    <th key={idx} className={`px-6 py-3 text-[11px] font-bold uppercase  tracking-wider border-r !border-gray-200 dark:!border-gray-400 ${col.className || ''}`}>
                                        {col.title}
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-[11px] font-bold uppercase  tracking-wider text-right">
                                    {t ? t("action") : "Action"}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length + 2} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Spin size="large" />
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t ? t("loading") : "Loading"}...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 2} className="px-6 py-12 text-center italic text-slate-400 text-sm">
                                        {t ? t("noDataFound") : "No templates found"}
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => {
                                    const id = item.id || item.order_id || item.purchase_id || item.quotation_id;
                                    const isSelected = selectedIds.includes(id);
                                    return (
                                        <tr
                                            key={id || index}
                                            className={`transition-colors cursor-pointer border-b !border-gray-200 dark:!border-gray-400 ${isSelected ? 'bg-[#13b5ea]/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                                            onClick={() => onToggleSelect(id)}
                                        >
                                            <td className="px-6 py-4 text-center border-r !border-gray-200 dark:!border-gray-400" onClick={e => e.stopPropagation()}>
                                                <Checkbox checked={isSelected} onChange={() => onToggleSelect(id)} />
                                            </td>
                                            {columns.map((col, cIdx) => (
                                                <td key={cIdx} className={`px-6 py-4 border-r !border-gray-200 dark:!border-gray-400 bg-white dark:bg-gray-500 ${col.dataClassName || ''}`}>
                                                    {col.render ? col.render(item) : item[col.key]}
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => onUseTemplate(item)}
                                                    className="text-[11px] font-bold uppercase text-[#13b5ea] hover:underline"
                                                >
                                                    {useTemplateLabel || (t ? t("useTemplate") : "Use Template")}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal Footer / Pagination */}
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        {t ? t("totalRecords") : "Total Records"}: <span className="text-slate-700 dark:text-slate-200">{pagination.total}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            disabled={pagination.current === 1 || isLoading}
                            onClick={() => onPaginationChange(pagination.current - 1)}
                            variant="primary"
                            outline={true}
                            size="small"
                            className="!px-2"
                        >
                            <LuArrowLeft size={14} />
                        </Button>
                        <div className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-700 dark:text-slate-200">
                            {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize) || 1}
                        </div>
                        <Button
                            disabled={pagination.current * pagination.pageSize >= pagination.total || isLoading}
                            onClick={() => onPaginationChange(pagination.current + 1)}
                            variant="primary"
                            outline={true}
                            size="small"
                            className="!px-2"
                        >
                            <LuArrowLeft size={14} className="rotate-180" />
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default OldTemplateModal;
