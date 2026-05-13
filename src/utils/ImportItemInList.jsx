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
            <button type="button" className="flex items-center outline-none gap-2 border border-gray-300 px-2 text-gray-600 py-2 rounded-md hover:bg-green-600 hover:text-white transition-colors" onClick={() => { inputRef.current.click() }}>
                <BiImport />
            </button>
        </>
    )
}