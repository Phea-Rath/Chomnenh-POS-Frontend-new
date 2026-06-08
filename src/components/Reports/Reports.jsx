import { Link } from "react-router"
import { motion } from "framer-motion";
import { useEffect, useState } from "react"
import { useGetMenuReportQuery } from "../../../app/Features/permissionSlice";
import { useTranslation } from "react-i18next";
import incomeIcon from '../../assets/income.png'
import { useOutletsContext } from "../../layouts/Management";

const colors = [
  { iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" },
  { iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" },
  { iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" },
  { iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400" },
  { iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400" },
  { iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" },
];

const newMenu = [
  {
    menu_name:"Income Statement",
    menu_icon: incomeIcon,
    menu_path:"/report/income-statement",
    desc: "Comprehensive review of revenue, costs, and profitability."
  }
]

const flattenMenus = (menus = []) =>
  menus.flatMap((menu) => [menu, ...(menu?.menus?.length ? flattenMenus(menu.menus) : [])]);

const Reports = () => {
  const { t } = useTranslation();
  const { darkMode } = useOutletsContext();
  const token = localStorage.getItem('token');
  const [menu, setMenu] = useState([]);
  const { data } = useGetMenuReportQuery(token);

  useEffect(() => {
    let storedMenus = [];
    const storedMenusRaw = localStorage.getItem("menus-report");
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
  }, [data])

  const getMenuLogo = (text) => {
      return text
        .split(" ")
        .map(word => word.charAt(0).toUpperCase())
        .join("");
    };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="space-y-12"
      >
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h1 className={`text-xl font-black uppercase tracking-[0.2em] ${darkMode ? "text-white" : "text-gray-900"}`}>
              {t("reportsDashboard")}
            </h1>
          </div>
          <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {t("selectReportAnalytics")}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...newMenu, ...menu]?.map((perm, index) => {
            const color = colors[index % colors.length];
            return (
              <motion.div key={index} variants={itemVariants}>
                <Link to={perm?.menu_path} className="block group h-full">
                  <div className={`h-full p-6 rounded-[2rem] border transition-all duration-300 
                    ${darkMode ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-blue-500/50" : "bg-white border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200"}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${color.iconBg}`}>
                      {perm.menu_icon ? (
                        <>
                          <img
                            className="w-8 h-8 white-icon object-contain"
                            src={perm?.menu_icon}
                            alt={perm?.menu_name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <span className="hidden text-xl font-black tracking-tighter items-center justify-center">
                            {getMenuLogo(perm?.menu_name)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-black tracking-tighter">
                          {getMenuLogo(perm?.menu_name)}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {perm?.menu_name}
                    </h3>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {perm.desc || t("view_report_desc", { name: perm.menu_name }) || `View detailed analytics for ${perm.menu_name}.`}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  )
}

export default Reports
