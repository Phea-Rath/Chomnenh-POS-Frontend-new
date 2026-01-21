import { AiFillProduct } from "react-icons/ai";
import { BsGraphUpArrow, BsQrCodeScan } from "react-icons/bs";
import { FaListOl, FaTruck } from "react-icons/fa";
import { MdShoppingCart } from "react-icons/md";
import { SiPayloadcms } from "react-icons/si";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { TbReportAnalytics } from "react-icons/tb";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { BsHouseGearFill } from "react-icons/bs";
import { FaPeopleCarry } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { useGetPermissionByIdQuery } from "../../app/Features/permissionSlice";
import { useEffect, useState } from "react";
import { FaTruckFast } from "react-icons/fa6";
import { CgTrack } from "react-icons/cg";

const iconComponents = {
  FaListOl: FaListOl,
  AiFillProduct: AiFillProduct,
  BsGraphUpArrow: BsGraphUpArrow,
  BsQrCodeScan: BsQrCodeScan,
  FaTruck: FaTruck,
  MdShoppingCart: MdShoppingCart,
  SiPayloadcms: SiPayloadcms,
  TbReportAnalytics: TbReportAnalytics,
  BiSolidPurchaseTag: BiSolidPurchaseTag,
  BsHouseGearFill: BsHouseGearFill,
  FaPeopleCarry: FaPeopleCarry,
  IoIosPeople: IoIosPeople,
  FaTruckFast: FaTruckFast,
  CgTrack: CgTrack,
};

const colorSchemes = [
  {
    main: "from-blue-500 to-blue-600",
    light: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    shadow: "shadow-blue-100",
    icon: "text-blue-600"
  },
  {
    main: "from-green-500 to-green-600",
    light: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    shadow: "shadow-green-100",
    icon: "text-green-600"
  },
  {
    main: "from-purple-500 to-purple-600",
    light: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    shadow: "shadow-purple-100",
    icon: "text-purple-600"
  },
  {
    main: "from-orange-500 to-orange-600",
    light: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    shadow: "shadow-orange-100",
    icon: "text-orange-600"
  },
  {
    main: "from-red-500 to-red-600",
    light: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    shadow: "shadow-red-100",
    icon: "text-red-600"
  },
  {
    main: "from-indigo-500 to-indigo-600",
    light: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    shadow: "shadow-indigo-100",
    icon: "text-indigo-600"
  },
  {
    main: "from-teal-500 to-teal-600",
    light: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    shadow: "shadow-teal-100",
    icon: "text-teal-600"
  },
  {
    main: "from-pink-500 to-pink-600",
    light: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    shadow: "shadow-pink-100",
    icon: "text-pink-600"
  }
];

const Home = () => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigator = useNavigate();
  const { data } = useGetPermissionByIdQuery({ id: userId, token });
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    const rawMenu = data?.data ?? JSON.parse(localStorage.getItem("menus"));
    console.log(rawMenu);

    if (rawMenu && rawMenu.length !== 0) {
      const perms = rawMenu.filter((i) => i.menu_type == 2);
      setMenu(perms);
    }
  }, [data]);

  const renderIcon = (iconName) => {
    const IconComponent = iconComponents[String(iconName)];
    return IconComponent ? <IconComponent /> : <AiFillProduct />;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-transparent p-4 w-full"
    >
      {/* Menu Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
          {menu?.map((perm, index) => {
            const color = colorSchemes[index % colorSchemes.length];

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{
                  scale: 1.03,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to={perm?.menu_path} className="block h-full">
                  <div className={`
                    relative overflow-hidden rounded-2xl h-full
                    bg-white border-2 ${color.border}
                    shadow-sm hover:shadow-xl transition-all duration-300
                    group cursor-pointer
                  `}>
                    {/* Background Gradient Effect */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${color.main} 
                      opacity-0 group-hover:opacity-5 transition-opacity duration-300
                    `}></div>

                    {/* Content */}
                    <div className="p-6 flex flex-col items-center text-center h-full">
                      {/* Icon Container */}
                      <div className={`
                        w-16 h-16 rounded-2xl ${color.light} 
                        flex items-center justify-center mb-4
                        group-hover:scale-110 transition-transform duration-300
                        border ${color.border}
                      `}>
                        <div className={`text-2xl ${color.icon}`}>
                          {renderIcon(perm.menu_icon)}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className={`
                        font-semibold text-lg mb-2 ${color.text}
                        group-hover:translate-y-[-2px] transition-transform duration-300
                      `}>
                        {perm?.menu_name}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-500 text-sm leading-relaxed flex-grow">
                        Manage and access {perm?.menu_name.toLowerCase()} features and settings
                      </p>

                      {/* Hover Arrow */}
                      <div className={`
                        mt-4 text-sm font-medium ${color.text}
                        flex items-center gap-1
                        group-hover:gap-2 transition-all duration-300
                      `}>
                        <span>Access</span>
                        <svg
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Corner Accent */}
                    <div className={`
                      absolute top-0 right-0 w-6 h-6
                      bg-gradient-to-bl ${color.main} 
                      rounded-bl-2xl opacity-0 group-hover:opacity-100
                      transition-opacity duration-300
                    `}></div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {menu?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <AiFillProduct className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Menu Items Available
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              You don't have access to any dashboard features yet.
              Please contact your administrator to set up permissions.
            </p>
          </motion.div>
        )}
      </motion.div>


    </motion.div>
  );
};

export default Home;