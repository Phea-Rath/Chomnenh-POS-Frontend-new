import { useEffect, useRef } from "react";
import { BiImport } from "react-icons/bi";

export default function ImportItemInList({ onSelected }) {
    const inputRef = useRef(null);

    return (
        <>
            <input type="file" hidden accept=".xlsx,.xls,.csv" 
            onChange={onSelected}
            ref={inputRef}
            />
            <button type="button" className="flex items-center outline-none gap-2 border border-gray-400 text-gray-600 dark:text-gray-50 p-2 rounded-none hover:bg-green-600 hover:text-white text-xl transition-colors" onClick={() => { inputRef.current.click() }}>
                <BiImport />
            </button>
        </>
    )
}