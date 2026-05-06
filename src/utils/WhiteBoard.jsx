import { useRef } from "react";
import { HiOutlineRefresh } from "react-icons/hi";
const WhiteBoard = () => {
    const iconRef = useRef(null);
    const handleRefresh =()=>{
        if(iconRef.current){
            iconRef.current.style.transition = "transform 0.5s ease-in-out";
            iconRef.current.style.transform = "rotate(360deg)";
            setTimeout(() => {
                iconRef.current.style.transform = "rotate(0deg)";
            }, 500);
        }
    }
    return (
        <div>
            <button 
            onClick={handleRefresh}
            className="flex text-xs items-center gap-2 border-1 bg-transparent rounded-md px-3 py-2 dark:border-white dark:text-white dark:hover:bg-white/10 hover:cursor-pointer">
                <HiOutlineRefresh ref={iconRef} className="text-lg" />
                Refresh
            </button>
        </div>
    )
}
export default WhiteBoard;