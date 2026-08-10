import { useMemo, useState, useEffect } from "react";
import {
  RiShoppingCartFill,
  RiMoneyDollarCircleFill,
  RiFileList3Line,
  RiTrophyLine,
  RiBarChartBoxLine,
  RiBox3Line,
  RiWalletLine,
  RiUserStarLine,
} from "react-icons/ri";
import { FaMoneyBillTrendUp, FaWarehouse } from "react-icons/fa6";
import {
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  BsArrowDownRight,
  BsArrowRight,
  BsArrowUpRight,
  BsChevronLeft,
  BsChevronRight,
  BsGear,
} from "react-icons/bs";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useGetDashboardFilterQuery } from "@/features/dashboard/dashboardsSlice";
import { useGetPopularExpansesQuery } from "@/features/expenses/expensesSlice";
import {
  useGetPersentOrderMonthlyQuery,
  useGetPopularOrderQuery,
  useGetTopSellerQuery,
} from "@/features/sales/ordersSlice";
import { useGetPopularStockQuery } from "@/features/stocks/stocksSlice";
import { useGetAllUserQuery, useGetUserLoginQuery, useGetCurrentProfileQuery } from "@/features/auth/usersSlice";
import { useGetAllCustomerQuery } from "@/features/customers/customersSlice";
import RefreshButton from "../../utils/RefreshButton";
import Button from "../../utils/Button";
import { motion } from "framer-motion";
import { IoImagesSharp, IoSparklesOutline } from "react-icons/io5";
import { FiAward, FiUser, FiDollarSign, FiPieChart } from "react-icons/fi";
import { Segmented } from "antd";
import { useGetAllDeliverQuery } from "@/features/sales/deliversSlice";
import { useGetAllSupplierQuery } from "@/features/purchases/suppliesSlice";
import MultiProfiles from "@/services/MultiProfiles";
import { useGetTopItemsQuery } from "@/features";
import { getToken } from '@/utils/tokenStore';

const COLORS = ["#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

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
  if (!rows?.length) return [];
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
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
};

/* ────────────────────────────────────────────────────────────
   METRIC CARD
──────────────────────────────────────────────────────────── */
const MetricCard = ({
  title, value, persent, isLoss, icon: Icon, colorClass,
  chartData, chartColor, loading, subtext,
}) => (
  <motion.div variants={itemVariants} className="h-full">
    <div className="group h-full p-4 md:p-5 border rounded-2xl transition-all duration-300 relative shadow-xs overflow-hidden bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700/60 hover:shadow-md">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xs">
          <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
          isLoss
            ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        }`}>
          {isLoss ? <BsArrowDownRight className="w-3 h-3" /> : <BsArrowUpRight className="w-3 h-3" />} {persent}%
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{subtext || "vs last period"}</span>
      </div>
      <div className="h-10 -mx-5 -mb-5 mt-3 overflow-hidden opacity-35 group-hover:opacity-60 transition-opacity duration-300">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor || "#06b6d4"}
              fill={chartColor || "#06b6d4"}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </motion.div>
);

/* ────────────────────────────────────────────────────────────
   CHART AREA WRAPPER
──────────────────────────────────────────────────────────── */
const ChartArea = ({ title, actionText = "View Details", actionLink, children, loading }) => (
  <motion.div variants={itemVariants} className="h-full">
    <div className="h-full p-4 md:p-5 transition-all duration-300 relative border rounded-2xl bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700/60 shadow-xs hover:shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
        {actionLink ? (
          <Link to={actionLink} className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline group">
            <span>{actionText}</span>
            <BsArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 font-semibold cursor-pointer hover:underline group">
            <span>{actionText}</span>
            <BsArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}
      </div>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xs rounded-2xl">
          <div className="w-7 h-7 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="h-60 md:h-64">{children}</div>
    </div>
  </motion.div>
);

/* ────────────────────────────────────────────────────────────
   SECTION CARD (generic panel)
──────────────────────────────────────────────────────────── */
const SectionCard = ({ title, icon: Icon, iconClass, actionText, actionLink, children, loading }) => (
  <motion.div variants={itemVariants}>
    <div className="p-5 border rounded-2xl bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700/60 shadow-xs relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xs rounded-2xl">
          <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`text-lg ${iconClass || "text-cyan-500"}`} />}
          <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
        </div>
        {actionLink && (
          <Link to={actionLink} className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 group">
            {actionText || "View All"} <BsArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
      {children}
    </div>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const token = getToken();
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start_date);
  const [endDate, setEndDate] = useState(defaultRange.end_date);
  const [userId, setUserId] = useState("");
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang) i18n.changeLanguage(savedLang);
  }, [i18n]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filterArgs = useMemo(
    () => ({ token, start_date: startDate, end_date: endDate, user_id: userId || undefined }),
    [token, startDate, endDate, userId]
  );

  const previousRange = useMemo(() => buildPreviousRange(startDate, endDate), [startDate, endDate]);
  const previousArgs = useMemo(
    () => ({ token, ...previousRange, user_id: userId || undefined }),
    [token, previousRange, userId]
  );

  const delivers = useGetAllDeliverQuery(token);
  const suppliers = useGetAllSupplierQuery(token);


  const deliversData = useMemo(() => {
    const list = delivers?.currentData?.data || (Array.isArray(delivers) ? delivers : []);
    return Array.isArray(list) ? list : [];
  }, [delivers]);

  const suppliersData = useMemo(() => {
    const list = suppliers?.currentData?.data || (Array.isArray(suppliers) ? suppliers : []);
    return Array.isArray(list) ? list : [];
  }, [suppliers]);

  // KPI query args (memoized so clock ticks don't re-trigger network requests)
  const saleArgs = useMemo(() => ({ ...filterArgs, operation: "sale" }), [filterArgs]);
  const purchaseArgs = useMemo(() => ({ ...filterArgs, operation: "purchase" }), [filterArgs]);
  const expenseArgs = useMemo(() => ({ ...filterArgs, operation: "expense" }), [filterArgs]);
  const profitArgs = useMemo(() => ({ ...filterArgs, operation: "profit" }), [filterArgs]);

  const previousSaleArgs = useMemo(() => ({ ...previousArgs, operation: "sale" }), [previousArgs]);
  const previousPurchaseArgs = useMemo(() => ({ ...previousArgs, operation: "purchase" }), [previousArgs]);
  const previousExpenseArgs = useMemo(() => ({ ...previousArgs, operation: "expense" }), [previousArgs]);
  const previousProfitArgs = useMemo(() => ({ ...previousArgs, operation: "profit" }), [previousArgs]);

  // KPI queries
  const saleQuery = useGetDashboardFilterQuery(saleArgs);
  const purchaseQuery = useGetDashboardFilterQuery(purchaseArgs);
  const expenseQuery = useGetDashboardFilterQuery(expenseArgs);
  const profitQuery = useGetDashboardFilterQuery(profitArgs);

  const previousSaleQuery = useGetDashboardFilterQuery(previousSaleArgs);
  const previousPurchaseQuery = useGetDashboardFilterQuery(previousPurchaseArgs);
  const previousExpenseQuery = useGetDashboardFilterQuery(previousExpenseArgs);
  const previousProfitQuery = useGetDashboardFilterQuery(previousProfitArgs);

  const [topSellerFilter, setTopSellerFilter] = useState("price");

  const topSellerArgs = useMemo(() => ({
    token,
    filter: topSellerFilter,
    start_date: startDate,
    end_date: endDate,
    user_id: userId || undefined,
  }), [token, topSellerFilter, startDate, endDate, userId]);

  const topItemsArgs = useMemo(() => ({
    operation: "sale",
    token,
    filter: "price",
    limit: 5,
    start_date: startDate,
    end_date: endDate,
    user_id: userId || undefined,
  }), [token, startDate, endDate, userId]);

  // Widget queries
  const { data: popularExpenses, isLoading: loadingExpenses } = useGetPopularExpansesQuery(token);
  const { data: popularSales, isLoading: loadingSales } = useGetPopularOrderQuery(token);
  const { data: orderPersentMonthly } = useGetPersentOrderMonthlyQuery(token);
  const { data: popularStock, isLoading: loadingStock } = useGetPopularStockQuery(token);
  const { data: topSellersResponse, isLoading: loadingTopSellers, refetch: refetchTopSellers } = useGetTopSellerQuery(topSellerArgs);
  const topSellersList = topSellersResponse?.data || [];

  const { data: topSellingProducts, isLoading: loadingTopSellingProducts, refetch: refetchTopItems } = useGetTopItemsQuery(topItemsArgs);
  const { data: userLogin, isLoading } = useGetUserLoginQuery(token);
  const { data: usersData } = useGetAllUserQuery(token);
  const { data: currentProfileData } = useGetCurrentProfileQuery(token);

  const currentProfile = useMemo(() => {
    if (!currentProfileData) return null;
    return Array.isArray(currentProfileData?.data)
      ? currentProfileData.data[0]
      : currentProfileData?.data || currentProfileData;
  }, [currentProfileData]);

  const profileImage =
    userLogin?.data?.image ||
    userLogin?.data?.profile?.image ||
    currentProfile?.image ||
    currentProfile?.img ||
    currentProfile?.photo ||
    null;

  const companyName =
    currentProfile?.profile_name ||
    currentProfile?.company_name ||
    currentProfile?.name ||
    userLogin?.data?.company_name ||
    userLogin?.data?.profile_name ||
    null;

  const username = userLogin?.data?.username || "Manager";
  const roleName = userLogin?.data?.role?.name || "Operator";
  const phone = currentProfile?.tel || currentProfile?.phone || currentProfile?.number_phone || userLogin?.data?.tel || userLogin?.data?.phone || null;

  const { data: customerResponse, isLoading: loadingCustomers, refetch: refetchCustomers } = useGetAllCustomerQuery(token);
  const customersList = useMemo(() => {
    const list = customerResponse?.data || (Array.isArray(customerResponse) ? customerResponse : []);
    return list.slice(0, 5);
  }, [customerResponse]);
  

  // KPI values
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

  // Merge purchase + expense for combined bar chart
  const combinedChart = useMemo(() => {
    const map = {};
    purchaseChart.forEach((r) => { map[r.name] = { name: r.name, purchase: r.value, expense: 0 }; });
    expenseChart.forEach((r) => {
      if (!map[r.name]) map[r.name] = { name: r.name, purchase: 0, expense: 0 };
      map[r.name].expense = r.value;
    });
    return Object.values(map);
  }, [purchaseChart, expenseChart]);

  const resetFilters = () => {
    setStartDate(defaultRange.start_date);
    setEndDate(defaultRange.end_date);
    setUserId("");
  };

  const getGreeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Calendar
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, isCurrentMonth: true });
    const remaining = 35 - days.length;
    for (let i = 1; i <= (remaining >= 0 ? remaining : 42 - days.length); i++) days.push({ day: i, isCurrentMonth: false });
    return days;
  }, [currentMonthDate]);

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const prevMonth = () => setCurrentMonthDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonthDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1));

  const quickLinks = [
    { title: "POS Terminal",     link: "/orders",                  icon: RiShoppingCartFill,   bg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400" },
    { title: "Stocks / In",      link: "/inventories/stock-list",  icon: FaWarehouse,          bg: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" },
    { title: "Quotations",       link: "/home/quotations",         icon: RiFileList3Line,      bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" },
    { title: "Expenses",         link: "/home/expenses",           icon: RiMoneyDollarCircleFill, bg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400" },
    { title: "Items & Products", link: "/inventories/list",        icon: IoImagesSharp,        bg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" },
    { title: "Sales Reports",    link: "/report",                  icon: FaMoneyBillTrendUp,   bg: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400" },
    { title: "Profit Analysis",  link: "/report/analysis-profit",  icon: IoSparklesOutline,    bg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" },
  ];

  // Top stock level (max qty for progress bar)
  const maxStockQty = useMemo(() => {
    const items = popularStock?.data || [];
    return Math.max(...items.map((s) => Number(s.quantity || s.qty || 0)), 1);
  }, [popularStock]);

  // Max expense amount for progress bar
  const maxExpenseAmt = useMemo(() => {
    const items = popularExpenses?.data || [];
    return Math.max(...items.map((e) => Number(e.price || e.total || e.amount || 0)), 1);
  }, [popularExpenses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 dark:border-cyan-900 dark:border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (userLogin?.data?.role_id === 1) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 md:p-12 shadow-xl text-center rounded-2xl"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400 mb-6">
            <RiShoppingCartFill size={36} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">System Administrator</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Full administrative control active.</p>
          <Link to="/setting" className="inline-flex">
            <Button variant="primary" className="!h-12 !px-10 !rounded-xl">
              <span className="font-bold text-sm uppercase tracking-wider">System Settings</span>
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-900 p-4 md:p-6 transition-colors">
      <style>{`
        :root {
          --chart-grid: #f1f5f9;
          --chart-tick: #94a3b8;
          --chart-tooltip-bg: #ffffff;
          --chart-tooltip-color: #0f172a;
          --chart-border: #e2e8f0;
        }
        .dark {
          --chart-grid: #334155;
          --chart-tick: #94a3b8;
          --chart-tooltip-bg: #1e293b;
          --chart-tooltip-color: #f8fafc;
          --chart-border: #334155;
        }
        .dark .ant-segmented {
          background-color: #1e293b !important;
          color: #94a3b8 !important;
        }
        .dark .ant-segmented-item {
          color: #94a3b8 !important;
        }
        .dark .ant-segmented-item-selected {
          background-color: #0891b2 !important;
          color: #ffffff !important;
        }
        .dark .ant-segmented-item:hover:not(.ant-segmented-item-selected) {
          color: #cbd5e1 !important;
        }
      `}</style>

      {/* ── Date Filter & Control Toolbar ── */}
      <div className="mb-6 bg-white dark:bg-gray-800/90 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 grow">
            <div className="grow max-w-xs">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {t("startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 h-9 outline-none focus:ring-2 focus:ring-cyan-500/40 dark:[color-scheme:dark]"
              />
            </div>
            <div className="grow max-w-xs">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {t("endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 h-9 outline-none focus:ring-2 focus:ring-cyan-500/40 dark:[color-scheme:dark]"
              />
            </div>
            <div className="grow max-w-xs">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {t("user")}
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 h-9 outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value="" className="dark:bg-gray-900 dark:text-gray-200">All Users</option>
                {usersData?.data?.map((user) => (
                  <option key={user.id} value={user.id} className="dark:bg-gray-900 dark:text-gray-200">{user.username}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton
              onRefresh={() => {
                saleQuery.refetch();
                purchaseQuery.refetch();
                expenseQuery.refetch();
                profitQuery.refetch();
                refetchTopSellers();
                refetchTopItems();
                refetchCustomers();
              }}
            />
            <Button type="button" variant="cancel" onClick={resetFilters} className="!rounded-xl !h-9 !px-4 text-xs font-semibold">
              {t("reset")}
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="space-y-6"
      >
        {/* ══ Main Grid: Left (3 cols) + Right Sidebar (1 col) ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── LEFT MAIN AREA ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* 1. HERO WELCOME BANNER + DATE/TIME CARD */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Hero Banner */}
              <div className="md:col-span-2 relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-cyan-600 via-cyan-700 to-teal-800 dark:from-cyan-950 dark:via-cyan-900 dark:to-slate-900 dark:border dark:border-cyan-800/50 text-white shadow-lg flex items-center justify-between">
                {/* Decorative blobs */}
                <div className="absolute -right-12 -top-12 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-3 max-w-sm">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-cyan-50">
                    <IoSparklesOutline className="text-yellow-300" /> Chomnenh POS
                  </span>
                  <h2 className="text-2xl md:text-3xl dark:text-gray-100 font-extrabold tracking-tight leading-tight">
                    {"Welcome to"}, <br className="hidden sm:block" />
                    {companyName || userLogin?.data?.username || "Manager"}!
                  </h2>
                  <p className="text-xs text-cyan-100 leading-relaxed">
                    Manage sales, track inventory, and grow your business — all from one place.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <Link to="/order-list">
                      <button className="px-4 py-2 rounded-xl bg-white text-cyan-700 dark:bg-cyan-600 dark:text-white dark:hover:bg-cyan-500 font-bold text-xs shadow hover:bg-cyan-50 transition flex items-center gap-1.5">
                        View Orders <BsArrowRight />
                      </button>
                    </Link>
                    <Link to="/orders">
                      <button className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-xs border border-white/30 text-white font-bold text-xs hover:bg-white/25 transition">
                        Open POS
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Profile / Company Data Badge Card */}
                <div className="hidden sm:flex flex-col items-center justify-center relative z-10 pr-2 gap-1.5 min-w-[130px] text-center">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 shadow-md flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile Logo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-white bg-white/10"
                        style={{ display: profileImage ? "none" : "flex" }}
                      >
                        {companyName?.[0]?.toUpperCase() || username?.[0]?.toUpperCase() || "🏪"}
                      </div>
                    </div>
                    {/* Status badge */}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-cyan-700 dark:border-cyan-900 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-xs" title="Active">
                      ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Date & Time + Summary Chips */}
              <div className="flex flex-col gap-4">
                {/* Live Clock Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-xs flex-1 flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Current Time</p>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">{timeStr}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">{dateStr}</p>
                </div>
                {/* Delivers & Suppliers summary mini chip */}
                <div className="p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-xs flex flex-col justify-between gap-2 min-h-[90px]">
                  {/* Delivers Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Delivers</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300">
                        {deliversData.length}
                      </span>
                    </div>
                    <Link to="/home/delivers" className="hover:opacity-80 transition-opacity">
                      <MultiProfiles data={deliversData} max={5} />
                    </Link>
                  </div>

                  <div className="border-b border-gray-100 dark:border-gray-700/60" />

                  {/* Suppliers Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Suppliers</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
                        {suppliersData.length}
                      </span>
                    </div>
                    <Link to="/inventories/suppliers" className="hover:opacity-80 transition-opacity">
                      <MultiProfiles data={suppliersData} max={5} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title={t("revenue")}
                value={sales.thisPeriod}
                persent={sales.persent}
                isLoss={sales.thisPeriod < sales.lastPeriod}
                icon={RiShoppingCartFill}
                colorClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400"
                chartData={revenueChart}
                chartColor="#06b6d4"
                loading={saleQuery.isFetching || previousSaleQuery.isFetching}
                subtext="Across active registers"
              />
              <MetricCard
                title={t("purchases")}
                value={purchases.thisPeriod}
                persent={purchases.persent}
                isLoss={purchases.thisPeriod < purchases.lastPeriod}
                icon={FaWarehouse}
                colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                chartData={purchaseChart}
                chartColor="#10b981"
                loading={purchaseQuery.isFetching || previousPurchaseQuery.isFetching}
                subtext="Across suppliers"
              />
              <MetricCard
                title={t("expenses")}
                value={expenses.thisPeriod}
                persent={expenses.persent}
                isLoss={expenses.thisPeriod > expenses.lastPeriod}
                icon={RiMoneyDollarCircleFill}
                colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
                chartData={expenseChart}
                chartColor="#8b5cf6"
                loading={expenseQuery.isFetching || previousExpenseQuery.isFetching}
                subtext="Operational costs"
              />
            </div>

            {/* 3. QUICK NAVIGATION LINKS */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800/90 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Quick Navigation</h3>
                {/* <BsGear className="text-gray-400 w-4 h-4" /> */}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                {quickLinks.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={idx}
                      to={item.link}
                      className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group"
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${item.bg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 text-center line-clamp-2 leading-tight">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>

            {/* 4. CHARTS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Revenue Trend */}
              <div className="lg:col-span-1">
                <ChartArea title={t("revenueTrends")} actionText="Sales Report" actionLink="/report/sales" loading={saleQuery.isFetching}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)", fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)", fontWeight: 600 }} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--chart-border)", backgroundColor: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-color)" }} />
                      <Area type="monotone" dataKey="value" name="Revenue" stroke="#06b6d4" strokeWidth={2.5} fill="#06b6d4" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="quantity" name="Quantity" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.05} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartArea>
              </div>

              {/* Purchase vs Expense */}
              <div className="lg:col-span-1">
                <ChartArea title="Purchase vs Expense" actionText="Expense Report" actionLink="/report/expenses" loading={purchaseQuery.isFetching}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)", fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)", fontWeight: 600 }} />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={{ borderRadius: "12px", border: "1px solid var(--chart-border)", backgroundColor: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-color)" }} />
                      <Bar dataKey="purchase" name="Purchase" fill="#10b981" radius={[6, 6, 0, 0]} barSize={16} />
                      <Bar dataKey="expense" name="Expense" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartArea>
              </div>

              
            </div>

            {/* 5. TOP 3 BEST SELLERS (STAFF) */}
            <motion.div variants={itemVariants}>
              <div className="p-5 border rounded-2xl bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700/60 shadow-xs relative">
                {loadingTopSellers && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xs rounded-2xl">
                    <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FiAward className="text-xl text-amber-500" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Top 3 Best Sellers</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Top performing staff members for the selected date range</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Segmented
                      options={[
                        { label: "By Revenue", value: "price", icon: <FiDollarSign className="inline mb-0.5 text-xs" /> },
                        { label: "By Quantity", value: "quantity", icon: <FiPieChart className="inline mb-0.5 text-xs" /> },
                      ]}
                      value={topSellerFilter}
                      onChange={setTopSellerFilter}
                      className="text-xs !bg-gray-100 dark:!bg-gray-700"
                    />
                    <Link to="/top-seller" className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 group">
                      <span>Full Page</span>
                      <BsArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {topSellersList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {topSellersList.map((seller, index) => (
                      <div
                        key={seller.created_by || index}
                        className={`relative bg-gray-50/80 dark:bg-gray-900/50 rounded-2xl border p-4 flex flex-col items-center transition-all duration-300 hover:shadow-sm ${
                          index === 0
                            ? "border-amber-400/80 dark:border-amber-500/60 shadow-xs"
                            : index === 1
                            ? "border-slate-300 dark:border-slate-700"
                            : "border-orange-300 dark:border-orange-800"
                        }`}
                      >
                        {/* Award Badge */}
                        <div className="absolute top-3 right-3">
                          <FiAward
                            className={`text-2xl ${
                              index === 0
                                ? "text-amber-400"
                                : index === 1
                                ? "text-slate-300"
                                : "text-orange-400"
                            }`}
                          />
                        </div>

                        {/* User Avatar */}
                        <div className="relative w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-2 border-2 border-gray-100 dark:border-gray-700 shadow-xs">
                          <FiUser size={24} className="text-gray-400 dark:text-gray-500" />
                          {index === 0 && (
                            <span className="absolute -bottom-1 bg-amber-400 text-gray-900 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xs">
                              Champion
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-full">
                          {seller.username || "Staff"}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-3">
                          {index === 0 ? "Gold Performer" : index === 1 ? "Silver Performer" : "Bronze Performer"}
                        </p>

                        {/* Performance Stats */}
                        <div className="w-full space-y-1.5 text-xs">
                          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-2.5 flex justify-between items-center border border-gray-100 dark:border-gray-700/60">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Total Revenue</span>
                            <span className="font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
                              ${Number(seller.order_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-2.5 flex justify-between items-center border border-gray-100 dark:border-gray-700/60">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Units Sold</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {Number(seller.quantity || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No best sellers data found for the selected date range.
                  </div>
                )}
              </div>
            </motion.div>

            {/* 6. TOP SELLING PRODUCTS + POPULAR STOCK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Top Sellers Table */}
              <SectionCard
                title="Top Selling Products"
                icon={RiTrophyLine}
                iconClass="text-amber-500"
                actionText="Full Ranking"
                actionLink="/top-items"
                loading={loadingTopSellingProducts}
              >
                <div className="space-y-2">
                  {topSellingProducts?.data?.length > 0 ? (
                    topSellingProducts.data.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition group">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 ${
                          idx === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                          : idx === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          : idx === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
                          : "bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-400"
                        }`}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.name || item.item_name || "—"}</p>
                          <p className="text-[10px] text-gray-400">Qty: {Number(item.quantity || item.qty || 0).toLocaleString()}</p>
                        </div>
                        <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
                          ${Number(item.price || item.total || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <RiTrophyLine className="mx-auto text-2xl mb-2 opacity-40" />
                      <p className="text-xs">No sales data yet</p>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Popular Stock Items with Progress Bars */}
              <SectionCard
                title="Popular Stock Items"
                icon={RiBox3Line}
                iconClass="text-emerald-500"
                actionText="View All Stock"
                actionLink="/inventories/stock-list"
                loading={loadingStock}
              >
                <div className="space-y-3">
                  {popularStock?.data?.length > 0 ? (
                    popularStock.data.slice(0, 5).map((item, idx) => {
                      const qty = Number(item.total_quantity || item.qty || 0);
                      const pct = Math.min(100, Math.round((qty / maxStockQty) * 100));
                      const barColor = pct > 60 ? "#10b981" : pct > 30 ? "#f59e0b" : "#ef4444";
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[60%]">
                              {item.name || item.item_name || "—"}
                            </span>
                            <span className="text-[11px] font-bold tabular-nums" style={{ color: barColor }}>
                              {qty.toLocaleString()} {item.scale || "units"}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: barColor }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <RiBox3Line className="mx-auto text-2xl mb-2 opacity-40" />
                      <p className="text-xs">No stock data yet</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* 7. RECENT CUSTOMERS TABLE (SHOW ONLY 5) */}
            <SectionCard
              title="Recent Customers"
              icon={RiUserStarLine}
              iconClass="text-cyan-500"
              actionText="View All Customers"
              actionLink="/home/customers"
              loading={loadingCustomers}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-700/40 text-gray-400 dark:text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-100 dark:border-gray-700/60">
                      <th className="px-3 py-2.5 font-bold">Customer Name</th>
                      <th className="px-3 py-2.5 font-bold">Contact Phone</th>
                      <th className="px-3 py-2.5 font-bold text-right">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {customersList.length > 0 ? (
                      customersList.map((customer) => {
                        const name = customer.customer_name || customer.name || "—";
                        const tel = customer.customer_tel || customer.tel || customer.phone || "—";
                        const location = customer.province || customer.district || customer.village || customer.address || "—";
                        return (
                          <tr key={customer.customer_id || customer.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                                  {name[0]?.toUpperCase() || "C"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 dark:text-white text-xs truncate">{name}</p>
                                  <p className="text-[10px] text-gray-400">ID: #{customer.customer_id || customer.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 font-medium tabular-nums">
                              {tel}
                            </td>
                            <td className="px-3 py-2.5 text-right text-gray-500 dark:text-gray-400 text-[11px] truncate max-w-[140px]">
                              {location}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-gray-400 text-xs">
                          No customer data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-6">

            {/* Mini Calendar */}
            <motion.div variants={itemVariants}>
              <div className="p-5 border rounded-2xl bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700/60 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Calendar</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <BsChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {monthNames[currentMonthDate.getMonth()].slice(0, 3)} {currentMonthDate.getFullYear()}
                    </span>
                    <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <BsChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 text-center mb-2">
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d, i) => (
                    <span key={i} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                  {calendarDays.map((item, idx) => {
                    const isToday =
                      item.isCurrentMonth &&
                      item.day === new Date().getDate() &&
                      currentMonthDate.getMonth() === new Date().getMonth() &&
                      currentMonthDate.getFullYear() === new Date().getFullYear();
                    return (
                      <div
                        key={idx}
                        className={`h-7 flex items-center justify-center rounded-full font-semibold cursor-pointer transition ${
                          !item.isCurrentMonth
                            ? "text-gray-300 dark:text-gray-600"
                            : isToday
                            ? "bg-cyan-600 text-white shadow font-extrabold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        {item.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Popular Sales Items */}
            <SectionCard
              title="Popular Orders"
              icon={RiBarChartBoxLine}
              iconClass="text-cyan-500"
              actionText="View Orders"
              actionLink="/order-list"
              loading={loadingSales}
            >
              <div className="space-y-2">
                {popularSales?.data?.length > 0 ? (
                  popularSales.data.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex-1 truncate">
                        {item.name || item.item_name || "—"}
                      </span>
                      <span className="text-[11px] font-extrabold text-gray-900 dark:text-white tabular-nums">
                        ×{Number(item.total_quantity || item.qty || 0).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-xs">No data yet</p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Market Share Donut */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <div className="h-full p-5 border rounded-2xl bg-white dark:bg-gray-800/90 border-gray-100 dark:border-gray-700/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{t("marketShare")}</h3>
                    <Link to="/report/sales_item" className="text-[10px] text-cyan-500 dark:text-cyan-400 font-semibold hover:underline">By Item →</Link>
                  </div>
                  <div className="h-44 flex items-center justify-center my-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={orderPersentMonthly?.data || []} innerRadius={45} outerRadius={68} paddingAngle={6} dataKey="persent" stroke="none">
                          {(orderPersentMonthly?.data || []).map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "12px", backgroundColor: "var(--chart-tooltip-bg)", color: "var(--chart-tooltip-color)", border: "1px solid var(--chart-border)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {orderPersentMonthly?.data?.slice(0, 4).map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-[10px] text-gray-500 font-semibold truncate max-w-[60px]">{entry.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{entry.persent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            {/* Popular Expenses */}
            <SectionCard
              title="Top Expense Categories"
              icon={RiWalletLine}
              iconClass="text-purple-500"
              actionText="All Expenses"
              actionLink="/home/expenses"
              loading={loadingExpenses}
            >
              <div className="space-y-3">
                {popularExpenses?.data?.length > 0 ? (
                  popularExpenses.data.slice(0, 5).map((item, idx) => {
                    const amt = Number(item.total_price || item.total || item.amount || 0);
                    const pct = Math.min(100, Math.round((amt / maxExpenseAmt) * 100));
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[55%]">
                            {item.description || item.expense_type || "—"}
                          </span>
                          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                            ${amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-purple-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <RiWalletLine className="mx-auto text-2xl mb-2 opacity-40" />
                    <p className="text-xs">No expense data yet</p>
                  </div>
                )}
              </div>
            </SectionCard>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
