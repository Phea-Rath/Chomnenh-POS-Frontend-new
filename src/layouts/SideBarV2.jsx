import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useGetCurrentMenusWebsiteQuery } from "../../app/Features/menusSlice";
import { useGetUserProfileQuery } from "../../app/Features/usersSlice";
import { 
  HiChevronDown, 
  HiOutlineLogout, 
  HiOutlineMenuAlt2,
  HiOutlineHome, 
  HiOutlineCube, 
  HiOutlineShoppingCart, 
  HiOutlineClipboardList, 
  HiOutlineChartBar, 
  HiOutlineCog,
  HiOutlineUserGroup,
  HiOutlineCollection,
  HiOutlineDocumentText,
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlineUsers,
  HiOutlineDatabase,
  HiOutlineTrendingUp
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, Badge, Spin } from "antd";
import { useTranslation } from "react-i18next";
import iconFallback from "../assets/stock.png";
import { useOutletsContext } from "./Management";

const SideBarV2 = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebar, setSidebar } = useOutletsContext();
  
  const token = localStorage.getItem("token");
  const proId = localStorage.getItem("profileId");

  const { data: menuResponse, isFetching: menuLoading } = useGetCurrentMenusWebsiteQuery({ token });
  const { data: profileResponse } = useGetUserProfileQuery({ id: proId, token });

  const [openMenus, setOpenMenus] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isKhmer = i18n.language === "kh";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const menus = menuResponse?.data || [];
  const user = profileResponse?.data;

  // isExpanded is true if manually toggled OR hovered on desktop
  const isExpanded = isMobile ? sidebar : (sidebar || isHovered);

  const getFallbackIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("dashboard")) return <HiOutlineChartBar className="w-5 h-5" />;
    if (n.includes("home")) return <HiOutlineHome className="w-5 h-5" />;
    if (n.includes("order")) return <HiOutlineShoppingCart className="w-5 h-5" />;
    if (n.includes("inventory") || n.includes("product") || n.includes("category") || n.includes("brand")) return <HiOutlineCube className="w-5 h-5" />;
    if (n.includes("setting") || n.includes("permission") || n.includes("role")) return <HiOutlineCog className="w-5 h-5" />;
    if (n.includes("report")) return <HiOutlineCollection className="w-5 h-5" />;
    if (n.includes("user")) return <HiOutlineUsers className="w-5 h-5" />;
    if (n.includes("customer") || n.includes("supplier")) return <HiOutlineUserGroup className="w-5 h-5" />;
    if (n.includes("quotation")) return <HiOutlineDocumentText className="w-5 h-5" />;
    if (n.includes("expense")) return <HiOutlineCash className="w-5 h-5" />;
    if (n.includes("delivery") || n.includes("tracking")) return <HiOutlineTruck className="w-5 h-5" />;
    if (n.includes("stock") || n.includes("warehouse")) return <HiOutlineDatabase className="w-5 h-5" />;
    if (n.includes("analysis") || n.includes("profit")) return <HiOutlineTrendingUp className="w-5 h-5" />;
    return <HiOutlineMenuAlt2 className="w-5 h-5" />;
  };

  const isActive = (path) => location.pathname === path;
  
  const isParentActive = (item) => {
    if (isActive(item.menu_path)) return true;
    return item.menus?.some((child) => {
        if (isActive(child.menu_path)) return true;
        if (child.menus?.length > 0) return isParentActive(child);
        return false;
    });
  };

  useEffect(() => {
    if (menus.length > 0) {
      const newOpenMenus = { ...openMenus };
      const checkAndOpen = (items) => {
        items.forEach((item) => {
          if (item.menus?.some((child) => isActive(child.menu_path) || (child.menus?.length > 0 && isParentActive(child)))) {
            newOpenMenus[item.menu_id] = true;
            if (item.menus) checkAndOpen(item.menus);
          }
        });
      };
      checkAndOpen(menus);
      setOpenMenus(newOpenMenus);
    }
  }, [location.pathname, menuResponse]);

  const MenuItem = ({ item, level = 0 }) => {
    const hasChildren = item.menus && item.menus.length > 0;
    const isOpen = openMenus[item.menu_id];
    const active = isActive(item.menu_path);
    const parentActive = isParentActive(item);
    const hasImageError = imageErrors[item.menu_id];
    
    const displayName = (isKhmer && item.menu_name_km) ? item.menu_name_km : item.menu_name;

    const handleItemClick = () => {
        if (hasChildren) {
            if (!isExpanded && !isMobile) return;
            setOpenMenus(prev => ({[item.menu_id]: !prev[item.menu_id] }));
        } else {
            navigate(item.menu_path);
            if (isMobile) setSidebar(false);
        }
    };

    return (
      <div className="flex flex-col">
        <div
          className={`group relative flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-0"} py-2.5 my-0.5 mx-2 rounded-xl cursor-pointer transition-all duration-200 
            ${active 
              ? "bg-blue-600 text-white shadow-blue-500/20" 
              : parentActive && hasChildren
                ? "bg-blue-900/20 text-blue-400"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
            }
            ${level > 0 && isExpanded ? "ml-6" : ""}`}
          onClick={handleItemClick}
          title={!isExpanded ? displayName : ""}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200 
                `}>
                {item.menu_icon && !hasImageError ? (
                  <img
                    src={item.menu_icon}
                    onError={() => setImageErrors(prev => ({ ...prev, [item.menu_id]: true }))}
                    className={`w-5 h-5 object-contain ${active ? "brightness-0 invert" : "invert opacity-80"}`}
                    alt=""
                  />
                ) : (
                  <div className={active ? "text-white" : "text-gray-400"}>
                    {getFallbackIcon(item.menu_name)}
                  </div>
                )}  
            </div>
            {isExpanded && (
              <span className={`truncate tracking-tight transition-all duration-200
                ${level === 0 ? "text-sm capitalize tracking-wider" : "text-[12px] "}
                ${active ? "text-white opacity-100" : ""}`}>
                {displayName}
              </span>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div
              className={`${active ? "text-white" : "text-gray-400"}`}
            >
              <HiChevronDown className="w-4 h-4" />              
            </div>
          )}
        </div>     

        {hasChildren && isExpanded && (
          <AnimatePresence>
            {isOpen && (
              <div
                className="overflow-hidden"
              >
                {item.menus.map((child) => (
                  <MenuItem key={child.menu_id} item={child} level={level + 1} />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isMobile && sidebar && (
          <div
            onClick={() => setSidebar(false)}
            className="fixed inset-0 z-[40] bg-black/40  lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Layout Placeholder to prevent content shifting on desktop */}
      {!isMobile && (
        <div 
          className={`transition-all duration-300 flex-shrink-0 ${sidebar ? "w-[250px]" : "w-[80px]"}`}
        />
      )}

      <aside 
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 transform
          ${isMobile ? (sidebar ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]") : (isExpanded ? "w-[250px]" : "w-[80px]")} 
          dark:bg-[#0f172a] bg-[#102A43] border-gray-800 border-r shadow-xs overflow-hidden`}
      >
        
        {/* Header Profile */}
        <div className={`p-4 mb-2 border-gray-700 border-b transition-all duration-300 
            ${isExpanded ? "px-6" : "px-0 flex justify-center"}`}>
          <Link to={`/profile/${proId}`} className="flex items-center gap-4 group">
            <Badge dot color="#10B981" offset={isExpanded ? [-4, 32] : [-2, 28]} size="small">
              <Avatar
                size={isExpanded ? 48 : 40}
                src={user?.image}
                className={`border-2 transition-all duration-300 group-hover:scale-105 border-blue-900 shadow-blue-900/20}`}
              >
                {user?.profile_name?.charAt(0) || "U"}
              </Avatar>
            </Badge>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden animate-in fade-in duration-500">
                <h2 className={`text-sm font-bold truncate text-white`}>
                  {user?.profile_name || "Admin"}
                </h2>
                <span className={`text-[9px] font-black uppercase tracking-widest text-blue-400`}>
                  {user?.role_name || t("administrator")}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-1 custom-scrollbar scrollbar-hide overflow-x-hidden">
          {isExpanded && (
            <div className="px-6 py-2 animate-in fade-in duration-500">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-gray-500`}>
                    {t("navigation")}
                </p>
            </div>
          )}
          
          {menuLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Spin size="small" />
            </div>
          ) : (
            <div className="space-y-1">
              {menus.map((item) => <MenuItem key={item.menu_id} item={item} />)}
            </div>
          )}
        </div>

        {/* Footer Settings/Logout */}
        <div className={`p-4 mt-auto border-gray-700 border-t space-y-2`}>
          <button 
              onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
              }}
              className={`w-full flex items-center ${isExpanded ? "justify-start gap-3 px-4" : "justify-center px-0"} py-3 rounded-xl text-red-500 hover:bg-red-900/20 transition-all duration-200 font-bold text-xs uppercase tracking-wider`}
              title={!isExpanded ? t("logout") : ""}
          >
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-red-900/30">
              <HiOutlineLogout className="w-5 h-5" />
            </div>
            {isExpanded && <span className="animate-in fade-in duration-500">{t("logout")}</span>}
          </button>
        </div>

        {/* Close button for mobile */}
        {isMobile && (
          <button 
            onClick={() => setSidebar(!sidebar)}
            className="absolute -right-12 top-4 p-2 bg-blue-600 text-white rounded-r-xl shadow-lg"
          >
            <HiOutlineMenuAlt2 className="w-6 h-6 rotate-180" />
          </button>
        )}
      </aside>
    </>
  );
};

export default SideBarV2;
