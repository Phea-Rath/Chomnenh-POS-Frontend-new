import React, { useEffect, useState } from "react";
import { Drawer, Avatar, Typography, Badge } from "antd";
import { useNavigate, useLocation, Link } from "react-router";
import { HiHome, HiShoppingBag, HiCog, HiLogout } from "react-icons/hi";
import { useOutletsContext } from "./Management";
import { motion } from "framer-motion";
import { useGetUserLoginQuery, useGetUserProfileQuery } from "../../app/Features/usersSlice";
import { useGetMenuSidebarQuery, useGetPermissionByIdQuery } from "../../app/Features/permissionSlice";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;



const Sidebar = ({ darkMode }) => {
  const { setSidebar, sidebar } = useOutletsContext();
  const { t } = useTranslation();
  const [menu, setMenu] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const proId = localStorage.getItem("profileId");

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
        onClick={() => { setSidebar(false); navigate(item.menu_path); }}
        className={`group relative flex items-center gap-3 px-4 py-1 mx-4 rounded-2xl cursor-pointer transition-all duration-300 mb-1
          ${isActive
            ? darkMode
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
              : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            : darkMode
              ? 'text-slate-400 hover:bg-gray-700 hover:text-slate-100'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <div className={`p-2 rounded-xl transition-all duration-300
          ${isActive ? 'bg-white/50' : darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-slate-50 group-hover:bg-white'}`}>
          {item?.menu_icon && <img className={item?.menu_icon ? 'w-5 h-5' : ''} src={item?.menu_icon} alt="" />}
        </div>

        <span className="font-semibold text-[14px] flex-1 tracking-tight">
          {item?.menu_name}
        </span>

        {isActive && (
          <motion.div layoutId="activePill" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className={`flex flex-col h-full w-[346px] ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-100"}`}>
      {/* Profile Card Simplified */}
      <Link to={'/profile/' + proId}><div className={`m-6 p-4 rounded-[2rem] flex items-center gap-3 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-slate-200 border-slate-100"}`}>
        <Badge dot color="#10B981" offset={[-5, 35]}>
          <Avatar
            size={45}
            src={user?.image}
            className={`border-2 shadow-sm ${darkMode ? "border-gray-600" : "border-white"}`}
          >
            {user?.profile_name?.charAt(0)}
          </Avatar>
        </Badge>
        <div className="overflow-hidden">
          <p className={`font-bold text-sm truncate mb-0 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
            {user?.profile_name || "Admin"}
          </p>
          <p className={`text-xs font-medium uppercase tracking-tighter ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
            {t("company")}
          </p>
        </div>
      </div></Link>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-6 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{t("menu")}</span>
        </div>
        {menu?.filter(m => m.menu_name.toLowerCase() != 'setting').map((item) => <CustomNavLink key={item.menu_id} item={item} />)}
      </div>

      {/* Footer / Settings */}
      {menu?.some(m => m.menu_name.toLowerCase() == 'setting') && <div className={`p-6 mt-auto border-t ${darkMode ? "border-gray-700" : "border-slate-50"}`}>
        <Link
          to={menu?.find(m => m.menu_name.toLowerCase() == 'setting').menu_path}
          onClick={() => setSidebar(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${darkMode ? "text-slate-400 hover:bg-red-900/30 hover:text-red-400" : "text-slate-500 hover:bg-red-50 hover:text-red-600"}`}
        >
          <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-800 group-hover:bg-gray-700" : "bg-slate-50 group-hover:bg-white"}`}>
            <HiCog className="text-lg" />
          </div>
          <span className="font-bold text-sm">{t("settings")}</span>
        </Link>
      </div>}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setSidebar(false)}
        open={sidebar}
        width={280}
        styles={{ body: { padding: 0 } }}
        className={darkMode ? "dark" : ""}
      >
        <SidebarContent />
      </Drawer>
    </>
  );
};

export default Sidebar;
