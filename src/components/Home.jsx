import { AiFillProduct } from "react-icons/ai";
import { BsGraphUpArrow, BsQrCodeScan, BsHouseGearFill } from "react-icons/bs";
import { FaListOl, FaTruck, FaPeopleCarry } from "react-icons/fa";
import { MdShoppingCart } from "react-icons/md";
import { SiPayloadcms } from "react-icons/si";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { TbReportAnalytics } from "react-icons/tb";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { IoIosPeople } from "react-icons/io";
import { useGetMenuHomeQuery, useGetPermissionByIdQuery } from "../../app/Features/permissionSlice";
import { useEffect, useState } from "react";
import { FaTruckFast } from "react-icons/fa6";
import { CgTrack } from "react-icons/cg";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { useOutletsContext } from "../layouts/Management";

const iconComponents = {
  FaListOl, AiFillProduct, BsGraphUpArrow, BsQrCodeScan, FaTruck,
  MdShoppingCart, SiPayloadcms, TbReportAnalytics, BiSolidPurchaseTag,
  BsHouseGearFill, FaPeopleCarry, IoIosPeople, FaTruckFast, CgTrack,
};

// Consolidated color palette using Tailwind dark: prefix
const colorSchemes = [
  { bg: "bg-blue-50 dark:bg-blue-900/30", icon: "text-blue-600 dark:text-blue-400", tag: "bg-blue-100 dark:bg-blue-900/40", border: "hover:border-blue-200 dark:hover:border-blue-700/50", text: "text-slate-800 dark:text-slate-100", muted: "text-slate-500 dark:text-slate-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-900/30", icon: "text-emerald-600 dark:text-emerald-400", tag: "bg-emerald-100 dark:bg-emerald-900/40", border: "hover:border-emerald-200 dark:hover:border-emerald-700/50", text: "text-slate-800 dark:text-slate-100", muted: "text-slate-500 dark:text-slate-400" },
  { bg: "bg-violet-50 dark:bg-violet-900/30", icon: "text-violet-600 dark:text-violet-400", tag: "bg-violet-100 dark:bg-violet-900/40", border: "hover:border-violet-200 dark:hover:border-violet-700/50", text: "text-slate-800 dark:text-slate-100", muted: "text-slate-500 dark:text-slate-400" },
  { bg: "bg-amber-50 dark:bg-amber-900/30", icon: "text-amber-600 dark:text-amber-400", tag: "bg-amber-100 dark:bg-amber-900/40", border: "hover:border-amber-200 dark:hover:border-amber-700/50", text: "text-slate-800 dark:text-slate-100", muted: "text-slate-500 dark:text-slate-400" },
  { bg: "bg-rose-50 dark:bg-rose-900/30", icon: "text-rose-600 dark:text-rose-400", tag: "bg-rose-100 dark:bg-rose-900/40", border: "hover:border-rose-200 dark:hover:border-rose-700/50", text: "text-slate-800 dark:text-slate-100", muted: "text-slate-500 dark:text-slate-400" },
];

const flattenMenus = (menus = []) =>
  menus.flatMap((menu) => [menu, ...(menu?.menus?.length ? flattenMenus(menu.menus) : [])]);

const Home = () => {
  
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const { data } = useGetMenuHomeQuery(token);
  const [menu, setMenu] = useState([]);
  const { darkMode } = useOutletsContext();

  useEffect(() => {
    let storedMenus = [];
    const storedMenusRaw = localStorage.getItem("menus-home");
    if (storedMenusRaw) {
      try {
        storedMenus = JSON.parse(storedMenusRaw);
      } catch {
        storedMenus = [];
      }
    }

    const rawMenu = data?.data ?? storedMenus ?? [];
    const allMenus = flattenMenus(rawMenu || []);
    const perms = allMenus.filter(i => i.active === 1);
    setMenu(perms);
  }, [data]);

  const renderIcon = (iconName) => {
    const IconComponent = iconComponents[iconName];
    return IconComponent ? <IconComponent /> : <AiFillProduct />;
  };

  return (
    <div className="p-6 lg:p-10 relative bg-transparent text-slate-900 dark:text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-900 dark:text-slate-100">
              {t("dashboard")}
            </h1>
            <p className="font-medium text-slate-500 dark:text-slate-400">{t("manageWorkspace")}</p>
          </div>
          <div className="hidden md:block text-sm font-semibold px-4 py-2 rounded-full border text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800/30">
            {new Date().toLocaleDateString(i18n.language === 'kh' ? 'km-KH' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 auto-rows-[200px]">
          {menu.map((perm, index) => {
            const color = colorSchemes[index % colorSchemes.length];
            const isWide = index % 6 === 0;

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`${isWide ? "md:col-span-2" : "md:col-span-1"}`}
              >
                <Link to={perm?.menu_path} className="h-full block">
                  <div className={`h-full group relative overflow-hidden border transition-all duration-300 border-gradient-gold  border-slate-200 dark:border-gray-700 hover:shadow-blue-500/10 dark:hover:shadow-xl ${isWide ? "dark:shadow-blue-900/20" : ""} ${color.border} p-8 flex flex-col justify-between`}>

                    {/* Icon Section */}
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-sm ${color.bg} ${color.icon} text-2xl transition-transform duration-500 group-hover:rotate-[360deg]`}>
                        <img className="w-7 h-7 white-icon" src={perm?.menu_icon} alt="" />
                      </div>
                      {/* <div className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${color.tag} ${color.icon} dark:bg-gray-700 dark:text-slate-300`}>
                        {t("active")
                      </div> */}
                    </div>

                    {/* Text Section */}
                    <div>
                      <h3 className={`text-xl font-bold mb-1 ${color.text}`}>
                        {perm?.menu_name}
                      </h3>
                      <p className={`text-sm font-medium line-clamp-1 ${color.muted}`}>
                        {t("quickAccess")} {perm?.menu_name.toLowerCase()}
                      </p>
                    </div>

                    {/* Invisible Arrow that slides in on hover */}
                    <div className={`absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 ${color.icon}`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {menu.length === 0 && (
          <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] border-slate-200 dark:border-gray-700">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-slate-100 dark:bg-gray-800">
              <AiFillProduct className="text-3xl text-slate-400 dark:text-slate-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-300">{t("noAccessModules")}</h2>
            <p className="mt-1 text-slate-500">{t("contactAdmin")}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Home;
