import { AiFillProduct } from "react-icons/ai"
import { Link } from "react-router"
import { motion } from "framer-motion";
import { TbReportAnalytics } from "react-icons/tb";
import { useEffect, useState } from "react"
import { TbReportMoney } from "react-icons/tb";
import { TbReportMedical } from "react-icons/tb";
import { useGetPermissionByIdQuery } from "../../../app/Features/permissionSlice";
const iconComponents = {
  TbReportAnalytics: TbReportAnalytics,
  TbReportMoney: TbReportMoney,
  TbReportMedical: TbReportMedical
}
const colors = [
  { main: "yellow-500", light: "yellow-50", text: "yellow-600" },
  { main: "blue-500", light: "blue-50", text: "blue-600" },
  { main: "green-500", light: "green-50", text: "green-600" },
  { main: "red-500", light: "red-50", text: "red-600" },
  { main: "purple-500", light: "purple-50", text: "purple-600" },
  { main: "pink-500", light: "pink-50", text: "pink-600" },
];

const Reports = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const [menu, setMenu] = useState([]);
  const { data } = useGetPermissionByIdQuery({ id: userId, token });

  useEffect(() => {
    if (data?.data.length != 0) {
      const perms = data?.data?.filter(i => i.menu_type == 4);
      setMenu(perms)
      console.log(data?.data);

    }
  }, [data])
  const renderIcon = (iconName) => {
    const IconComponent = iconComponents[String(iconName)];
    return IconComponent ? <IconComponent /> : <AiFillProduct />; // Default icon
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <section className="p-2 md:px-20">
        <article className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-5">
          {menu?.map((perm, index) => {
            const color = colors[index % colors.length]; // rotate colors
            return (
              <Link key={index} to={perm?.menu_path}>
                <button
                  className={`
          btn relative overflow-hidden rounded-tl-lg rounded-bl-lg group bg-white p-0
          text-${color.text}
          border-[#e5e5e5]
          flex flex-col justify-center
          w-full h-30 
        `}
                >
                  <div className={`absolute h-full left-0 w-full bg-${color.main} z-1`}></div>
                  <div className={`absolute h-full left-[4px] rounded-md group-hover:left-2 transition-all duration-500 w-full bg-white/95 z-2`}></div>
                  <div className="flex flex-col justify-center items-center space-y-2 absolute w-full h-full z-3">
                    <div className={`text-4xl text-${color.main}`}>
                      {renderIcon(perm.menu_icon)}
                    </div>
                    <h1>{perm?.menu_name}</h1>
                  </div>
                </button>
              </Link>
            );
          })}

        </article>
      </section>
    </motion.div >
  )
}

export default Reports