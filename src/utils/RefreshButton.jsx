import { t } from "i18next";
import { useRef } from "react";
import { FaSyncAlt } from "react-icons/fa";
const RefreshButton = ({onRefresh}) => {
    const iconRef = useRef(null);
    const handleRefresh =()=>{
        if(iconRef.current){
            iconRef.current.style.transition = "transform 0.5s ease-in-out";
            iconRef.current.style.transform = "rotate(360deg)";
            setTimeout(() => {
                iconRef.current.style.transform = "rotate(0deg)";
            }, 500);
        }
        onRefresh();
    }
    return (
        <div>
            <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 hover:cursor-pointer px-3 h-8 py-2 font-medium text-xs rounded-[2px] transition-colors border border-gray-200 text-gray-400 hover:bg-[var(--main)] hover:text-white dark:border-gray-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                <FaSyncAlt ref={iconRef} className="text-lg" />
                {t("refresh")}
            </button>
        </div>
    )
}
export default RefreshButton;