import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const EnumSelect = ({
    value,
    selectOptions = [],
    onChange,
    loading = false,
    disabled = false,
}) => {
    const [open, setOpen] = useState(false);

    const [selectedValue, setSelectedValue] =
        useState(value);

    const [menuPosition, setMenuPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
    });

    const menuRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    useEffect(() => {
        if (loading) {
            setOpen(false);
        }
    }, [loading]);

    const selectedOption =
        selectOptions.find(
            (opt) =>
                String(opt.value) ===
                String(selectedValue)
        ) ||
        selectOptions.find(
            (opt) =>
                String(opt.value) === String(value)
        );

    const getOptionStyle = (optionValue) => {
        const option = selectOptions.find(
            (item) =>
                String(item.value) ===
                String(optionValue)
        );

        return (
            option?.color ||
            "border-gray-200 bg-gray-50 text-gray-700"
        );
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !menuRef.current?.contains(event.target) &&
                !triggerRef.current?.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    useEffect(() => {
        if (!open) return;

        const updateMenuPosition = () => {
            if (!triggerRef.current) return;

            const rect =
                triggerRef.current.getBoundingClientRect();

            setMenuPosition({
                top: rect.bottom + 6,
                left: rect.left,
                width: Math.max(rect.width, 140),
            });
        };

        updateMenuPosition();

        window.addEventListener(
            "resize",
            updateMenuPosition
        );

        window.addEventListener(
            "scroll",
            updateMenuPosition,
            true
        );

        return () => {
            window.removeEventListener(
                "resize",
                updateMenuPosition
            );

            window.removeEventListener(
                "scroll",
                updateMenuPosition,
                true
            );
        };
    }, [open]);

    const openMenu = () => {
        setOpen((prev) => !prev);
    };

    return (
        <>
            <button
                type="button"
                ref={triggerRef}
                onClick={openMenu}
                disabled={disabled || loading}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${getOptionStyle(
                    selectedValue
                )} ${disabled || loading ? "cursor-not-allowed opacity-70" : ""}`}
            >
                {loading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : selectedOption?.icon ? (
                    <selectedOption.icon className="h-4 w-4" />
                ) : null}

                <span>
                    {selectedOption?.label || "Select"}
                </span>
            </button>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: "fixed",
                            top: menuPosition.top,
                            left: menuPosition.left,
                            minWidth: menuPosition.width,
                        }}
                        className="z-[9999] rounded-lg border border-gray-200 p-1 shadow-xl bg-chomnenh-light"
                    >
                        {selectOptions.map(
                            (option, idx) => {
                                const isSelected =
                                    String(
                                        option.value
                                    ) ===
                                    String(
                                        selectedValue
                                    );

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={loading || disabled}
                                        onClick={() => {
                                            setSelectedValue(
                                                option.value
                                            );

                                            onChange?.(
                                                option.value
                                            );

                                            setOpen(
                                                false
                                            );
                                        }}
                                        className={`mb-1 flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-all last:mb-0 ${
                                            isSelected
                                                ? getOptionStyle(
                                                      option.value
                                                  )
                                                : "hover:bg-gray-100/40 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        {option.icon ? (
                                            <option.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                                        ) : null}

                                        {option.label}
                                    </button>
                                );
                            }
                        )}
                    </div>,
                    document.body
                )}
        </>
    );
};

export default EnumSelect;
