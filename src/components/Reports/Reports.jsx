import { AiFillProduct } from "react-icons/ai"
import { Link } from "react-router"
import { motion } from "framer-motion";
import { TbReportAnalytics } from "react-icons/tb";
import { useEffect, useState } from "react"
import { TbReportMoney } from "react-icons/tb";
import { TbReportMedical } from "react-icons/tb";
import { useGetMenuReportQuery, useGetPermissionByIdQuery } from "../../../app/Features/permissionSlice";

const colors = [
  { main: "blue-500", light: "blue-50", hoverBorder: "hover:border-blue-200" },
  { main: "indigo-500", light: "indigo-50", hoverBorder: "hover:border-indigo-200" },
  { main: "emerald-500", light: "emerald-50", hoverBorder: "hover:border-emerald-200" },
  { main: "orange-500", light: "orange-50", hoverBorder: "hover:border-orange-200" },
  { main: "rose-500", light: "rose-50", hoverBorder: "hover:border-rose-200" },
  { main: "purple-500", light: "purple-50", hoverBorder: "hover:border-purple-200" },
];

const flattenMenus = (menus = []) =>
  menus.flatMap((menu) => [menu, ...(menu?.menus?.length ? flattenMenus(menu.menus) : [])]);

const Reports = () => {
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto"
    >
      <section className="p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Reports Dashboard</h1>
          <p className="text-gray-500 mt-1">Select a report to view detailed analytics</p>
        </header>

        <article className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {menu?.map((perm, index) => {
            const color = colors[index % colors.length];
            return (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  to={perm?.menu_path}
                  className={`
                    group flex flex-col items-center justify-center p-6 bg-white 
                    rounded-3xl border border-gray-100 shadow-sm
                    hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300
                    w-full min-h-[160px] text-center space-y-4
                    ${color.hoverBorder}
                  `}
                >
                  <div className={`p-4 rounded-2xl bg-${color.light} transition-transform group-hover:scale-110 duration-300`}>
                    <img
                      className="w-10 h-10 object-contain"
                      src={perm?.menu_icon}
                      alt={perm?.menu_name}
                    />
                  </div>
                  <h2 className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {perm?.menu_name}
                  </h2>
                </Link>
              </motion.div>
            );
          })}
        </article>
      </section>
    </motion.div >
  )
}

export default Reports
