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
            className="flex items-center gap-2 hover:cursor-pointer px-3 py-2 font-medium text-xs transition-colors border border-gray-300 dark:border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
                <FaSyncAlt ref={iconRef} className="text-lg" />
                {t("refresh")}
            </button>
        </div>
    )
}
export default RefreshButton;