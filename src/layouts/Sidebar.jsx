import React, { useEffect, useState } from "react";
import { Drawer, Avatar, Badge } from "antd";
import { useNavigate, useLocation, Link } from "react-router";
import { HiCog } from "react-icons/hi";
import { useOutletsContext } from "./Management";
import { useGetUserProfileQuery } from "../../app/Features/usersSlice";
import { useGetMenuSidebarQuery } from "../../app/Features/permissionSlice";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.jpg";

const Sidebar = ({ darkMode }) => {
  const { setSidebar, sidebar } = useOutletsContext();
  const { t } = useTranslation();
  const [menu, setMenu] = useState([]);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.matchMedia("(max-width: 1023px)").matches : false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const proId = localStorage.getItem("profileId");
  const collapsed = !sidebar;
  const sidebarWidth = collapsed && !isMobile ? "w-20" : "w-[250px]";
  const menuContentPadding = collapsed ? "px-2" : "";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = (event) => setIsMobile(event.matches);
    handleChange(mediaQuery);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const { data: profile } = useGetUserProfileQuery({ id: proId, token });
  const { data: permData } = useGetMenuSidebarQuery(token);

  useEffect(() => {
    let storedMenus = [];
    const storedMenusRaw = localStorage.getItem("menus-sidebar");
    if (storedMenusRaw) {
      try {
        storedMenus = JSON.parse(storedMenusRaw);
      } catch {
        storedMenus = [];
      }
    }

    const menuData = permData?.data ?? storedMenus ?? [];

    if (menuData?.length) {
      const perms = menuData.filter(i => i.active === 1);
      setMenu(perms);
    }
  }, [permData]);

  const user = profile?.data;

  const CustomNavLink = ({ item }) => {
    const isActive = location.pathname === item.menu_path;

    return (
      <div
        onClick={() => { if (isMobile) setSidebar(false); navigate(item.menu_path); }}
        title={collapsed ? item.menu_name : undefined}
        className={`group flex items-center ${collapsed && !isMobile ? 'justify-center px-0 py-3 mx-2' : 'gap-3 px-4 py-1 mx-4'} rounded-2xl cursor-pointer transition-all duration-300 mb-1
          ${isActive
            ? darkMode
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
              : 'bg-blue-600 text-white shadow-lg'
            : darkMode
              ? 'text-slate-400 hover:bg-gray-700 hover:text-slate-100'
              : 'text-slate-300 hover:bg-slate-100/70 hover:text-slate-900'}`}
      >
        <div className={`p-2 rounded-xl transition-all duration-300
          ${isActive ? 'bg-white/50' : darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-slate-50 group-hover:bg-white'}`}>
          {item?.menu_icon && <img className={item?.menu_icon ? 'w-5 h-5' : ''} src={item?.menu_icon} alt="" />}
        </div>

        <span className={`font-semibold text-[14px] tracking-tight ${collapsed && !isMobile ? 'hidden' : 'flex-1'}`}>
          {item?.menu_name}
        </span>

        {collapsed && (
          <span className="absolute left-full top-1/5 hidden -translate-y-1/2 translate-x-2 rounded-full bg-slate-900 px-3 py-1 text-xs text-white shadow-lg group-hover:block">
            {item?.menu_name}
          </span>
        )}

        {isActive && !collapsed && (
          <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className={`flex flex-col h-full ${sidebarWidth} !transition-all !duration-300 ${darkMode ? "bg-primary-dark border-gray-600" : "bg-side-light border-slate-100"}`}>
      {/* Profile Card Simplified */}
      <div className={`${collapsed && !isMobile ? 'flex flex-col items-center justify-center py-4 gap-3 bg-transparent' : 'm-6 p-2 border border-gradient-gold-sidebar'} rounded-[2rem] flex ${collapsed ? 'items-center' : 'items-center gap-3'} ${darkMode ? "border-gray-600" : "bg-slate-200 border-slate-100"}`}>
        <Link to={'/profile/' + proId} className={`flex items-center gap-3 ${collapsed && !isMobile ? 'justify-center w-full' : ''}`}>
          <Badge dot color="#10B981" offset={[-5, 35]}>
            <Avatar
              size={collapsed && !isMobile ? 38 : 45}
              src={user?.image}
              className={`border-2 shadow-sm ${darkMode ? "border-gray-600" : "border-white"}`}
            >
              {collapsed && !isMobile ? 'P' : user?.profile_name?.charAt(0)}
            </Avatar>
          </Badge>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className={`font-bold text-sm truncate mb-0 text-slate-100`}>
                {user?.profile_name || "Admin"}
              </p>
              <p className={`text-xs font-medium uppercase tracking-tighter ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
                {t("company")}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${menuContentPadding}`}>
        <div className={`${collapsed && !isMobile ? 'px-0' : 'px-6'} mb-2`}>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${collapsed ? 'sr-only' : 'px-4'} ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{t("menu")}</span>
        </div>
        {menu?.filter(m => m.menu_name.toLowerCase() != 'setting').map((item) => <CustomNavLink key={item.menu_id} item={item} />)}
      </div>

      {/* Footer / Settings */}
      {menu?.some(m => m.menu_name.toLowerCase() == 'setting') && (
        <div className={`mt-auto border-t ${collapsed && !isMobile ? 'p-3' : 'p-6'} ${darkMode ? "border-gray-600" : "border-slate-50"}`}>
          <Link
            to={menu?.find(m => m.menu_name.toLowerCase() == 'setting').menu_path}
            onClick={() => isMobile ? setSidebar(false) : null}
            title={collapsed ? t("settings") : undefined}
            className={`group relative flex items-center ${collapsed && !isMobile ? 'justify-center px-2 py-3 mx-2' : 'gap-3 px-4 py-3'} rounded-2xl transition-all duration-300 ${darkMode ? "text-slate-400 hover:text-red-400" : "text-slate-500 hover:text-red-600"}`}
          >
            <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-800 group-hover:bg-gray-700" : "bg-slate-50 group-hover:bg-white"}`}>
              <HiCog className="text-lg" />
            </div>
            <span className={`font-bold text-sm ${collapsed && !isMobile ? 'hidden' : ''}`}>{t("settings")}</span>
            {collapsed && !isMobile && (
              <span className="absolute left-full top-1/2 hidden -translate-y-1/2 translate-x-2 rounded-full bg-slate-900 px-3 py-1 text-xs text-white shadow-lg group-hover:block">
                {t("settings")}
              </span>
            )}
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block ${sidebarWidth} h-screen sticky top-0 transition-all duration-300 z-20 ${darkMode ? "bg-primary-dark border-gray-600" : "bg-side-light border-slate-100"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setSidebar(false)}
          open={sidebar}
          width={250}
          styles={{ body: { padding: 0 } }}
          className={darkMode ? "dark block lg:!hidden" : " block lg:!hidden"}
        >
          <SidebarContent />
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
