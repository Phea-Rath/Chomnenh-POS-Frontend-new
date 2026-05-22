import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaTrash } from "react-icons/fa";

const ItemTable = ({
    data,
    onDelete,
    onQtyChange,
    onCostChange,
    haedTitle,
    priceLabel,
    showSelectField = false,
    selectLable,
    selectOptions = [],
    onSelectChange,
    showDiscountField = false,
    discountLabel = "discount",
    onDiscountChange,
}) => {
    const [openSelectIndex, setOpenSelectIndex] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const menuRef = useRef(null);
    const triggerRefs = useRef({});

    const toSafeNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

    const getSelectOptionMeta = (value) => {
        const selectedOption = selectOptions.find((option) => option.value === value) || selectOptions[0];
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
            const activeTrigger = openSelectIndex !== null ? triggerRefs.current[openSelectIndex] : null;
            const clickedInsideMenu = menuRef.current?.contains(event.target);
            const clickedTrigger = activeTrigger?.contains(event.target);

            if (!clickedInsideMenu && !clickedTrigger) {
                setOpenSelectIndex(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openSelectIndex]);

    useEffect(() => {
        if (openSelectIndex === null) {
            return;
        }

        const updateMenuPosition = () => {
            const trigger = triggerRefs.current[openSelectIndex];

            if (!trigger) {
                return;
            }

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
    }, [openSelectIndex]);

    return (
        <>
        <div className="relative overflow-auto border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
                    <tr>
                        {haedTitle.map((item, index) => (
                            <th key={index} className="px-6 py-4 font-semibold">{item.title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                    {data?.map((item, index) => {
                        const lineSubtotal = toSafeNumber(item?.quantity) * toSafeNumber(item?.[priceLabel]);
                        const discountPercent = toSafeNumber(item?.[discountLabel]);
                        const discountAmount = roundToTwo((lineSubtotal * discountPercent) / 100);
                        const lineTotal = showDiscountField
                            ? lineSubtotal - discountAmount
                            : lineSubtotal;

                        return (
                        <tr
                            key={index}
                            className="group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                        >
                            <td className="px-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {item.name}
                                </span>
                            </td>
                            {showSelectField && (
                            <td className="px-1 py-2">
                                <div className="inline-flex">
                                    <button
                                        type="button"
                                        ref={(element) => {
                                            if (element) {
                                                triggerRefs.current[index] = element;
                                            } else {
                                                delete triggerRefs.current[index];
                                            }
                                        }}
                                        onClick={() => {
                                            const trigger = triggerRefs.current[index];

                                            if (!trigger) {
                                                return;
                                            }

                                            const rect = trigger.getBoundingClientRect();
                                            setMenuPosition({
                                                top: Math.max(rect.top - 8, 0),
                                                left: rect.left,
                                                width: Math.max(rect.width, 128),
                                            });
                                            setOpenSelectIndex((prev) => (prev === index ? null : index));
                                        }}
                                        className={`inline-flex items-center justify-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all ${
                                            getSelectOptionMeta(item?.[selectLable] || selectOptions?.[0]?.value || "").className
                                        }`}
                                    >
                                        {getSelectOptionMeta(item?.[selectLable] || selectOptions?.[0]?.value || "").label}
                                    </button>
                                </div>
                            </td>
                            )}
                            <td className="px-1 py-2">
                                <div className="flex justify-center">
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={item?.quantity}
                                        id="quantity"
                                        placeholder="0"
                                        onChange={(e) => onQtyChange(index, Number(e.target.value))}
                                        className="w-20 rounded-sm hover:border hover:border-gray-300 px-2 py-1 text-center hover:transition-all outline-0  dark:text-white"
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </div>
                            </td>
                            <td className="px-1 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                                {/* ${item.price.toLocaleString()} */}
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        name="price"
                                        value={item[priceLabel]}
                                        id="price"
                                        placeholder="0"
                                        onChange={(e) => onCostChange(index, Number(e.target.value))}
                                        className="w-20 no-spinner rounded-sm hover:border hover:border-gray-300 px-2 py-1 text-center hover:transition-all outline-0  dark:text-white"
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </div>
                            </td>
                            {showDiscountField && (
                            <td className="px-1 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                                <div className="flex items-center justify-end gap-1">
                                    <input
                                        type="number"
                                        step='any'
                                        name={discountLabel}
                                        value={item?.[discountLabel] || ""}
                                        placeholder="0"
                                        onChange={(e) => {
                                            const nextPercent = toSafeNumber(e.target.value);
                                            onDiscountChange(index, nextPercent);
                                        }}
                                        className="w-20 no-spinner rounded-sm hover:border hover:border-gray-300 px-2 py-1 text-center hover:transition-all outline-0  dark:text-white"
                                        onWheel={(e) => e.target.blur()}
                                        // min="0"
                                        max="100"
                                        />
                                    <span>%</span>
                                        <span>=</span>
                                    <span>$</span>
                                    <input
                                        type="number"
                                        name={`${discountLabel}_amount`}
                                        value={lineSubtotal > 0 || discountAmount > 0 ? discountAmount : ""}
                                        placeholder="0"
                                        step='any'
                                        onChange={(e) => {
                                            const nextAmount = toSafeNumber(e.target.value);
                                            const nextPercent = lineSubtotal > 0
                                                ? roundToTwo((nextAmount / lineSubtotal) * 100)
                                                : 0;
                                            onDiscountChange(index, nextPercent);
                                        }}
                                        className="w-20 no-spinner rounded-sm hover:border hover:border-gray-300 px-2 py-1 text-center hover:transition-all outline-0  dark:text-white"
                                        onWheel={(e) => e.target.blur()}
                                        // min="0"
                                        max={lineSubtotal}
                                    />
                                    
                                </div>
                            </td>
                            )}
                            <td className="px-1 py-2 text-right font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                                ${lineTotal.toLocaleString()}
                            </td>
                            <td className="px-1 py-2 text-right">
                                <button
                                    onClick={() => onDelete(index)}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        {openSelectIndex !== null && createPortal(
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
                {selectOptions.map((option, optionIndex) => {
                    const optionMeta = getSelectOptionMeta(option.value);
                    const activeItem = data?.[openSelectIndex];
                    const isSelected = option.value === (activeItem?.[selectLable] || selectOptions?.[0]?.value || "");

                    return (
                        <button
                            key={optionIndex}
                            type="button"
                            onClick={() => {
                                onSelectChange(openSelectIndex, option.value);
                                setOpenSelectIndex(null);
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
    )
}

export default ItemTable;
