import { useMemo, useState, useEffect } from "react";
import { RiShoppingCartFill, RiMoneyDollarCircleFill } from "react-icons/ri";
import { FaMoneyBillTrendUp, FaWarehouse } from "react-icons/fa6";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useGetDashboardFilterQuery } from "../../../app/Features/dashboardsSlice";
import { useGetPopularExpansesQuery } from "../../../app/Features/expensesSlice";
import {
  useGetPersentOrderMonthlyQuery,
  useGetPopularOrderQuery,
} from "../../../app/Features/ordersSlice";
import { useGetPopularStockQuery } from "../../../app/Features/stocksSlice";
import { useGetAllUserQuery, useGetUserLoginQuery } from "../../../app/Features/usersSlice";
import RefreshButton from "../../utils/RefreshButton";
import { motion } from "framer-motion";
import { useOutletsContext } from "../../layouts/Management";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

const formatDate = (date) => date.toISOString().slice(0, 10);

const getDefaultRange = () => {
  const now = new Date();
  return {
    start_date: formatDate(new Date(now.getFullYear(), 0, 1)),
    end_date: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const buildPreviousRange = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59`);
  const diff = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1000);
  const previousStart = new Date(previousEnd.getTime() - diff);

  return {
    start_date: formatDate(previousStart),
    end_date: formatDate(previousEnd),
  };
};

const normalizeChartRows = (rows = [], valueKey = "price") => {
  if (!rows?.length) {
    return [];
  }

  return rows.map((row) => ({
    name: row.name,
    value: Number(row[valueKey] || 0),
    quantity: Number(row.quantity || 0),
  }));
};

const definePersents = (currentValue, previousValue) => {
  if (currentValue === previousValue) return 0;
  if (previousValue === 0) return 100;
  return Number((Math.abs((currentValue - previousValue) / previousValue) * 100).toFixed(1));
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const MetricCard = ({ title, value, persent, isLoss, icon: Icon, colorClass, chartData, chartColor, loading, darkMode }) => (
  <motion.div variants={itemVariants}>
    <div className={`group h-full p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden
      ${darkMode ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-blue-500/50" : "bg-white border-gray-100 hover:border-blue-200"}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/40">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.1em] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
          <h3 className={`text-xl md:text-2xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>
            ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full ${isLoss ? "bg-red-50 text-red-600 dark:bg-red-950/20" : "bg-green-50 text-green-600 dark:bg-green-950/20"}`}>
          {isLoss ? <BsArrowDownRight className="w-2.5 h-2.5" /> : <BsArrowUpRight className="w-2.5 h-2.5" />} {persent}%
        </span>
      </div>
      <div className="h-16 -mx-6 -mb-6 mt-2 overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity duration-500">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area type="monotone" dataKey="value" stroke={chartColor} fill={chartColor} fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </motion.div>
);

const ChartArea = ({ title, children, loading, darkMode }) => (
  <motion.div variants={itemVariants}>
    <div className={`h-full p-6 md:p-8 transition-all duration-300 relative`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
          <h3 className={`text-base font-black uppercase tracking-wider ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[2.5rem] bg-white/40 dark:bg-black/40">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="h-64 md:h-80">{children}</div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { darkMode } = useOutletsContext();
  const token = localStorage.getItem("token");
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start_date);
  const [endDate, setEndDate] = useState(defaultRange.end_date);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "kh" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const filterArgs = useMemo(() => ({
    token,
    start_date: startDate,
    end_date: endDate,
    user_id: userId || undefined,
  }), [token, startDate, endDate, userId]);

  const previousRange = useMemo(() => buildPreviousRange(startDate, endDate), [startDate, endDate]);
  const previousArgs = useMemo(() => ({
    token,
    ...previousRange,
    user_id: userId || undefined,
  }), [token, previousRange, userId]);

  const saleQuery = useGetDashboardFilterQuery({ ...filterArgs, operation: "sale" });
  const purchaseQuery = useGetDashboardFilterQuery({ ...filterArgs, operation: "purchase" });
  const expenseQuery = useGetDashboardFilterQuery({ ...filterArgs, operation: "expense" });
  const profitQuery = useGetDashboardFilterQuery({ ...filterArgs, operation: "profit" });

  const previousSaleQuery = useGetDashboardFilterQuery({ ...previousArgs, operation: "sale" });
  const previousPurchaseQuery = useGetDashboardFilterQuery({ ...previousArgs, operation: "purchase" });
  const previousExpenseQuery = useGetDashboardFilterQuery({ ...previousArgs, operation: "expense" });
  const previousProfitQuery = useGetDashboardFilterQuery({ ...previousArgs, operation: "profit" });

  const { data: popularExpanses } = useGetPopularExpansesQuery(token);
  const { data: popularSales } = useGetPopularOrderQuery(token);
  const { data: orderPersentMonthly } = useGetPersentOrderMonthlyQuery(token);
  const { data: popularStock } = useGetPopularStockQuery(token);
  const { data: userLogin, isLoading } = useGetUserLoginQuery(token);
  const { data: usersData } = useGetAllUserQuery(token);

  const salesThis = Number(saleQuery.data?.data?.summary?.price || 0);
  const salesLast = Number(previousSaleQuery.data?.data?.summary?.price || 0);
  const purchasesThis = Number(purchaseQuery.data?.data?.summary?.price || 0);
  const purchasesLast = Number(previousPurchaseQuery.data?.data?.summary?.price || 0);
  const expensesThis = Number(expenseQuery.data?.data?.summary?.price || 0);
  const expensesLast = Number(previousExpenseQuery.data?.data?.summary?.price || 0);
  const profitThis = Number(profitQuery.data?.data?.summary?.price || 0);
  const profitLast = Number(previousProfitQuery.data?.data?.summary?.price || 0);

  const sales = { thisPeriod: salesThis, lastPeriod: salesLast, persent: definePersents(salesThis, salesLast) };
  const purchases = { thisPeriod: purchasesThis, lastPeriod: purchasesLast, persent: definePersents(purchasesThis, purchasesLast) };
  const expenses = { thisPeriod: expensesThis, lastPeriod: expensesLast, persent: definePersents(expensesThis, expensesLast) };
  const profit = { thisPeriod: profitThis, lastPeriod: profitLast, persent: definePersents(profitThis, profitLast) };

  const revenueChart = normalizeChartRows(saleQuery.data?.data?.chart);
  const purchaseChart = normalizeChartRows(purchaseQuery.data?.data?.chart);
  const expenseChart = normalizeChartRows(expenseQuery.data?.data?.chart);
  const profitChart = normalizeChartRows(profitQuery.data?.data?.chart);

  const resetFilters = () => {
    setStartDate(defaultRange.start_date);
    setEndDate(defaultRange.end_date);
    setUserId("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (userLogin?.data?.role_id === 1) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-primary rounded-[3rem] p-8 md:p-16 shadow-2xl border border-gray-100 dark:border-gray-700 text-center"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 mb-8 transition-transform hover:scale-110 hover:rotate-6 duration-500">
            <RiShoppingCartFill size={48} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">System Administrator</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 font-medium">Full administrative control active.</p>
          <Link to="/setting" className="inline-flex items-center justify-center bg-blue-600 text-white rounded-2xl px-8 py-5 shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 group">
            <span className="font-black text-xl uppercase tracking-widest">System Settings</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className=" bg-transparent min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        className="space-y-2"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h1 className={`text-xl font-black uppercase tracking-[0.2em] ${darkMode ? "text-white" : "text-gray-900"}`}>
                {t("dashboard")}
              </h1>
            </div>
            <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {t("performanceInsights")}
            </p>
          </header>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <RefreshButton onRefresh={() => {saleQuery.refetch();purchaseQuery.refetch();expenseQuery.refetch();profitQuery.refetch();}} />
              <button
                type="button"
                onClick={resetFilters}
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors h-10 border border-transparent"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-primary px-4 py-2.5 rounded-xl  border border-gray-100 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 h-10 outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-primary px-4 py-2.5 rounded-xl  border border-gray-100 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 h-10 outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="col-span-2 md:col-span-1 bg-primary px-4 py-2.5 rounded-xl  border border-gray-100 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 h-10 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
              >
                <option value="">All Users</option>
                {usersData?.data?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title={t("revenue")} value={sales.thisPeriod} persent={sales.persent} isLoss={sales.thisPeriod < sales.lastPeriod} icon={RiShoppingCartFill} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" chartData={revenueChart} chartColor="#3b82f6" loading={saleQuery.isFetching || previousSaleQuery.isFetching} darkMode={darkMode} />
          <MetricCard title={t("purchases")} value={purchases.thisPeriod} persent={purchases.persent} isLoss={purchases.thisPeriod > purchases.lastPeriod} icon={FaWarehouse} colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" chartData={purchaseChart} chartColor="#f59e0b" loading={purchaseQuery.isFetching || previousPurchaseQuery.isFetching} darkMode={darkMode} />
          <MetricCard title={t("expenses")} value={expenses.thisPeriod} persent={expenses.persent} isLoss={expenses.thisPeriod > expenses.lastPeriod} icon={RiMoneyDollarCircleFill} colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400" chartData={expenseChart} chartColor="#f43f5e" loading={expenseQuery.isFetching || previousExpenseQuery.isFetching} darkMode={darkMode} />
          <MetricCard title={t("proportion")} value={profit.thisPeriod} persent={profit.persent} isLoss={profit.thisPeriod < profit.lastPeriod} icon={FaMoneyBillTrendUp} colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" chartData={profitChart} chartColor="#10b981" loading={profitQuery.isFetching || previousProfitQuery.isFetching} darkMode={darkMode} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <div className="lg:col-span-2 space-y-2">
            <ChartArea title={t("proportionAnalytics")} loading={profitQuery.isFetching} darkMode={darkMode}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#ffffff" : "#000000"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", backgroundColor: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#fff" : "#000" }} />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="value" name={t('proportion')} stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartArea>

            <ChartArea title={t("revenueTrends")} loading={saleQuery.isFetching} darkMode={darkMode}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#ffffff" : "#000000"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", backgroundColor: darkMode ? "#1f2937" : "#fff" }} />
                  <Area type="monotone" dataKey="value" name="Revenue" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="quantity" name="Quantity" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartArea>
          </div>

          <div className="space-y-2">
            <motion.div variants={itemVariants}>
              <div className={`p-8 transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h3 className={`text-base font-black uppercase tracking-wider ${darkMode ? "text-white" : "text-gray-900"}`}>{t("topSellingItems")}</h3>
                </div>
                <div className="space-y-4">
                  {popularSales?.data?.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl p-1 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-transform group-hover:scale-110">
                        <img className="w-full h-full object-contain" src={s.image} alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-black truncate uppercase tracking-tight ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{s.item_name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.brand_name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${darkMode ? "text-white" : "text-gray-900"}`}>${s.total_price}</p>
                        <p className="text-[10px] text-emerald-600 font-black uppercase">{s.total_quantity} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className={`p-8 transition-all duration-300 text-center`}>
                <div className="flex items-center gap-3 mb-8 text-left">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h3 className={`text-base font-black uppercase tracking-wider ${darkMode ? "text-white" : "text-gray-900"}`}>{t("marketShare")}</h3>
                </div>
                <div className="flex justify-center mb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={orderPersentMonthly?.data || []} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="persent" stroke="none">
                        {(orderPersentMonthly?.data || []).map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {orderPersentMonthly?.data?.map((entry, idx) => (
                    <div key={idx} className="flex flex-col items-start p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">{entry.name}</span>
                      <span className={`text-sm font-black ${darkMode ? "text-white" : "text-gray-900"}`}>{entry.persent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="lg:col-span-2">
            <ChartArea title={t("purchaseInventory")} loading={purchaseQuery.isFetching} darkMode={darkMode}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#ffffff" : "#000000"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="quantity" name="Quantity" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="value" name="Price" fill="#60a5fa" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartArea>
          </div>
          <motion.div variants={itemVariants}>
            <div className={`h-full p-8 transition-all duration-300 `}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h3 className={`text-base font-black uppercase tracking-wider ${darkMode ? "text-white" : "text-gray-900"}`}>{t("recentStockIn")}</h3>
              </div>
              <div className="space-y-6">
                {popularStock?.data?.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 transition-transform group-hover:scale-110">
                      <img className="w-6 h-6 object-contain" src={s.image} alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-black truncate uppercase tracking-tight ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{s.item_name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.brand_name}</p>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 font-black text-xs bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl">+{s.total_quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 pb-2">
          <ChartArea title={t("expenseAnalysis")} loading={expenseQuery.isFetching} darkMode={darkMode}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={expenseChart}>
                <PolarGrid stroke={darkMode ? "#ffffff" : "#000000"}/>
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b7280", fontWeight: 700 }} />
                <Radar name="Price" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Radar name="Quantity" dataKey="quantity" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartArea>
          <div className="lg:col-span-2">
            <motion.div variants={itemVariants} className="h-full">
              <div className={`h-full p-8 transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h3 className={`text-base font-black uppercase tracking-wider ${darkMode ? "text-white" : "text-gray-900"}`}>{t("majorExpenses")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {popularExpanses?.data?.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 transition-transform group-hover:scale-110 group-hover:rotate-6">
                        <RiMoneyDollarCircleFill size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-black truncate uppercase tracking-tight ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{ex.description}</h4>
                        <p className="text-[10px] font-bold text-rose-400 dark:text-rose-300 uppercase tracking-widest">{ex.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-rose-600 dark:text-rose-400">-${ex.total_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
