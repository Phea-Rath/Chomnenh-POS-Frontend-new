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
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    {onSearch ? (
                        <BiSearch />
                    ) : (
                        <MdArrowDropDown className="text-2xl" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    className={`w-full px-4 pr-10 py-2 bg-transparent
                    text-gray-900 dark:border-gray-400 dark:text-gray-100
                    border border-gray-400 min-w-30
                    ${onSearch ? "cursor-text" : "cursor-pointer"}
                    transition-all outline-none
                    focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500`}
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
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        onScroll={onScrollReader}
                        style={{
                            position: "fixed",
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                        }}
                        className="max-h-60 z-[9999] overflow-auto rounded-sm border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item, idx) => (
                                <li
                                    key={idx}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(item);
                                    }}
                                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20
                                    ${
                                        value == item.id
                                            ? "bg-blue-50 dark:bg-blue-900/20"
                                            : ""
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
                                            className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                                        />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between">
                                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {item.title}
                                            </p>

                                            {item.price && (
                                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                    ${item.price}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-0.5 flex items-center justify-between">
                                            {item.subtitle && (
                                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                                    {item.subtitle}
                                                </p>
                                            )}

                                            {item.quantity !== undefined &&
                                                typeof item.quantity !==
                                                    "object" && (
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        Qty: {item.quantity}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                No options found
                            </li>
                        )}
                    </motion.ul>,
                    document.body
                )}
        </div>
    );
}