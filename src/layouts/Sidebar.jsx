import React, { useEffect, useState } from "react";
import { Drawer, Avatar, Badge } from "antd";
import { useNavigate, useLocation, Link } from "react-router";
import { HiCog } from "react-icons/hi";
import { useOutletsContext } from "./Management";
import { useGetUserProfileQuery } from "../../app/Features/usersSlice";
import { useGetMenuSidebarQuery } from "../../app/Features/permissionSlice";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.jpg";
import orderInvoice from "../assets/order-invoice.png";
import icon from "../assets/stock.png"

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

  const newMenus = [
    {
      menu_id: 1,
      menu_name: "Order Invoice",
      menu_icon: orderInvoice,
      menu_path: "/home/order-invoice",
      menu_group: "home",
      active: 1,
      created_at: "",
      updated_at: "",
    }
  ]

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
      const newMenu = [...perms, ...newMenus];
      setMenu(newMenu);
    }
  }, [permData]);

  const user = profile?.data;

  const CustomNavLink = ({ key, item }) => {
    const isActive = location.pathname === item.menu_path;

    return (
      <div
        onClick={() => { if (isMobile) setSidebar(false); navigate(item.menu_path); }}
        title={collapsed ? item.menu_name : undefined}
        className={`group flex items-center ${collapsed && !isMobile ? 'justify-center px-0 py-3 mx-2' : 'gap-3 px-4 py-2 mx-4'} rounded-sm cursor-pointer transition-all duration-300 mb-1
          ${isActive
            ? 'bg-[#1e3a5f] text-white shadow-lg'
            : 'text-[#93c5fd] hover:bg-[#1e3a5f]/40 hover:text-white'}`}
      >
        <div className={`white-icon-sidebar transition-all duration-300
          `}>
          {item?.menu_icon && <img key={key} className={item?.menu_icon ? 'w-5 h-5' : ''} src={item?.menu_icon} onError={(e)=>e.target.src=icon} alt="" />}
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
    <div className={`flex flex-col h-full ${sidebarWidth} !transition-all !duration-300 bg-[#2c447c] border-r border-[#1e3a5f]/30`}>
      {/* Profile Card Simplified */}
      <div className={`${collapsed && !isMobile ? 'flex flex-col items-center justify-center py-4 gap-3' : 'm-6 p-2 border border-[#1e3a5f] border-gradient-gold-sidebar bg-[#1e3a5f]/10'} rounded-[2rem] flex ${collapsed ? 'items-center' : 'items-center gap-3'}`}>
        <Link to={'/profile/' + proId} className={`flex items-center gap-3 ${collapsed && !isMobile ? 'justify-center w-full' : ''}`}>
          <Badge dot color="#10B981" offset={[-5, 35]}>
            <Avatar
              size={collapsed && !isMobile ? 38 : 45}
              src={user?.image}
              className={`border-2 shadow-sm border-[#1e3a5f]`}
            >
              {collapsed && !isMobile ? 'P' : user?.profile_name?.charAt(0)}
            </Avatar>
          </Badge>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className={`font-bold text-sm truncate mb-0 text-white`}>
                {user?.profile_name || "Admin"}
              </p>
              <p className={`text-xs font-medium uppercase tracking-tighter text-[#93c5fd]`}>
                {t("company")}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${menuContentPadding}`}>
        <div className={`${collapsed && !isMobile ? 'px-1' : 'px-6'} mb-2 border-y border-[#4971ad]`}>
          <span className={`text-sm font-bold uppercase tracking-widest ${collapsed ? 'sr-only' : 'px-4'} text-[#93c5fd]/60`}>{t("menu")}</span>
        </div>
        {menu?.filter(m => m.menu_name.toLowerCase() != 'setting').map((item) => <CustomNavLink key={item.menu_id} item={item} />)}
      </div>

      {/* Footer / Settings */}
      {menu?.some(m => m.menu_name.toLowerCase() == 'setting') && (
        <div className={`mt-auto border-t border-gray-400 ${collapsed && !isMobile ? 'p-1' : 'p-1'}`}>
          <Link
            to={menu?.find(m => m.menu_name.toLowerCase() == 'setting').menu_path}
            onClick={() => isMobile ? setSidebar(false) : null}
            title={collapsed ? t("settings") : undefined}
            className={`group relative flex items-center ${collapsed && !isMobile ? 'justify-center px-2 py-3 mx-2' : 'gap-3 px-4 py-3'} rounded-2xl transition-all duration-300 text-[#93c5fd] hover:text-white hover:bg-[#1e3a5f]/40`}
          >
            <div className={`p-2 rounded-xl bg-[#1e3a5f]/50 group-hover:bg-[#1e3a5f]`}>
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
      <aside className={`hidden lg:block ${sidebarWidth} h-screen sticky top-0 transition-all duration-300 z-20 bg-[#0f172a] border-r border-[#1e3a5f]/30`}>
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
          className="block lg:!hidden"
        >
          <SidebarContent />
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
