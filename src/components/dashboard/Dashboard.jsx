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
import Button from "../../utils/Button";
import { motion } from "framer-motion";

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

const MetricCard = ({ title, value, persent, isLoss, icon: Icon, colorClass, chartData, chartColor, loading, bgColor }) => (
  <motion.div variants={itemVariants}>
    <div className={`group h-full p-4 border transition-all duration-300 relative overflow-hidden rounded-lg ${bgColor}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/40">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div className="space-y-1">
          <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isLoss ? "bg-red-50 text-red-600 dark:bg-red-950/20" : "bg-green-50 text-green-600 dark:bg-green-950/20"}`}>
          {isLoss ? <BsArrowDownRight className="w-2.5 h-2.5" /> : <BsArrowUpRight className="w-2.5 h-2.5" />} {persent}%
        </span>
      </div>
      <div className="h-12 -mx-4 -mb-4 mt-2 overflow-hidden opacity-30 group-hover:opacity-60 transition-opacity duration-500">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area type="monotone" dataKey="value" stroke={chartColor} fill={chartColor} fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </motion.div>
);

const ChartArea = ({ title, children, loading }) => (
  <motion.div variants={itemVariants}>
    <div className="h-full p-4 transition-all duration-300 relative border rounded-sm bg-white border-gray-200 shadow-sm dark:bg-gray-800/40 dark:border-gray-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-500 rounded-full" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">{title}</h3>
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/40">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="h-64 md:h-72">{children}</div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { t, i18n } = useTranslation();
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
      <div className="view-page p-4 md:p-8 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 p-8 md:p-12 shadow-xl text-center rounded-sm"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 mb-8 transition-transform hover:scale-105 duration-500">
            <RiShoppingCartFill size={40} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-tight">System Administrator</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 font-medium italic">Full administrative control active.</p>
          <Link to="/setting" className="inline-flex">
            <Button variant="primary" className="!h-12 !px-10">
              <span className="font-bold text-sm uppercase tracking-widest">System Settings</span>
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="view-page bg-transparent transition-colors">
      <style>{`
        :root {
          --chart-grid: #e5e7eb;
          --chart-tick: #9ca3af;
          --chart-tooltip-bg: #fff;
          --chart-tooltip-color: #000;
          --chart-border: #e5e7eb;
        }
        .dark {
          --chart-grid: #374151;
          --chart-tick: #9ca3af;
          --chart-tooltip-bg: #1f2937;
          --chart-tooltip-color: #fff;
          --chart-border: #374151;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {t("dashboard")}
          </h1>
          <p className="text-gray-600 text-xs dark:text-gray-400 mt-2">
            {t("performanceInsights")}
          </p>
        </div>
        <div className="mt-6 flex justify-center items-center gap-2">
          <RefreshButton onRefresh={() => { saleQuery.refetch(); purchaseQuery.refetch(); expenseQuery.refetch(); profitQuery.refetch(); }} />
          <Button
            type="button"
            variant="cancel"
            onClick={resetFilters}
          >
            {t("reset")}
          </Button>
        </div>
      </div>

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
        className="grid grid-cols-1"
      >
        {/* Filters Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-gray-100 dark:bg-transparent dark:border-gray-500 p-4 border-0 border-gray-200 border-t-0">
            <div className="flex flex-wrap items-end gap-5">
              <div className="grow max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center text-sm font-semibold gap-2 uppercase text-[11px] tracking-wider">
                    {t("startDate")}
                  </span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 h-10 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="grow max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center text-sm font-semibold gap-2 uppercase text-[11px] tracking-wider">
                    {t("endDate")}
                  </span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 h-10 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="grow max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center text-sm font-semibold gap-2 uppercase text-[11px] tracking-wider">
                    {t("user")}
                  </span>
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 h-10 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
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
        </motion.div>

        <div className="grid grid-cols-4 gap-3 px-2">
          <section className=" col-span-3 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title={t("revenue")}
                value={sales.thisPeriod}
                persent={sales.persent}
                isLoss={sales.thisPeriod < sales.lastPeriod}
                icon={RiShoppingCartFill}
                colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                chartData={revenueChart}
                hartColor="#3b82f6"
                loading={saleQuery.isFetching || previousSaleQuery.isFetching}
                bgColor={'bg-blue-100 border-none'}
              />
              <MetricCard
                title={t("purchases")}
                value={purchases.thisPeriod}
                persent={purchases.persent}
                isLoss={purchases.thisPeriod < purchases.lastPeriod}
                icon={FaWarehouse}
                colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                chartData={purchaseChart}
                chartColor="#f59e0b"
                loading={purchaseQuery.isFetching || previousPurchaseQuery.isFetching}
                bgColor={'bg-amber-100 border-none'}
              />
              <MetricCard
                title={t("expenses")}
                value={expenses.thisPeriod}
                persent={expenses.persent}
                isLoss={expenses.thisPeriod > expenses.lastPeriod}
                icon={RiMoneyDollarCircleFill}
                colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                chartData={expenseChart} chartColor="#f43f5e"
                loading={expenseQuery.isFetching || previousExpenseQuery.isFetching}
                bgColor={'bg-rose-100 border-none'}
              />
              <MetricCard
                title={t("proportion")}
                value={profit.thisPeriod}
                persent={profit.persent}
                isLoss={profit.thisPeriod < profit.lastPeriod}
                icon={FaMoneyBillTrendUp}
                colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                chartData={profitChart}
                chartColor="#10b981"
                loading={profitQuery.isFetching || previousProfitQuery.isFetching}
                bgColor={'bg-emerald-100 border-none'}
              />
            </div>
              <div className="flex gap-3">
                <div className="grow relative">
                  <ChartArea title={t("revenueTrends")} style={{ height: "100%" }} loading={saleQuery.isFetching} className="!h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)", fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)", fontWeight: 600 }} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--chart-border)", backgroundColor: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-color)" }} />
                        <Area type="monotone" dataKey="value" name="Revenue" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.05} />
                        <Area type="monotone" dataKey="quantity" name="Quantity" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.05} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartArea>
                </div>

                <motion.div variants={itemVariants}>
                  <div className="p-4 border rounded-sm text-center bg-cyan-100/50 h-full border-gray-200 shadow-sm dark:bg-gray-800/40 dark:border-gray-500">
                    <div className="flex items-center gap-2 mb-6 text-left">
                      <div className="w-1 h-4 bg-blue-500 rounded-full" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">{t("marketShare")}</h3>
                    </div>
                    <div className="flex justify-center mb-4">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={orderPersentMonthly?.data || []} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="persent" stroke="none">
                            {(orderPersentMonthly?.data || []).map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-color)", border: "1px solid var(--chart-border)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {orderPersentMonthly?.data?.map((entry, idx) => (
                        <div key={idx} className="flex flex-col items-start p-2 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-widest mb-1">{entry.name}</span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{entry.persent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

              </div>

              <div className="flex ">
                <div className="grow">
                  <ChartArea title={t("expenseAnalysis")} loading={expenseQuery.isFetching}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={expenseChart}>
                        <PolarGrid stroke="var(--chart-grid)" />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 8, fill: "var(--chart-tick)", fontWeight: 600 }} />
                        <Radar name="Price" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        <Radar name="Quantity" dataKey="quantity" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-color)", border: "1px solid var(--chart-border)" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartArea>
                </div>

              </div>


              <div>
                <ChartArea title={t("purchaseInventory")} loading={purchaseQuery.isFetching}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={purchaseChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)", fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)", fontWeight: 600 }} />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={{ borderRadius: "8px", border: "1px solid var(--chart-border)", backgroundColor: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-color)" }} />
                      <Bar dataKey="quantity" name="Quantity" fill="#3BA3F6" radius={[10, 10, 0, 0]} barSize={70} />
                      <Bar dataKey="value" name="Price" fill="#85BBFF" radius={[10, 10, 0, 0]} barSize={70} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartArea>
              </div>

          </section>
          <section className="col-span-1 flex flex-col gap-3">
            <div className="space-y-4">
              <motion.div variants={itemVariants}>
                <div className="p-4 border rounded-sm bg-white border-gray-200 shadow-sm dark:bg-gray-800/40 dark:border-gray-500">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">{t("topSellingItems")}</h3>
                  </div>
                  <div className="space-y-4">
                    {popularSales?.data?.map((s, i) => (
                      <div key={i} className="flex items-center gap-4 group border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                        <div className="w-10 h-10 rounded p-1 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-transform group-hover:scale-105">
                          <img className="w-full h-full object-contain" src={s.image} alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold truncate uppercase tracking-tight text-gray-800 dark:text-gray-200">{s.item_name}</h4>
                          <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">{s.brand_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">${s.total_price}</p>
                          <p className="text-[9px] text-emerald-600 font-bold uppercase">{s.total_quantity} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <div className="h-full p-4 border rounded-sm bg-white border-gray-200 shadow-sm dark:bg-gray-800/40 dark:border-gray-500">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-4 bg-blue-500 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">{t("recentStockIn")}</h3>
                </div>
                <div className="space-y-4">
                  {popularStock?.data?.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-4 group border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                      <div className="w-10 h-10 rounded flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 transition-transform group-hover:scale-105">
                        <img className="w-6 h-6 object-contain" src={s.image} alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate uppercase tracking-tight text-gray-800 dark:text-gray-200">{s.item_name}</h4>
                        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">{s.brand_name}</p>
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 font-bold text-[10px] bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">+{s.total_quantity}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="h-full p-4 border rounded-sm bg-white border-gray-200 shadow-sm dark:bg-gray-800/40 dark:border-gray-500">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-4 bg-blue-500 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">{t("majorExpenses")}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {popularExpanses?.data?.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-4 group border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                      <div className="w-10 h-10 rounded bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 transition-transform group-hover:scale-105">
                        <RiMoneyDollarCircleFill size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate uppercase tracking-tight text-gray-800 dark:text-gray-200">{ex.description}</h4>
                        <p className="text-[9px] font-medium text-rose-400 dark:text-rose-300 uppercase tracking-widest">{ex.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">-${ex.total_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>







        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
