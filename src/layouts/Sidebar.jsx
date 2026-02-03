import React, { useEffect, useState } from "react";
import { Drawer, Avatar, Typography, Badge } from "antd";
import { useNavigate, useLocation, Link } from "react-router";
import { HiHome, HiShoppingBag, HiCog, HiLogout } from "react-icons/hi";
import { BsInboxesFill, BsTagsFill, BsPaletteFill, BsChevronRight, BsGrid1X2Fill } from "react-icons/bs";
import { MdCategory, MdDashboard, MdStorefront } from "react-icons/md";
import { IoColorPaletteSharp, IoStatsChart, IoDocumentText } from "react-icons/io5";
import { GiMoneyStack, GiResize, GiProfit } from "react-icons/gi";
import { AiFillLike, AiFillPieChart } from "react-icons/ai";
import { FaBalanceScaleLeft, FaRegUserCircle, FaUsers } from "react-icons/fa";
import { RiStore3Line, RiLineChartFill } from "react-icons/ri";
import { GrDocumentStore, GrSettingsOption } from "react-icons/gr";
import { FaMoneyBillTrendUp, FaShieldHalved } from "react-icons/fa6";
import { PiShoppingCartBold } from "react-icons/pi";
import { useOutletsContext } from "./Management";
import { motion } from "framer-motion";
import { useGetUserLoginQuery, useGetUserProfileQuery } from "../../app/Features/usersSlice";
import { useGetPermissionByIdQuery } from "../../app/Features/permissionSlice";

const { Title, Text } = Typography;

const iconComponents = {
  HiHome, HiShoppingBag, PiShoppingCartBold, BsInboxesFill, BsTagsFill, BsPaletteFill,
  MdCategory, MdDashboard, MdStorefront, IoColorPaletteSharp, IoStatsChart, IoDocumentText,
  GiResize, GiMoneyStack, GiProfit, AiFillLike, AiFillPieChart, FaBalanceScaleLeft,
  FaRegUserCircle, FaUsers, RiStore3Line, RiLineChartFill, GrDocumentStore,
  GrSettingsOption, FaMoneyBillTrendUp,
};

const Sidebar = () => {
  const { setSidebar, sidebar } = useOutletsContext();
  const [menu, setMenu] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const proId = localStorage.getItem("profileId");

  const { data: profile } = useGetUserProfileQuery({ id: proId, token });
  const { data: permData } = useGetPermissionByIdQuery({ id: userId, token });

  useEffect(() => {
    const menuData = JSON.parse(localStorage.getItem("menus")) ?? permData?.data;
    if (menuData?.length) {
      const menus = menuData?.filter((i) => i.menu_type == 1 || (i.menu_type == 0 && i.menu_id != 4));
      setMenu(menus);
    }
  }, [permData]);

  const user = profile?.data;

  const CustomNavLink = ({ item }) => {
    const isActive = location.pathname === item.menu_path;
    const Icon = iconComponents[item.menu_icon] || MdDashboard;

    return (
      <div
        onClick={() => { setSidebar(false); navigate(item.menu_path); }}
        className={`group relative flex items-center gap-3 px-4 py-1 mx-4 rounded-2xl cursor-pointer transition-all duration-300 mb-1
          ${isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <div className={`p-2 rounded-xl transition-all duration-300 
          ${isActive ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-white'}`}>
          <Icon className={`text-lg ${isActive ? 'text-white' : 'text-slate-500'}`} />
        </div>

        <span className="font-semibold text-[14px] flex-1 tracking-tight">
          {item.menu_name}
        </span>

        {isActive && (
          <motion.div layoutId="activePill" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 w-[346px]">
      {/* Brand Header */}


      {/* Profile Card Simplified */}
      <div className="mx-6 mb-6 p-4 bg-slate-50 rounded-[2rem] flex items-center gap-3 border border-slate-100">
        <Badge dot color="#10B981" offset={[-5, 35]}>
          <Avatar
            size={45}
            src={user?.image}
            className="border-2 border-white shadow-sm"
          >
            {user?.profile_name?.charAt(0)}
          </Avatar>
        </Badge>
        <div className="overflow-hidden">
          <p className="text-slate-900 font-bold text-sm truncate mb-0">
            {user?.profile_name || "Admin"}
          </p>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-tighter">
            {user?.role || "Manager"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-6 mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Menu</span>
        </div>
        {menu.map((item) => <CustomNavLink key={item.menu_id} item={item} />)}
      </div>

      {/* Footer / Settings */}
      <div className="p-6 mt-auto border-t border-slate-50">
        <Link
          to="/dashboard/setting"
          onClick={() => setSidebar(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
        >
          <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-white">
            <HiCog className="text-lg" />
          </div>
          <span className="font-bold text-sm">Settings</span>
        </Link>
      </div>
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
      >
        <SidebarContent />
      </Drawer>
    </>
  );
};

export default Sidebar;