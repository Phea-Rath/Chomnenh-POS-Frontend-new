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

const iconComponents = {
  FaListOl, AiFillProduct, BsGraphUpArrow, BsQrCodeScan, FaTruck,
  MdShoppingCart, SiPayloadcms, TbReportAnalytics, BiSolidPurchaseTag,
  BsHouseGearFill, FaPeopleCarry, IoIosPeople, FaTruckFast, CgTrack,
};

// Light mode palette: Soft pastels and deep text colors
const colorSchemes = [
  { bg: "bg-blue-50", icon: "text-blue-600", tag: "bg-blue-100", border: "hover:border-blue-200" },
  { bg: "bg-emerald-50", icon: "text-emerald-600", tag: "bg-emerald-100", border: "hover:border-emerald-200" },
  { bg: "bg-violet-50", icon: "text-violet-600", tag: "bg-violet-100", border: "hover:border-violet-200" },
  { bg: "bg-amber-50", icon: "text-amber-600", tag: "bg-amber-100", border: "hover:border-amber-200" },
  { bg: "bg-rose-50", icon: "text-rose-600", tag: "bg-rose-100", border: "hover:border-rose-200" },
];

const flattenMenus = (menus = []) =>
  menus.flatMap((menu) => [menu, ...(menu?.menus?.length ? flattenMenus(menu.menus) : [])]);

const Home = () => {
  const token = localStorage.getItem("token");
  const { data } = useGetMenuHomeQuery(token);
  const [menu, setMenu] = useState([]);

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
    <div className="bg-transparent text-slate-900 p-6 lg:p-10 relative">
      {/* Background Decorative Elements */}
      {/* <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" /> */}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-500 font-medium">Manage your workspace and operations</p>
          </div>
          <div className="hidden md:block text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 auto-rows-[200px]">
          {menu.map((perm, index) => {
            const color = colorSchemes[index % colorSchemes.length];
            const isWide = index % 6 === 0; // Patterns the grid sizes

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`${isWide ? "md:col-span-2" : "md:col-span-1"}`}
              >
                <Link to={perm?.menu_path} className="h-full block">
                  <div className={`h-full group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 ${color.border} p-8 flex flex-col justify-between`}>

                    {/* Icon Section */}
                    <div className="flex justify-between items-start">
                      <div className={`p-4 rounded-2xl !${color.bg} ${color.icon} text-2xl transition-transform duration-500 group-hover:rotate-[360deg]`}>
                        <img className="w-5 h-5" src={perm?.menu_icon} alt="" />
                      </div>
                      <div className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${color.tag} ${color.icon}`}>
                        Active
                      </div>
                    </div>

                    {/* Text Section */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {perm?.menu_name}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium line-clamp-1">
                        Quick access to {perm?.menu_name.toLowerCase()}
                      </p>
                    </div>

                    {/* Invisible Arrow that slides in on hover */}
                    <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                      <svg className={`w-6 h-6 ${color.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem]">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <AiFillProduct className="text-3xl text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">No Access Modules</h2>
            <p className="text-slate-500 mt-1">Please contact your administrator.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Home;
