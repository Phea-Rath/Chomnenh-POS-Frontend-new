import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FaAngleDown } from "react-icons/fa";

const ItemTable = ({
    data = [],
    columns = [], // Expects: { key, title, type, selectOptions, selectLabel, priceLabel, subKey }
    onCellChange, 
    onDelete,     
}) => {
    const [openSelectIndex, setOpenSelectIndex] = useState(null);
    const [activeSelectKey, setActiveSelectKey] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const menuRef = useRef(null);
    const { t } = useTranslation();
    const triggerRefs = useRef({});

    const toSafeNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

    const getSelectOptionMeta = (value, options = []) => {
        const selectedOption = options.find((option) => option.value === value) || options[0];
        const normalizedValue = String(selectedOption?.value || "").toLowerCase();
        
        const styleMap = {
            sale: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
            sample: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
            free: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
        };

        return {
            label: selectedOption?.label || value || "-",
            className: styleMap[normalizedValue] || "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
        };
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const compositeKey = `${openSelectIndex}-${activeSelectKey}`;
            const activeTrigger = openSelectIndex !== null ? triggerRefs.current[compositeKey] : null;
            const clickedInsideMenu = menuRef.current?.contains(event.target);
            const clickedTrigger = activeTrigger?.contains(event.target);

            if (!clickedInsideMenu && !clickedTrigger) {
                setOpenSelectIndex(null);
                setActiveSelectKey(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openSelectIndex, activeSelectKey]);

    useEffect(() => {
        if (openSelectIndex === null || !activeSelectKey) return;

        const updateMenuPosition = () => {
            const compositeKey = `${openSelectIndex}-${activeSelectKey}`;
            const trigger = triggerRefs.current[compositeKey];
            if (!trigger) return;

            const rect = trigger.getBoundingClientRect();
            setMenuPosition({
                top: Math.max(rect.top - 8, 0),
                left: rect.left,
                width: Math.max(rect.width, 128),
            });
        };

        updateMenuPosition();
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);

        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [openSelectIndex, activeSelectKey]);

    const currentActiveColumn = columns.find(col => col.key === activeSelectKey);

    return (
        <>
        <div className="relative overflow-auto border border-gray-200 dark:border-gray-500 rounded-sm shadow-sm bg-white dark:bg-gray-900">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    <tr className="border-b border-gray-200 dark:!border-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700/50">
                        <th className="border-r text-center !border-gray-200 dark:!border-gray-500 w-10">NO.</th>
                        {columns.map((col, index) => (
                            <th key={index} className="px-4 py-3 border-r !border-gray-200 dark:!border-gray-500 font-semibold text-xs">
                                {col.title}
                            </th>
                        ))}
                        <th className="px-1 py-2 text-center w-5"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-600/80">
                    {data?.length > 0 ? (
                        data.map((item, index) => (
                            <tr
                                key={index}
                                className="group transition-colors dark:!border-gray-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                            >
                                <td className="text-center border-r !border-gray-200 dark:!border-gray-500 text-xs font-medium text-gray-400">{index + 1}</td>
                                
                                {columns.map((col) => {
                                    // 1. item
                                    if (col.type === "item") {
                                        return (
                                            <td key={col.key} className="px-3 py-2 border-r !border-gray-200 dark:!border-gray-500">
                                                <h1 className="text-xs font-medium text-gray-900 dark:text-gray-100">{item[col.key]}</h1>
                                                {col.subKey && (
                                                    <p className="text-gray-400 text-[10px] dark:text-gray-400 font-normal">{item[col.subKey]}</p>
                                                )}
                                            </td>
                                        );
                                    }

                                    // 2. discount
                                    if (col.type === "discount") {
                                        const qtyLabel = col.qtyLabel || "quantity";
                                        const pLabel = col.priceLabel || "price";
                                        const lineSubtotal = toSafeNumber(item?.[qtyLabel]) * toSafeNumber(item?.[pLabel]);
                                        const discountPercent = toSafeNumber(item[col.key]);
                                        const discountAmount = roundToTwo((lineSubtotal * discountPercent) / 100);

                                        return (
                                            <td key={col.key} className="px-2 py-1 border-r !border-gray-200 dark:!border-gray-500 text-right tabular-nums text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center justify-end gap-1 text-xs">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={item[col.key] ?? ""}
                                                        placeholder="0"
                                                        onChange={(e) => onCellChange(index, col.key, toSafeNumber(e.target.value))}
                                                        className="w-14 no-spinner rounded-sm border border-transparent hover:border-gray-300 px-1.5 py-1 text-center outline-0 dark:text-white bg-transparent"
                                                        onWheel={(e) => e.target.blur()}
                                                        max="100"
                                                    />
                                                    <span className="text-gray-400 scale-90">%</span>
                                                    <span className="text-gray-300">=</span>
                                                    <span className="text-gray-400 scale-90">$</span>
                                                    <input
                                                        type="number"
                                                        value={lineSubtotal > 0 || discountAmount > 0 ? discountAmount : ""}
                                                        placeholder="0.00"
                                                        step="any"
                                                        onChange={(e) => {
                                                            const nextAmount = toSafeNumber(e.target.value);
                                                            const nextPercent = lineSubtotal > 0 ? roundToTwo((nextAmount / lineSubtotal) * 100) : 0;
                                                            onCellChange(index, col.key, nextPercent);
                                                        }}
                                                        className="w-16 no-spinner rounded-sm border border-transparent hover:border-gray-300 px-1.5 py-1 text-right outline-0 dark:text-white bg-transparent"
                                                        onWheel={(e) => e.target.blur()}
                                                        max={lineSubtotal}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    }

                                    // 3. string
                                    if (col.type === "string") {
                                        return (
                                            <td key={col.key} className="p-0 border-r relative !border-gray-200 dark:!border-gray-500">
                                                <div className="flex flex-col">
                                                    <input
                                                        type="text"
                                                        value={item[col.key] ?? ""}
                                                        placeholder="..."
                                                        onChange={(e) => onCellChange(index, col.key, e.target.value)}
                                                        className="w-full h-full min-h-[38px] hover:border hover:border-gray-300 px-3 py-2 text-left hover:transition-all outline-0 dark:text-white bg-transparent text-xs font-normal"
                                                    />
                                                    {col.render && <div className="px-3 pb-1 -mt-1">{col.render(item, index)}</div>}
                                                </div>
                                            </td>
                                        );
                                    }

                                    // 4. number
                                    if (col.type === "number") {
                                        return (
                                            <td key={col.key} className="p-0 border-r relative !border-gray-200 dark:!border-gray-500">
                                                <div className="flex flex-col">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={item[col.key] ?? ""}
                                                        placeholder="0"
                                                        onChange={(e) => onCellChange(index, col.key, e.target.value === "" ? "" : Number(e.target.value))}
                                                        className="w-full h-full min-h-[38px] hover:border hover:border-gray-300 px-3 py-2 text-center hover:transition-all outline-0 dark:text-white bg-transparent text-xs font-normal"
                                                        onWheel={(e) => e.target.blur()}
                                                    />
                                                    {col.render && <div className="px-2 pb-1 -mt-2 text-center">{col.render(item, index)}</div>}
                                                </div>
                                            </td>
                                        );
                                    }

                                    // 5. select
                                    if (col.type === "select") {
                                        const compositeKey = `${index}-${col.key}`;
                                        const options = col.selectOptions || [];
                                        const labelKey = col.selectLabel || col.key;
                                        const meta = getSelectOptionMeta(item?.[labelKey] || options?.[0]?.value || "", options);

                                        return (
                                            <td key={col.key} className="px-2 py-1.5 border-r !border-gray-200 dark:!border-gray-500">
                                                <div className="inline-flex">
                                                    <button
                                                        type="button"
                                                        ref={(element) => {
                                                            if (element) triggerRefs.current[compositeKey] = element;
                                                            else delete triggerRefs.current[compositeKey];
                                                        }}
                                                        onClick={() => {
                                                            const trigger = triggerRefs.current[compositeKey];
                                                            if (!trigger) return;
                                                            const rect = trigger.getBoundingClientRect();
                                                            setMenuPosition({
                                                                top: Math.max(rect.top - 8, 0),
                                                                left: rect.left,
                                                                width: Math.max(rect.width, 128),
                                                            });
                                                            if (openSelectIndex === index && activeSelectKey === col.key) {
                                                                setOpenSelectIndex(null);
                                                                setActiveSelectKey(null);
                                                            } else {
                                                                setOpenSelectIndex(index);
                                                                setActiveSelectKey(col.key);
                                                            }
                                                        }}
                                                        className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-all ${meta.className}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <h1>{meta.label}</h1>
                                                            <FaAngleDown/>
                                                        </div>
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    }

                                    // 6. bool
                                    if (col.type === "bool") {
                                        return (
                                            <td key={col.key} className="px-3 py-2 border-r text-center !border-gray-200 dark:!border-gray-500 w-16">
                                                <input
                                                    type="checkbox"
                                                    checked={!!item[col.key]}
                                                    onChange={(e) => onCellChange(index, col.key, e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer accent-blue-600"
                                                />
                                            </td>
                                        );
                                    }

                                    // 7. date
                                    if (col.type === "date") {
                                        return (
                                            <td key={col.key} className="p-0 border-r relative !border-gray-200 dark:!border-gray-500 w-40">
                                                <input
                                                    type="date"
                                                    value={item[col.key] ?? ""}
                                                    onChange={(e) => onCellChange(index, col.key, e.target.value)}
                                                    className="w-full h-full min-h-[38px] hover:border hover:border-gray-300 px-3 py-2 text-left hover:transition-all outline-0 dark:text-white bg-transparent text-xs font-normal cursor-pointer dark:[color-scheme:dark]"
                                                />
                                            </td>
                                        );
                                    }

                                    // 8. showonly
                                    if (col.type === "showonly") {
                                        return (
                                            <td key={col.key} className={`px-3 py-2 border-r font-medium text-gray-500 dark:text-gray-400 !border-gray-200 dark:!border-gray-500 text-xs ${col.dataClassName || 'text-right tabular-nums'}`}>
                                                {col.render ? col.render(item, index) : (item[col.key] ?? "-")}
                                            </td>
                                        );
                                    }

                                    return null;
                                })}

                                <td className="px-1 py-2 text-2xl text-gray-300 text-center w-5">
                                    <button type="button" onClick={() => onDelete(index)} className="cursor-pointer hover:text-red-500 transition-colors">×</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        // Standard Blank Grid Placeholder rows
                        [1, 2, 3].map((i) => (
                            <tr key={i} className="group transition-colors dark:!border-gray-500 h-[39px]">
                                <td className="text-center border-r !border-gray-200 dark:!border-gray-500 text-gray-300 text-xs">{i}</td>
                                {columns.map((col) => (
                                    <td 
                                        key={col.key} 
                                        className="border-r !border-gray-200 dark:!border-gray-500"
                                    />
                                ))}
                                <td className="px-1 py-2 text-2xl text-gray-200 text-center w-5">×</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* Portal Selection Picker Dropdown */}
        {openSelectIndex !== null && activeSelectKey !== null && currentActiveColumn && createPortal(
            <div
                ref={menuRef}
                style={{
                    position: "fixed",
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`,
                    minWidth: `${menuPosition.width}px`,
                    transform: "translateY(-100%)",
                }}
                className="z-[9999] rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
                {(currentActiveColumn.selectOptions || []).map((option, optionIndex) => {
                    const optionsList = currentActiveColumn.selectOptions || [];
                    const labelKey = currentActiveColumn.selectLabel || currentActiveColumn.key;
                    const optionMeta = getSelectOptionMeta(option.value, optionsList);
                    const activeItem = data?.[openSelectIndex];
                    const isSelected = option.value === (activeItem?.[labelKey] || optionsList?.[0]?.value || "");

                    return (
                        <button
                            key={optionIndex}
                            type="button"
                            onClick={() => {
                                onCellChange(openSelectIndex, labelKey, option.value);
                                setOpenSelectIndex(null);
                                setActiveSelectKey(null);
                            }}
                            className={`mb-1 flex w-full items-center justify-start rounded-md px-3 py-2 text-left text-xs font-medium transition-colors last:mb-0 ${
                                isSelected
                                    ? optionMeta.className
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>,
            document.body
        )}
        </>
    );
};

export default ItemTable;