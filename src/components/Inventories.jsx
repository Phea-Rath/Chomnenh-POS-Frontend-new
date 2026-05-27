import { Link } from "react-router"
import { motion } from "framer-motion";
import { useEffect, useState } from "react"
import { useGetMenuInventoryQuery } from "../../app/Features/permissionSlice";
import { useTranslation } from "react-i18next";
import icon from "../assets/stock.png"

const colors = [
    { iconBg: "bg-blue-50 dark:bg-blue-900/30", hoverBorder: "hover:border-blue-200 dark:hover:border-blue-700" },
    { iconBg: "bg-indigo-50 dark:bg-indigo-900/30", hoverBorder: "hover:border-indigo-200 dark:hover:border-indigo-700" },
    { iconBg: "bg-emerald-50 dark:bg-emerald-900/30", hoverBorder: "hover:border-emerald-200 dark:hover:border-emerald-700" },
    { iconBg: "bg-orange-50 dark:bg-orange-900/30", hoverBorder: "hover:border-orange-200 dark:hover:border-orange-700" },
    { iconBg: "bg-rose-50 dark:bg-rose-900/30", hoverBorder: "hover:border-rose-200 dark:hover:border-rose-700" },
    { iconBg: "bg-purple-50 dark:bg-purple-900/30", hoverBorder: "hover:border-purple-200 dark:hover:border-purple-700" },
];

const flattenMenus = (menus = []) =>
    menus.flatMap((menu) => [menu, ...(menu?.menus?.length ? flattenMenus(menu.menus) : [])]);

const Inventories = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const [menu, setMenu] = useState([]);
    const { data } = useGetMenuInventoryQuery(token);

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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t("inventoryDashboard")}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t("selectInventoryModule")}</p>
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
                                        group flex flex-col items-center justify-center p-6 border-gradient-gold
                                         border border-gray-100 dark:border-gray-700
                                        hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300
                                        w-full min-h-[160px] text-center space-y-4
                                        ${color.hoverBorder}
                                    `}
                                >
                                    <div className={`p-2 rounded-sm ${color.iconBg} transition-transform group-hover:scale-110 duration-300`}>
                                        <img
                                            className="w-10 h-10 white-icon object-contain"
                                            src={perm?.menu_icon ?? icon}
                                            alt={perm?.menu_name}
                                            onError={(e) => e.target.src = icon}
                                        />
                                    </div>
                                    <h2 className={`text-[10px] md:text-[14px] text-slate-800 dark:text-slate-100 font-bold mb-0.5 md:mb-1 uppercase tracking-tight line-clamp-1`}>
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

export default Inventories
