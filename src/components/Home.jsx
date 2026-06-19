import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { 
  HiOutlineShoppingCart, 
  HiOutlineCube, 
  HiOutlineChartBar, 
  HiOutlineClipboardList,
  HiOutlineSparkles,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineCubeTransparent
} from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { useGetUserLoginQuery, useGetUserProfileQuery } from "../../app/Features/usersSlice";
import { useOutletsContext } from "../layouts/Management";

const Home = () => {
  const { t, i18n } = useTranslation();
  const token = localStorage.getItem("token");
  const proId = localStorage.getItem("profileId");

  const { data: profileResponse } = useGetUserLoginQuery(token );
  const user = profileResponse?.data;
  const isKhmer = i18n.language === "kh";

  const containerVariants = {
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const QuickAction = ({ to, icon: Icon, title, desc, color }) => (
    <motion.div variants={itemVariants}>
      <Link to={to} className="block group">
        <div className={`h-full p-6 rounded-[2rem] border transition-all duration-300 
          dark:bg-gray-800/40 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:border-blue-500/50 bg-white border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${color}`}>
            <Icon className="w-8 h-8" />
          </div>
          <h3 className={`text-lg font-black uppercase tracking-tight mb-2 dark:text-white text-gray-900`}>
            {title}
          </h3>
          <p className={`text-sm font-medium dark:text-gray-400 text-gray-500`}>
            {desc}
          </p>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-lg h-50 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              {/* <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-widest">
                {t("management_v2")}
              </span> */}
              <h1 className="text-4xl font-Kantumruy font-black dark:text-white text-gray-700 leading-tight">
                {isKhmer ? "រីករាយដែលបានជួបអ្នកវិញ" : "Welcome back"}, <br />
                <span className="text-blue-900 dark:text-blue-200">{user?.username || "Admin"}</span>!
              </h1>
              <p className="dark:text-blue-50 text-gray-600 text-md font-medium opacity-90">
                {isKhmer 
                  ? "គ្រប់គ្រងអាជីវកម្មរបស់អ្នកដោយភាពងាយស្រួល និងប្រសិទ្ធភាពខ្ពស់ជាមួយ Chomnenh POS។" 
                  : "Effortlessly manage your store's operations, track inventory, and analyze sales performance in real-time."}
              </p>
            </div>
            <div className="hidden lg:block">
               <div
                className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20 flex items-center justify-center"
               >
                  <HiOutlineLightningBolt className="w-24 h-24 text-blue-200" />
               </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className={`text-xl font-black uppercase tracking-[0.2em] dark:text-white text-gray-900`}>
              {t("quickActions")}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickAction 
              to="/wholesale" 
              icon={HiOutlineShoppingCart} 
              title={isKhmer ? "លក់ដុំ ឫ​ចេញវិក័យបត្រ" : "Wholesale or Invoice"}
              desc={isKhmer ? "បង្កើតការបញ្ជាទិញថ្មីរហ័ស" : "Create and process customer orders instantly."}
              color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
            />
            <QuickAction 
              to="/inventories/stock-list" 
              icon={HiOutlineCube} 
              title={isKhmer ? "គ្រប់គ្រងស្តុក" : "Inventory"}
              desc={isKhmer ? "ពិនិត្យ និងកែតម្រូវទំនិញក្នុងស្តុក" : "Monitor stock levels and manage movements."}
              color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
            />
            <QuickAction 
              to="/report" 
              icon={HiOutlineChartBar} 
              title={isKhmer ? "របាយការណ៍" : "Analytics"}
              desc={isKhmer ? "មើលការវិភាគអាជីវកម្មលម្អិត" : "Detailed insights into your business performance."}
              color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
            />
            <QuickAction 
              to="/setting" 
              icon={HiOutlineClipboardList} 
              title={isKhmer ? "ការកំណត់" : "System Config"}
              desc={isKhmer ? "គ្រប់គ្រងការកំណត់ទូទៅ" : "Manage roles, permissions, and system preferences."}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
            />
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`lg:col-span-2 p-8 rounded-[2.5rem] border dark:bg-gray-800/40 dark:border-gray-700 bg-white border-gray-100`}>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <h3 className={`text-2xl font-black dark:text-white text-gray-900`}>
                    {isKhmer ? "មុខងារពិសេសដែលត្រូវបានណែនាំ" : "Recommended Special Functions"}
                  </h3>
                  <p className={`font-medium dark:text-gray-400 text-gray-500`}>
                    {isKhmer 
                      ? "បង្កើនប្រសិទ្ធភាពការងាររបស់អ្នកជាមួយមុខងារទំនើបៗទាំងនេះ។" 
                      : "Maximize your efficiency with these advanced system capabilities designed for growth."}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl flex items-start gap-4 dark:bg-gray-800 bg-blue-50/50`}>
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                      <HiOutlineSparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm dark:text-white text-gray-900`}>
                        {isKhmer ? "ការវិភាគចំណេញ-ខាត" : "Profit Analysis"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {isKhmer ? "ស្វែងយល់ពីប្រភពចំណូលពិតប្រាកដ" : "Advanced tracking of margins and net profits."}
                      </p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl flex items-start gap-4 dark:"bg-gray-800 bg-emerald-50/50`}>
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                      <HiOutlineCubeTransparent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm dark:text-white text-gray-900`}>
                        {isKhmer ? "ការតាមដានផលិតកម្ម" : "Production Tracking"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {isKhmer ? "គ្រប់គ្រងវត្ថុធាតុដើម និងការផលិត" : "Full lifecycle management of your raw materials."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`w-full md:w-64 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-6 text-center border-2 border-dashed dark:border-gray-700 dark:bg-gray-900/50 border-blue-100 bg-blue-50/30`}>
                <HiOutlineShieldCheck className="w-12 h-12 text-blue-500 mb-4" />
                <h4 className={`font-black text-sm uppercase tracking-wider mb-2 dark:text-white text-gray-900`}>
                  {isKhmer ? "សុវត្ថិភាពខ្ពស់" : "Secure System"}
                </h4>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-tighter">
                  {isKhmer ? "ទិន្នន័យរបស់អ្នកត្រូវបានការពារយ៉ាងរឹងមាំ" : "Role-based access control and daily backups enabled."}
                </p>
              </div>
            </div>
          </div>

          {/* Mini Insights Placeholder */}
          <div className={`p-8 rounded-[2.5rem] border dark:bg-chomnenh-light bg-slate-900 border-slate-800 text-white flex flex-col justify-between overflow-hidden relative group`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <HiOutlineLightningBolt className="w-32 h-32" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-xl font-black uppercase tracking-[0.1em]">
                {isKhmer ? "គន្លឹះរហ័ស" : "Pro Tip"}
              </h3>
              <p className="text-sm text-blue-100 font-medium">
                {isKhmer 
                  ? "ប្រើប្រាស់មុខងារស្កេនបាកូដ ដើម្បីបង្កើនល្បឿននៃការលក់ និងការគ្រប់គ្រងស្តុក។" 
                  : "Use the built-in barcode scanner to accelerate your checkout process and inventory audits."}
              </p>
            </div>
            <Link to="/orders" className="relative z-10 mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-blue-600 px-6 py-3 rounded-2xl hover:bg-blue-50 transition-colors self-start">
               {isKhmer ? "សាកល្បងឥឡូវនេះ" : "Try POS Now"}
            </Link>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Home;
