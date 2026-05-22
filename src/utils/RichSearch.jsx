import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { BiSearch } from 'react-icons/bi';
import { MdArrowDropDown } from 'react-icons/md';

const convertDataForRichSearch = (data, {id, title, subtitle, image, price, quantity})=> data?.map((item)=>{
            if(!image){
                return{
                    id:item[id],
                    title:item[title],
                    subtitle:item[subtitle],
                    price:item[price],
                    quantity:item[quantity]?.in_stock || item[quantity],
                }
            }
            return{
                id:item[id],
                title:item[title],
                subtitle:item[subtitle],
                image:item[image],
                price:item[price],
                quantity:item[quantity]?.in_stock || item[quantity],
            }

            
        });

export default function RichSearch({ data = [], keyFields={}, onScrollReader, onSelected, onSearch, value, ...props }) {
    
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const [query, setQuery] = useState(null);
    const [selectId, setSelectId] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    // const [newData, setNewData] = useState([]);
    const containerRef = useRef(null);
    const [filteredItems, setFilteredItems] = useState([]);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    
    useEffect(() => {
        if(keyFields && Object.keys(keyFields).length > 0){
            const convertedData = convertDataForRichSearch(data, keyFields);
            const normalizedQuery = typeof query === "string" ? query.trim().toLowerCase() : "";
            const nextItems = !normalizedQuery
                ? convertedData
                : convertedData.filter((item) =>
                    item?.title?.toLowerCase().includes(normalizedQuery)
                );

            setFilteredItems(nextItems);
            setSelectId(value);
            let dataValue;
            if(query == null){
                dataValue = convertedData?.find((item) => item.id == value)?.title;
                
                if(dataValue){
                    setQuery(dataValue);
                    inputRef.current.value = dataValue;
                }else if(inputRef.current && !isOpen){
                    inputRef.current.value = "";
                }
            }
        }
    }, [data, value, keyFields, query, isOpen]);
    
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInput = containerRef.current?.contains(event.target);
            const clickedDropdown = dropdownRef.current?.contains(event.target);

            if (!clickedInput && !clickedDropdown) {
                setIsOpen(false);
                 if(query){
                    inputRef.current.value = query;
                    inputRef.current.placeholder = query;
                }else{
                    setQuery(inputRef.current.placeholder);
                    // console.log(query);
                    inputRef.current.value = inputRef.current.placeholder;
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [query]);

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

    function onFocusHandler(){
        setIsOpen(true);
        if(query){
            setQuery('');
            inputRef.current.value = '';
            inputRef.current.placeholder = query;
        }else{
            setQuery('');
        }
    }

    function handleSelect(item){
        inputRef.current.blur();
        setQuery(item.title);
        setSelectId(item.id);
        setIsOpen(false);
        if (inputRef.current) {
            inputRef.current.value = item.title;
            inputRef.current.placeholder = item.title;
        }
        onSelected(item.id);
        onSearch?.('');
    }


    return (
        <div className="mx-auto w-full" ref={containerRef}>
            <div className="relative min-w-30">
                <div className="absolute inset-y-0 right-2 flex items-center pl-3 pointer-events-none">
                    {onSearch ? <BiSearch/> : <MdArrowDropDown className='text-2xl'/>}
                </div>

                <input
                    type="text"
                    ref={inputRef}
                    className={`w-full px-4 pr-10 py-2 bg-transparent 
                    text-gray-900 dark:border-gray-400 dark:text-gray-100
                    border border-gray-400 min-w-30 ${onSearch?'cursor-text':'cursor-pointer'}
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
            {isOpen && createPortal(
                <motion.ul
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onScroll={onScrollReader}
                    style={{
                        position: "fixed",
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                    }}
                    className="absolute max-h-60 z-[9999] overflow-auto rounded-sm border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >
                    {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                        <li
                            key={idx}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(item);
                            }}
                            className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${selectId === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                            {Object.keys(item).includes('image') && <img src={item.image || import.meta.env.VITE_INITIAL_IMAGE} onError={(e) => e.target.src = import.meta.env.VITE_INITIAL_IMAGE} alt={item.title} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between">
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                                    {item.price && <span className="text-sm font-bold text-blue-600 dark:text-blue-400">${item.price}</span>}
                                </div>
                                <div className="mt-0.5 flex items-center justify-between">
                                    {item.subtitle && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>}
                                    {item.quantity && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                        Qty: {item.quantity}
                                    </span>}
                                </div>
                            </div>
                        </li>
                    )) : (
                        <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No options found</li>
                    )}
                </motion.ul>,
                document.body
            )}
        </div>
    );
}
