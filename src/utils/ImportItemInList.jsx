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
            <button type="button" 
                className="flex  bg-gradient-to-b from-gray-50 to-gray-200  items-center outline-none gap-2 border border-gray-200 text-gray-600 p-2 rounded-none text-xl transition-colors"
                onClick={() => { inputRef.current.click() }}>
                <BiImport />
            </button>
        </>
    )
}