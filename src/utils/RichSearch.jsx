import { useState, useRef, useEffect } from 'react';
import { backIn, motion } from 'framer-motion';
import { BiSearch } from 'react-icons/bi';
import { MdArrowDropDown } from 'react-icons/md';
const products = [
    { id: 1, title: 'Wireless Headphones', subtitle: 'Noise Cancelling - Silver', price: 299, quantity: 12, image: 'https://via.placeholder.com/40' },
    { id: 2, title: 'Mechanical Keyboard', subtitle: 'RGB - Blue Switches', price: 89, quantity: 5, image: 'https://via.placeholder.com/40' },
    { id: 3, title: 'Wireless Headphones', subtitle: 'Noise Cancelling - Silver', price: 299, quantity: 12, image: 'https://via.placeholder.com/40' },
    { id: 4, title: 'Mechanical Keyboard', subtitle: 'RGB - Blue Switches', price: 89, quantity: 5, image: 'https://via.placeholder.com/40' },
    { id: 5, title: 'Wireless Headphones', subtitle: 'Noise Cancelling - Silver', price: 299, quantity: 12, image: 'https://via.placeholder.com/40' },
    { id: 6, title: 'Mechanical Keyboard', subtitle: 'RGB - Blue Switches', price: 89, quantity: 5, image: 'https://via.placeholder.com/40' },
    { id: 7, title: 'Wireless Headphones', subtitle: 'Noise Cancelling - Silver', price: 299, quantity: 12, image: 'https://via.placeholder.com/40' },
    { id: 8, title: 'Mechanical Keyboard', subtitle: 'RGB - Blue Switches', price: 89, quantity: 5, image: 'https://via.placeholder.com/40' },
    { id: 9, title: 'Wireless Headphones', subtitle: 'Noise Cancelling - Silver', price: 299, quantity: 12, image: 'https://via.placeholder.com/40' },
    { id: 10, title: 'Mechanical Keyboard', subtitle: 'RGB - Blue Switches', price: 89, quantity: 5, image: '' }
];

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
    const [query, setQuery] = useState('');
    // const [placeholder, setPlaceholder] = useState(inputRef?.current?.placeholder || '');
    const [selectId, setSelectId] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [newData, setNewData] = useState([]);
    const containerRef = useRef(null);

    const filteredItems = newData?.filter((item) =>
        item?.title?.toLowerCase().includes(query?.toLowerCase())
    );

    useEffect(() => {
        if(keyFields && Object.keys(keyFields).length > 0){
            setNewData(convertDataForRichSearch(data, keyFields))
            setSelectId(value);
            const dataValue = newData?.find((item) => item.id == value)?.title;
            if(dataValue){
                setQuery(dataValue);
                inputRef.current.value = dataValue;
            }
        }
        // if(value == null){
        //     setQuery('');
        //     inputRef.current.value = '';
        //     inputRef.current.placeholder = "Select...";
        // }
    }, [data, value, keyFields]);

    function onFocusHandler(){
        setIsOpen(true);
        if(query){
            setQuery('');
            inputRef.current.value = '';
            inputRef.current.placeholder = query;
        }
    }

    function onBlurHandler(){
        setIsOpen(false);
        if(query){
            inputRef.current.value = query;
            inputRef.current.placeholder = query;
        }else{
            setQuery(inputRef.current.placeholder);
            console.log(query);
            inputRef.current.value = inputRef.current.placeholder;
        }
    }


    return (
        <div className="mx-auto w-full" ref={containerRef}>
            {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Product
            </label> */}

            {/* 2. This relative wrapper acts as the anchor for the absolute dropdown */}
            <div className="relative min-w-30">
                <div className="absolute inset-y-0 right-2 flex items-center pl-3 pointer-events-none">
                    {onSearch ? <BiSearch/> : <MdArrowDropDown className='text-2xl'/>}
                </div>

                <input
                    type="text"
                    ref={inputRef}
                    className={`w-full px-4 pr-10 py-2 bg-transparent 
                    text-gray-900 dark:border-gray-400 dark:text-gray-100
                    border border-gray-200 min-w-30 ${onSearch?'cursor-text':'cursor-pointer'}
                    rounded-sm transition-all outline-none
                    focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500`}
                    // placeholder={placeholder || onSearch ? "Search ..." : "Select ..."}
                    onFocus={onFocusHandler}
                    onBlur={onBlurHandler}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        onSearch(e.target.value);
                    }}
                    // value={query}
                    {...props}
                />

                {/* 3. The Dropdown: Absolute + High Z-Index */}
                {isOpen && (
                    // up to down
                    <motion.ul
                    initial={{ opacity: 0, y: -10, }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    transition={{ duration: 0.2 }} 
                    onScroll={onScrollReader} 
                    className="absolute left-0 right-0 z-[9999] mt-1 max-h-60 overflow-auto rounded-sm border border-gray-200 bg-transparent backdrop-blur-md shadow-sm dark:border-gray-700">
                        {filteredItems.map((item, idx) => (
                            <li
                                key={idx}
                                onMouseDown={() => {
                                    setQuery(item.title);
                                    setSelectId(item.id);
                                    setIsOpen(false);
                                    onSelected(item.id);
                                    onSearch('');
                                }}
                                className={`flex items-center gap-3 cursor-pointer px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${selectId === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                {Object.keys(item).includes('image') && <img src={item.image || import.meta.env.VITE_INITIAL_IMAGE} onError={(e) => e.target.src = import.meta.env.VITE_INITIAL_IMAGE} alt={item.title} className="h-10 w-10 rounded-md object-cover flex-shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.title}</p>
                                        {item.price&&<span className="text-sm font-bold text-blue-600 dark:text-blue-400">${item.price}</span>}
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                        {item.subtitle&&<p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>}
                                        {item.quantity&&<span className="text-[10px] uppercase font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                                            Qty: {item.quantity}
                                        </span>}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </div>
        </div>
    );
}