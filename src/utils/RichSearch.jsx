import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { BiSearch } from "react-icons/bi";
import { MdArrowDropDown } from "react-icons/md";

const convertDataForRichSearch = (
    data,
    { id, title, subtitle, image, price, quantity }
) =>
    data?.map((item) => ({
        id: item[id],
        title: item[title],
        subtitle: item[subtitle],
        ...(image ? { image: item[image] } : {}),
        price: item[price],
        quantity: item[quantity]?.in_stock ?? item[quantity],
    }));

export default function RichSearch({
    data = [],
    keyFields = {},
    onScrollReader,
    onSelected,
    onSearch,
    value,
    ...props
}) {
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const containerRef = useRef(null);

    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
    });

    const convertedData = useMemo(() => {
        if (!keyFields || Object.keys(keyFields).length === 0) {
            return [];
        }

        return convertDataForRichSearch(data, keyFields);
    }, [data, keyFields]);

    const selectedItem = useMemo(() => {
        return convertedData.find((item) => item.id == value);
    }, [convertedData, value]);

    // Sync input text whenever value changes
    useEffect(() => {
        if (!isOpen) {
            setQuery(selectedItem?.title || "");
        }
    }, [selectedItem, isOpen]);

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return convertedData;
        }

        return convertedData.filter((item) =>
            item?.title?.toLowerCase().includes(normalizedQuery)
        );
    }, [convertedData, query]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInput = containerRef.current?.contains(event.target);
            const clickedDropdown = dropdownRef.current?.contains(event.target);

            if (!clickedInput && !clickedDropdown) {
                setIsOpen(false);

                // Restore selected text
                setQuery(selectedItem?.title || "");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectedItem]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const updateDropdownPosition = () => {
            const rect = containerRef.current?.getBoundingClientRect();

            if (!rect) {
                return;
            }

            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        };

        updateDropdownPosition();

        window.addEventListener("resize", updateDropdownPosition);
        window.addEventListener("scroll", updateDropdownPosition, true);

        return () => {
            window.removeEventListener("resize", updateDropdownPosition);
            window.removeEventListener("scroll", updateDropdownPosition, true);
        };
    }, [isOpen]);

    const onFocusHandler = () => {
        setIsOpen(true);

        if (!onSearch) {
            setQuery("");
        }
    };

    const handleSelect = (item) => {
        setQuery(item.title);
        setIsOpen(false);

        onSelected?.(item.id);
        onSearch?.("");
        inputRef.current?.blur();
    };

    return (
        <div className="mx-auto w-full" ref={containerRef}>
            <div className="relative min-w-30">
                <div className="absolute bg-gradient-to-b from-gray-50 border border-gray-200 to-gray-200 inset-y-0 right-0 flex items-center pointer-events-none text-black">
                    {onSearch ? (
                        <BiSearch className="text-xl" />
                    ) : (
                        <MdArrowDropDown className="text-xl" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    className={`w-full px-3 py-1.5 bg-white dark:bg-gray-600/70
                    text-slate-900 dark:text-slate-100
                    placeholder:text-slate-400
                    border border-slate-200 dark:border-gray-600
                    rounded-[2px] transition-all outline-none
                    focus:border-[#13b5ea] focus:ring-0
                    text-[13px] h-[38px]
                    ${onSearch ? "cursor-text" : "cursor-pointer"}
                    `}
                    onFocus={onFocusHandler}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        onSearch?.(e.target.value);
                    }}
                    {...props}
                />
            </div>

            {isOpen &&
                createPortal(
                    <motion.ul
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.1 }}
                        onScroll={onScrollReader}
                        style={{
                            position: "fixed",
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                        }}
                        className="max-h-64 z-[9999] overflow-auto rounded-[2px] border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                    >
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item, idx) => (
                                <li
                                    key={idx}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(item);
                                    }}
                                    className={`flex cursor-pointer items-center gap-3 px-4 py-2 border-b-1 border-slate-50 dark:border-slate-600 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                                    ${
                                        value == item.id
                                            ? "bg-[#13b5ea]/5 text-[#13b5ea] font-semibold"
                                            : "text-slate-700 dark:text-slate-300"
                                    }`}
                                >
                                    {"image" in item && (
                                        <img
                                            src={
                                                item.image ||
                                                import.meta.env
                                                    .VITE_INITIAL_IMAGE
                                            }
                                            onError={(e) => {
                                                e.target.src =
                                                    import.meta.env
                                                        .VITE_INITIAL_IMAGE;
                                            }}
                                            alt={item.title}
                                            className="h-8 w-8 rounded-[1px] object-cover flex-shrink-0 border border-slate-100 dark:border-slate-800"
                                        />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-[13px]">
                                                {item.title}
                                            </p>

                                            {item.price && (
                                                <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white shrink-0">
                                                    ${item.price}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2 mt-0">
                                            {item.subtitle && (
                                                <p className="truncate text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                                                    {item.subtitle}
                                                </p>
                                            )}

                                            {item.quantity !== undefined &&
                                                typeof item.quantity !==
                                                    "object" && (
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 uppercase tracking-tighter">
                                                        STOCK: {item.quantity}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-4 text-xs text-slate-400 dark:text-slate-500 italic text-center">
                                No results found
                            </li>
                        )}
                    </motion.ul>,
                    document.body
                )}
        </div>
    );
}