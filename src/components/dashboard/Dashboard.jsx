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

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

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

const MetricCard = ({ title, value, persent, isLoss, icon: Icon, colorClass, chartData, chartColor, loading }) => (
  <div className="bg-primary p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md relative overflow-hidden">
    {loading && (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 bg-primary/40">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )}
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}><Icon size={24} /></div>
    </div>
    <div className="flex items-center gap-2 mb-6">
      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isLoss ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
        {isLoss ? <BsArrowDownRight /> : <BsArrowUpRight />} {persent}%
      </span>
    </div>
    <div className="h-16 -mx-6 -mb-6 overflow-hidden rounded-b-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area type="monotone" dataKey="value" stroke={chartColor} fill={chartColor} fillOpacity={0.1} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ChartArea = ({ title, children, loading }) => (
  <div className="bg-white bg-primary p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative">
    <div className="flex justify-between items-center mb-8">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {loading && (
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/40 bg-primary/40">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )}
    <div className="h-80">{children}</div>
  </div>
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
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 mb-6">
            <RiShoppingCartFill size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">System Administrator</h1>
          <p className="text-gray-500 mb-8">Full administrative control active.</p>
          <Link to="/setting" className="inline-flex items-center justify-between bg-indigo-600 text-white rounded-2xl px-8 py-5 shadow-lg hover:bg-indigo-700 transition-all">
            <span className="font-bold text-lg">System Settings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-screen">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("dashboard")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("performanceInsights")}</p>
        </div>
        <div className="flex items-center gap-3">
          
          <RefreshButton onRefresh={() => {saleQuery.refetch();purchaseQuery.refetch();expenseQuery.refetch();profitQuery.refetch();}} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-primary px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
            />
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-primary px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
            />
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="bg-primary px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
            >
              <option value="">All Users</option>
              {usersData?.data?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title={t("revenue")} value={sales.thisPeriod} persent={sales.persent} isLoss={sales.thisPeriod < sales.lastPeriod} icon={RiShoppingCartFill} colorClass="bg-indigo-50 text-indigo-600" chartData={revenueChart} chartColor="#6366f1" loading={saleQuery.isFetching || previousSaleQuery.isFetching} />
        <MetricCard title={t("purchases")} value={purchases.thisPeriod} persent={purchases.persent} isLoss={purchases.thisPeriod > purchases.lastPeriod} icon={FaWarehouse} colorClass="bg-amber-50 text-amber-600" chartData={purchaseChart} chartColor="#f59e0b" loading={purchaseQuery.isFetching || previousPurchaseQuery.isFetching} />
        <MetricCard title={t("expenses")} value={expenses.thisPeriod} persent={expenses.persent} isLoss={expenses.thisPeriod > expenses.lastPeriod} icon={RiMoneyDollarCircleFill} colorClass="bg-rose-50 text-rose-600" chartData={expenseChart} chartColor="#f43f5e" loading={expenseQuery.isFetching || previousExpenseQuery.isFetching} />
        <MetricCard title={t("netProfit")} value={profit.thisPeriod} persent={profit.persent} isLoss={profit.thisPeriod < profit.lastPeriod} icon={FaMoneyBillTrendUp} colorClass="bg-emerald-50 text-emerald-600" chartData={profitChart} chartColor="#10b981" loading={profitQuery.isFetching || previousProfitQuery.isFetching} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ChartArea title={t("profitAnalytics")} loading={profitQuery.isFetching}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backgroundColor: "#fff" }} />
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                <Line type="monotone" dataKey="value" name="Profit" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1" }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartArea>

          <ChartArea title={t("revenueTrends")} loading={saleQuery.isFetching}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backgroundColor: "#fff" }} />
                <Area type="monotone" dataKey="value" name="Revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Area type="monotone" dataKey="quantity" name="Quantity" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.08} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartArea>
        </div>

        <div className="space-y-8">
          <div className="bg-white bg-primary p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t("topSellingItems")}</h3>
            <div className="space-y-6">
              {popularSales?.data?.map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl p-1 border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    <img className="w-full h-full object-contain" src={s.image} alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{s.item_name}</h4>
                    <p className="text-xs text-gray-400">{s.brand_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">${s.total_price}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">{s.total_quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white bg-primary p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("marketShare")}</h3>
            <div className="flex justify-center mb-4">
              <PieChart width={160} height={160}>
                <Pie data={orderPersentMonthly?.data || []} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="persent">
                  {(orderPersentMonthly?.data || []).map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
            <div className="space-y-2 text-left">
              {orderPersentMonthly?.data?.map((entry, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
                  <span className="font-bold">{entry.persent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2  relative">
          <ChartArea title={t("purchaseInventory")} loading={purchaseQuery.isFetching}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchaseChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", backgroundColor: "#fff" }} />
                <Bar dataKey="quantity" name="Quantity" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="value" name="Price" fill="#62eff0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartArea>
        </div>
        <div className="bg-primary p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t("recentStockIn")}</h3>
          <div className="space-y-6">
            {popularStock?.data?.map((s, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-900">
                  <img className="w-6 h-6 object-contain" src={s.image} alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{s.item_name}</h4>
                  <p className="text-xs text-gray-400">{s.brand_name}</p>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-900 px-2 py-1 rounded-lg">+{s.total_quantity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className=" relative">
          <ChartArea title={t("expenseAnalysis")} loading={expenseQuery.isFetching}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={expenseChart}>
                <PolarGrid stroke="#f0f0f0" className="dark:stroke-gray-700" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Radar name="Price" dataKey="value" stroke="#67bafe" fill="#67bafe" fillOpacity={0.4} />
                <Radar name="Quantity" dataKey="quantity" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartArea>
        </div>
        <div className="bg-primary p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t("majorExpenses")}</h3>
          <div className="space-y-6">
            {popularExpanses?.data?.map((ex, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-300">
                  <RiMoneyDollarCircleFill size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{ex.description}</h4>
                  <p className="text-xs text-rose-400 dark:text-rose-300">{ex.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">-${ex.total_price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
