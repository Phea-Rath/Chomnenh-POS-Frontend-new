import React, { useEffect, useState } from "react";
import { Drawer, Menu, Avatar, Typography, Badge, Divider, Button } from "antd";
import { useNavigate, useLocation, Link, NavLink } from "react-router";
import {
  HiHome,
  HiShoppingBag,
  HiCog,
  HiLogout
} from "react-icons/hi";
import {
  BsInboxesFill,
  BsTagsFill,
  BsPaletteFill,
  BsChevronRight
} from "react-icons/bs";
import {
  MdCategory,
  MdDashboard,
  MdStorefront,
  MdNotifications
} from "react-icons/md";
import {
  IoColorPaletteSharp,
  IoStatsChart,
  IoDocumentText
} from "react-icons/io5";
import {
  GiMoneyStack,
  GiResize,
  GiProfit
} from "react-icons/gi";
import {
  AiFillLike,
  AiFillPieChart
} from "react-icons/ai";
import {
  FaBalanceScaleLeft,
  FaRegUserCircle
} from "react-icons/fa";
import {
  RiStore3Line,
  RiLineChartFill
} from "react-icons/ri";
import {
  GrDocumentStore,
  GrSettingsOption
} from "react-icons/gr";
import {
  FaMoneyBillTrendUp,
  FaUsers,
  FaShieldHalved
} from "react-icons/fa6";
import { PiShoppingCartBold } from "react-icons/pi";
import { useOutletsContext } from "./Management";
import { useGetUserLoginQuery, useGetUserProfileQuery } from "../../app/Features/usersSlice";
import {
  useGetAllPermissionQuery,
  useGetPermissionByIdQuery,
} from "../../app/Features/permissionSlice";
import api from "../services/api";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

const iconComponents = {
  HiHome: HiHome,
  HiShoppingBag: HiShoppingBag,
  PiShoppingCartBold: PiShoppingCartBold,
  BsInboxesFill: BsInboxesFill,
  BsTagsFill: BsTagsFill,
  BsPaletteFill: BsPaletteFill,
  MdCategory: MdCategory,
  MdDashboard: MdDashboard,
  MdStorefront: MdStorefront,
  IoColorPaletteSharp: IoColorPaletteSharp,
  IoStatsChart: IoStatsChart,
  IoDocumentText: IoDocumentText,
  GiResize: GiResize,
  GiMoneyStack: GiMoneyStack,
  GiProfit: GiProfit,
  AiFillLike: AiFillLike,
  AiFillPieChart: AiFillPieChart,
  FaBalanceScaleLeft: FaBalanceScaleLeft,
  FaRegUserCircle: FaRegUserCircle,
  FaUsers: FaUsers,
  RiStore3Line: RiStore3Line,
  RiLineChartFill: RiLineChartFill,
  GrDocumentStore: GrDocumentStore,
  GrSettingsOption: GrSettingsOption,
  FaMoneyBillTrendUp: FaMoneyBillTrendUp,
};

const Sidebar = () => {
  const [placement] = useState("left");
  const { setSidebar, sidebar } = useOutletsContext();
  const [menu, setMenu] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const proId = localStorage.getItem("profileId");
  const onClose = () => setSidebar(false);
  const { data: userData } = useGetUserLoginQuery(token);
  const { data: profile } = useGetUserProfileQuery({ id: proId, token });
  const { data: permData } = useGetPermissionByIdQuery({ id: userId, token });

  useEffect(() => {
    const menuData = JSON.parse(localStorage.getItem("menus")) ?? permData?.data;
    if (menuData?.length) {
      const menus = menuData?.filter((i) => i.menu_type == 1 || i.menu_type == 0 && i.menu_id != 4);
      setMenu(menus);
    }
  }, [permData]);

  const onClick = (e) => {
    const selected = menu.find((m) => m.menu_id.toString() === e.key);
    if (selected?.menu_path) {
      navigate(selected.menu_path);
      onClose();
    }
  };

  const renderIcon = (iconName, isSelected = false) => {
    const className = `text-lg ${isSelected ? "text-white" : "text-gray-600"}`;
    if (!iconName) return <MdDashboard className={className} />;
    const IconComponent = iconComponents[iconName];
    return IconComponent ? (
      React.createElement(IconComponent, { className })
    ) : (
      <MdDashboard className={className} />
    );
  };

  const getSelectedKey = () => {
    const currentMenu = menu.find(item => location.pathname === item.menu_path);
    return currentMenu ? [currentMenu.menu_id.toString()] : [];
  };

  const user = profile?.data;

  const handleLogout = async () => {
    // Add logout logic here
    try {
      const res = await api.post('/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.status == 200) {
        localStorage.setItem("token", '');
        toast.success("Account Logout!");
        navigate("/");
      }
    } catch (error) {
      toast.error(error.message || error);
    }
  };

  // Custom NavLink component with active state
  const CustomNavLink = ({ item }) => {
    const isActive = location.pathname === item.menu_path;

    return (
      <div
        // to={item.menu_path}
        key={item.menu_id}
        onClick={() => { setSidebar(false); navigate(item.menu_path) }}
      >
        <div className={`
          flex items-center gap-4 p-3 mx-4 rounded-xl transition-all duration-300 cursor-pointer
          ${isActive
            ? 'bg-gray-400 text-white shadow-lg shadow-blue-500/25 transform translate-x-2'
            : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:translate-x-1'
          }
        `}>
          <div className={`
            p-2 rounded-lg transition-colors duration-300
            ${isActive ? 'bg-white/20' : 'bg-gray-100'}
          `}>
            {renderIcon(item.menu_icon, isActive)}
          </div>
          <span className="font-medium flex-1">{item.menu_name}</span>
          {isActive && (
            <BsChevronRight className="text-white text-sm animate-pulse" />
          )}
        </div>
      </div>
    );
  };

  return (
    <section className=" shadow-sm">
      {/* Header Section */}
      <div className="hidden lg:block h-[100vh] relative !w-[346px]">
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-4 px-4 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 border bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full -translate-x-12 translate-y-12"></div>
          </div>
          <div className="relative z-10">
            {/* User Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <Avatar
                  size={60}
                  src={
                    user?.image || (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">
                          {user?.profile_name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )
                  }
                  className="border-2 border-white/30 shadow-xl"
                />
                <Badge
                  dot
                  color="#10B981"
                  className="absolute -bottom-5 right-2 border-white shadow-lg"
                  size="default"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Title level={4} className="!text-white !mb-1 font-bold truncate">
                  {user?.profile_name || "Welcome Back"}
                </Title>
                <div className="flex items-center space-x-2">
                  <FaShieldHalved className="text-blue-300 text-sm" />
                  <Text className="!text-blue-200 text-sm truncate">
                    {user?.role || "Company"}
                  </Text>
                </div>
              </div>
            </div>
            {/* Quick Stats */}
            {/* <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <Text className="!text-white text-xs font-semibold">Status</Text>
                </div>
                <Text className="!text-white text-sm font-bold">Online</Text>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center space-x-2 mb-1">
                  <IoStatsChart className="text-yellow-400 text-sm" />
                  <Text className="!text-white text-xs font-semibold">Tasks</Text>
                </div>
                <Text className="!text-white text-sm font-bold">12</Text>
              </div>
            </div> */}
          </div>
        </div>
        {/* Brand Section */}
        <div className="bg-white border-b border-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div className=" leading-1">
                <div className="flex items-baseline space-x-1">
                  <span className="text-slate-800 font-bold text-md">CHOMNENH POS</span>
                  <span className="text-yellow-500 font-bold text-sm">+</span>
                </div>
                <h1 className="text-gray-500 text-[10px]">Management System</h1>
              </div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
        </div>
        {/* Navigation Menu */}
        <div className="flex-1 py-4 overflow-auto h-[calc(100vh-160px)]">
          <div className="mb-2">
            <div className="flex items-center justify-between px-6 mb-4">
              {/* <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Main Menu
              </Text>
              <Text className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">
                {menu.length} items
              </Text> */}
            </div>
            <div className="space-y-1">
              {menu.map((item) => (
                <CustomNavLink key={item.menu_id} item={item} />
              ))}
            </div>
          </div>
          {/* Quick Actions Section */}
          <div className="mt-8 px-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HiCog className="text-blue-600 text-lg" />
                </div>
                <div>
                  <Text className="text-gray-800 text-sm font-semibold">Quick Settings</Text>
                  <Text className="text-gray-500 text-xs">Manage your preferences</Text>
                </div>
              </div>
              <Link to="/dashboard/setting" className="block w-full">
                <Button
                  type="default"
                  className="w-full h-9 rounded-lg text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 text-sm font-medium"
                >
                  Open Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Footer Section */}
      </div>
      <Drawer
        title={null}
        width={320}
        placement={placement}
        closable={false}
        onClose={onClose}
        open={sidebar}
        key={placement}
        styles={{
          body: {
            padding: "0",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            display: "flex",
            flexDirection: "column",
          },
          header: {
            display: "none",
          },
          wrapper: {
            boxShadow: "16px 0 50px rgba(0, 0, 0, 0.1)",
          }
        }}
        className="modern-sidebar-drawer lg:hidden"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-4 px-4 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 border bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full -translate-x-12 translate-y-12"></div>
          </div>
          <div className="relative z-10">
            {/* User Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <Avatar
                  size={60}
                  src={
                    user?.image || (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">
                          {user?.profile_name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )
                  }
                  className="border-2 border-white/30 shadow-xl"
                />
                <Badge
                  dot
                  color="#10B981"
                  className="absolute -bottom-5 right-2 border-white shadow-lg"
                  size="default"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Title level={4} className="!text-white !mb-1 font-bold truncate">
                  {user?.profile_name || "Welcome Back"}
                </Title>
                <div className="flex items-center space-x-2">
                  <FaShieldHalved className="text-blue-300 text-sm" />
                  <Text className="!text-blue-200 text-sm truncate">
                    {user?.role || "Company"}
                  </Text>
                </div>
              </div>
            </div>
            {/* Quick Stats */}
            {/* <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <Text className="!text-white text-xs font-semibold">Status</Text>
                </div>
                <Text className="!text-white text-sm font-bold">Online</Text>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center space-x-2 mb-1">
                  <IoStatsChart className="text-yellow-400 text-sm" />
                  <Text className="!text-white text-xs font-semibold">Tasks</Text>
                </div>
                <Text className="!text-white text-sm font-bold">12</Text>
              </div>
            </div> */}
          </div>
        </div>
        {/* Brand Section */}
        <div className="bg-white border-b border-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div className=" leading-1">
                <div className="flex items-baseline space-x-1">
                  <span className="text-slate-800 font-bold text-md">CHOMNENH POS</span>
                  <span className="text-yellow-500 font-bold text-sm">+</span>
                </div>
                <h1 className="text-gray-500 text-[10px]">Management System</h1>
              </div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
        </div>
        {/* Navigation Menu */}
        <div className="flex-1 py-4 overflow-auto">
          <div className="mb-2">
            <div className="flex items-center justify-between px-6 mb-4">
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Main Menu
              </Text>
              <Text className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">
                {menu.length} items
              </Text>
            </div>
            <div className="space-y-1">
              {menu.map((item) => (
                <CustomNavLink key={item.menu_id} item={item} />
              ))}
            </div>
          </div>
          {/* Quick Actions Section */}
          {JSON.parse(localStorage.getItem("menus"))?.filter((i) => i.menu_type == 1 || i.menu_type == 0 && i.menu_id == 4) && <div className="mt-8 px-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HiCog className="text-blue-600 text-lg" />
                </div>
                <div>
                  <Text className="text-gray-800 text-sm font-semibold">Quick Settings</Text>
                  <Text className="text-gray-500 text-xs">Manage your preferences</Text>
                </div>
              </div>
              <Link to="/dashboard/setting" className="block w-full">
                <Button
                  type="default"
                  className="w-full h-9 rounded-lg text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 text-sm font-medium"
                >
                  Open Settings
                </Button>
              </Link>
            </div>
          </div>}
        </div>
      </Drawer>

    </section>
  );
};

export default Sidebar;