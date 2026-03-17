import { useEffect, useState } from "react";
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
  PolarRadiusAxis,
} from "recharts";
import {
  useGetExpanseByDayQuery,
  useGetExpanseByHourQuery,
  useGetExpanseByMonthQuery,
  useGetExpanseByWeekQuery,
  useGetPurchaseByDayQuery,
  useGetPurchaseByHourQuery,
  useGetPurchaseByMonthQuery,
  useGetPurchaseByWeekQuery,
  useGetSaleByDayQuery,
  useGetSaleByHourQuery,
  useGetSaleByMonthQuery,
  useGetSaleByWeekQuery,
  useGetProfiteByDayQuery,
  useGetProfiteByHourQuery,
  useGetProfiteByMonthQuery,
  useGetProfiteByWeekQuery,
} from "../../../app/Features/dashboardsSlice";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { useGetPopularExpansesQuery } from "../../../app/Features/expensesSlice";
import {
  useGetPersentOrderMonthlyQuery,
  useGetPopularOrderQuery,
} from "../../../app/Features/ordersSlice";
import { useGetPopularStockQuery } from "../../../app/Features/stocksSlice";
import { useGetUserLoginQuery } from "../../../app/Features/usersSlice";
import { Link } from "react-router";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

const Dashboard = () => {
  const token = localStorage.getItem("token");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [timeRange, setTimeRange] = useState(["month", "week", "day", "hour"]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [purchaseChart, setPurchaseChart] = useState([]);
  const [expenseChart, setExpanseChart] = useState([]);
  const [profitChart, setProfitChart] = useState([]);
  const [profitByMonth, setProfitByMonth] = useState([]);
  const [profit, setProfit] = useState({ thisYear: 0, lastYear: 0, persent: 0 });
  const [purchases, setPurchases] = useState({ thisYear: 0, lastYear: 0, persent: 0 });
  const [sales, setSales] = useState({ thisYear: 0, lastYear: 0, persent: 0 });
  const [expenses, setExpanses] = useState({ thisYear: 0, lastYear: 0, persent: 0 });

  const { data: purchaseByMonth, isFetching: isFetchingPM } = useGetPurchaseByMonthQuery({ token, year });
  const { data: purchaseByWeek, isFetching: isFetchingPW } = useGetPurchaseByWeekQuery({ token, year });
  const { data: purchaseByDay, isFetching: isFetchingPD } = useGetPurchaseByDayQuery({ token, year });
  const { data: purchaseByHour, isFetching: isFetchingPH } = useGetPurchaseByHourQuery({ token, year });
  const { data: saleByMonth, isFetching: isFetchingSM } = useGetSaleByMonthQuery({ token, year });
  const { data: saleByWeek, isFetching: isFetchingSW } = useGetSaleByWeekQuery({ token, year });
  const { data: saleByDay, isFetching: isFetchingSD } = useGetSaleByDayQuery({ token, year });
  const { data: saleByHour, isFetching: isFetchingSH } = useGetSaleByHourQuery({ token, year });
  const { data: expenseByMonth, isFetching: isFetchingEM } = useGetExpanseByMonthQuery({ token, year });
  const { data: expenseByWeek, isFetching: isFetchingEW } = useGetExpanseByWeekQuery({ token, year });
  const { data: expenseByDay, isFetching: isFetchingED } = useGetExpanseByDayQuery({ token, year });
  const { data: expenseByHour, isFetching: isFetchingEH } = useGetExpanseByHourQuery({ token, year });

  const { data: profitByMonthApi, isFetching: isFetchingPrM } = useGetProfiteByMonthQuery({ token, year });
  const { data: profitByWeekApi, isFetching: isFetchingPrW } = useGetProfiteByWeekQuery({ token, year });
  const { data: profitByDayApi, isFetching: isFetchingPrD } = useGetProfiteByDayQuery({ token, year });
  const { data: profitByHourApi, isFetching: isFetchingPrH } = useGetProfiteByHourQuery({ token, year });

  const { data: popularExpanses } = useGetPopularExpansesQuery(token);
  const { data: popularSales } = useGetPopularOrderQuery(token);
  const { data: orderPersentMonthly } = useGetPersentOrderMonthlyQuery(token);
  const { data: popularStock } = useGetPopularStockQuery(token);
  const { data: userLogin, isLoading } = useGetUserLoginQuery(token);

  useEffect(() => {
    const pThis = purchaseByMonth?.data.reduce((i, c) => i + parseFloat(c.thisYearPrice), 0) || 0;
    const pLast = purchaseByMonth?.data.reduce((i, c) => i + parseFloat(c.lastYearPrice), 0) || 0;
    const sThis = saleByMonth?.data.reduce((i, c) => i + parseFloat(c.thisYearPrice), 0) || 0;
    const sLast = saleByMonth?.data.reduce((i, c) => i + parseFloat(c.lastYearPrice), 0) || 0;
    const eThis = expenseByMonth?.data.reduce((i, c) => i + parseFloat(c.thisYear), 0) || 0;
    const eLast = expenseByMonth?.data.reduce((i, c) => i + parseFloat(c.lastYear), 0) || 0;

    setPurchases({ thisYear: pThis, lastYear: pLast, persent: definePersents(pThis, pLast) });
    setSales({ thisYear: sThis, lastYear: sLast, persent: definePersents(sThis, sLast) });
    setExpanses({ thisYear: eThis, lastYear: eLast, persent: definePersents(eThis, eLast) });

    if (profitByMonthApi?.data) {
      const prThis = profitByMonthApi.data.reduce((i, c) => i + parseFloat(c.thisYear), 0) || 0;
      const prLast = profitByMonthApi.data.reduce((i, c) => i + parseFloat(c.lastYear), 0) || 0;
      setProfit({ thisYear: prThis, lastYear: prLast, persent: definePersents(prThis, prLast) });
    }
  }, [purchaseByMonth, saleByMonth, expenseByMonth, profitByMonthApi]);

  useEffect(() => {
    if (year !== currentYear) {
      setTimeRange(["month", "month", "month", "month"]);
    }
  }, [year]);

  useEffect(() => {
    const isCurrentYear = year === currentYear;

    const getRevenueData = () => {
      if (!isCurrentYear) return saleByMonth?.data || [];
      if (timeRange[1] === "hour") return saleByHour?.data || [];
      if (timeRange[1] === "day") return saleByDay?.data || [];
      if (timeRange[1] === "week") return saleByWeek?.data || [];
      return saleByMonth?.data || [];
    };

    const getPurchaseData = () => {
      if (!isCurrentYear) return purchaseByMonth?.data || [];
      if (timeRange[2] === "hour") return purchaseByHour?.data || [];
      if (timeRange[2] === "day") return purchaseByDay?.data || [];
      if (timeRange[2] === "week") return purchaseByWeek?.data || [];
      return purchaseByMonth?.data || [];
    };

    const getExpenseData = () => {
      if (!isCurrentYear) return expenseByMonth?.data || [];
      if (timeRange[3] === "hour") return expenseByHour?.data || [];
      if (timeRange[3] === "day") return expenseByDay?.data || [];
      if (timeRange[3] === "week") return expenseByWeek?.data || [];
      return expenseByMonth?.data || [];
    };

    const getProfitData = (range) => {
      if (range === "hour") return profitByHourApi?.data?.map(i => ({ name: i.name, current: i.today, previous: i.yesterday })) || [];
      if (range === "day") return profitByDayApi?.data?.map(i => ({ name: i.name, current: i.thisWeek, previous: i.Weekend })) || [];
      if (range === "week") return profitByWeekApi?.data?.map(i => ({ name: i.name, current: i.thisMonth, previous: i.lastMonth })) || [];
      return profitByMonthApi?.data?.map(i => ({ name: i.name, current: i.thisYear, previous: i.lastYear })) || [];
    };

    setRevenueChart(getRevenueData());
    setPurchaseChart(getPurchaseData());
    setExpanseChart(getExpenseData());

    if (profitByMonthApi?.data) {
      setProfitByMonth(profitByMonthApi.data);
    }

    setProfitChart(getProfitData(timeRange[0]));
  }, [
    year,
    currentYear,
    timeRange,
    saleByHour,
    saleByDay,
    saleByWeek,
    saleByMonth,
    purchaseByHour,
    purchaseByDay,
    purchaseByWeek,
    purchaseByMonth,
    expenseByHour,
    expenseByDay,
    expenseByWeek,
    expenseByMonth,
    profitByHourApi,
    profitByDayApi,
    profitByWeekApi,
    profitByMonthApi
  ]);

  const definePersents = (thisPeriod, lastPeriod) => {
    if (thisPeriod === lastPeriod) return 0;
    if (lastPeriod === 0) return 100;
    return (Math.abs((thisPeriod - lastPeriod) / lastPeriod) * 100).toFixed(1);
  };

  const handleTimeRangeChange = (index, range) => {
    const newRange = [...timeRange];
    newRange[index] = range;
    setTimeRange(newRange);

    if (index === 1) { // Revenue
      if (range === "hour") setRevenueChart(saleByHour?.data || []);
      else if (range === "day") setRevenueChart(saleByDay?.data || []);
      else if (range === "week") setRevenueChart(saleByWeek?.data || []);
      else if (range === "month") setRevenueChart(saleByMonth?.data || []);
    } else if (index === 2) { // Purchase
      if (range === "hour") setPurchaseChart(purchaseByHour?.data || []);
      else if (range === "day") setPurchaseChart(purchaseByDay?.data || []);
      else if (range === "week") setPurchaseChart(purchaseByWeek?.data || []);
      else if (range === "month") setPurchaseChart(purchaseByMonth?.data || []);
    } else if (index === 3) { // Expense
      if (range === "hour") setExpanseChart(expenseByHour?.data || []);
      else if (range === "day") setExpanseChart(expenseByDay?.data || []);
      else if (range === "week") setExpanseChart(expenseByWeek?.data || []);
      else if (range === "month") setExpanseChart(expenseByMonth?.data || []);
    } else if (index === 0) { // Profit
      if (range === "hour") setProfitChart(profitByHourApi?.data?.map(i => ({ name: i.name, current: i.today, previous: i.yesterday })) || []);
      else if (range === "day") setProfitChart(profitByDayApi?.data?.map(i => ({ name: i.name, current: i.thisWeek, previous: i.Weekend })) || []);
      else if (range === "week") setProfitChart(profitByWeekApi?.data?.map(i => ({ name: i.name, current: i.thisMonth, previous: i.lastMonth })) || []);
      else if (range === "month") setProfitChart(profitByMonthApi?.data?.map(i => ({ name: i.name, current: i.thisYear, previous: i.lastYear })) || []);
    }
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

  const MetricCard = ({ title, value, persent, isLoss, icon: Icon, colorClass, chartData, dataKey, chartColor, loading }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}><Icon size={24} /></div>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isLoss ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {isLoss ? <BsArrowDownRight /> : <BsArrowUpRight />} {persent}%
        </span>
      </div>
      <div className="h-16 -mx-6 -mb-6 overflow-hidden rounded-b-2xl">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area type="monotone" dataKey={dataKey} stroke={chartColor} fill={chartColor} fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const TimeToggle = ({ active, onChange, index }) => {
    const options = year === currentYear ? ["hour", "day", "week", "month"] : ["month"];
    return (
      <div className="flex bg-gray-100 p-1 rounded-xl">
        {options.map((r) => (
          <button
            key={r}
            onClick={() => onChange(index, r)}
            className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-all ${active === r ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {r}
          </button>
        ))}
      </div>
    );
  };

  const ChartArea = ({ title, children, loading, toggle }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {toggle}
      </div>
      {loading && (
        <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-2xl">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="h-80">{children}</div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Performance insights and real-time data</p>
        </div>
        <select
          className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-sm font-bold text-indigo-600"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[0, 1, 2, 3, 4, 5].map(i => <option key={currentYear - i} value={currentYear - i}>{currentYear - i}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Revenue" value={sales.thisYear} persent={sales.persent} isLoss={sales.thisYear < sales.lastYear} icon={RiShoppingCartFill} colorClass="bg-indigo-50 text-indigo-600" chartData={saleByMonth?.data} dataKey="thisYearPrice" chartColor="#6366f1" loading={isFetchingSM} />
        <MetricCard title="Purchases" value={purchases.thisYear} persent={purchases.persent} isLoss={purchases.thisYear > purchases.lastYear} icon={FaWarehouse} colorClass="bg-amber-50 text-amber-600" chartData={purchaseByMonth?.data} dataKey="thisYearPrice" chartColor="#f59e0b" loading={isFetchingPM} />
        <MetricCard title="Expenses" value={expenses.thisYear} persent={expenses.persent} isLoss={expenses.thisYear > expenses.lastYear} icon={RiMoneyDollarCircleFill} colorClass="bg-rose-50 text-rose-600" chartData={expenseByMonth?.data} dataKey="thisYear" chartColor="#f43f5e" loading={isFetchingEM} />
        <MetricCard title="Net Profit" value={profit.thisYear} persent={profit.persent} isLoss={profit.thisYear < profit.lastYear} icon={FaMoneyBillTrendUp} colorClass="bg-emerald-50 text-emerald-600" chartData={profitByMonth} dataKey="thisYear" chartColor="#10b981" loading={isFetchingSM || isFetchingPM || isFetchingEM} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ChartArea
            title="Profits Analytics"
            loading={isFetchingPrM || isFetchingPrW || isFetchingPrD || isFetchingPrH}
            toggle={<TimeToggle active={timeRange[0]} onChange={handleTimeRangeChange} index={0} />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                <Line type="monotone" dataKey="previous" name="Previous Period" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="current" name="Current Period" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartArea>

          <ChartArea
            title="Revenue Trends"
            loading={isFetchingSM || isFetchingSW || isFetchingSD || isFetchingSH}
            toggle={<TimeToggle active={timeRange[1]} onChange={handleTimeRangeChange} index={1} />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey={Object.keys(revenueChart[0] || {})[4]} name={Object.keys(revenueChart[0] || {})[4]} stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Area type="monotone" dataKey={Object.keys(revenueChart[0] || {})[2]} name={Object.keys(revenueChart[0] || {})[2]} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartArea>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Top Selling Items</h3>
            <div className="space-y-6">
              {popularSales?.data?.map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 p-1 border border-gray-100">
                    <img className="w-full h-full object-contain" src={s.image} alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{s.item_name}</h4>
                    <p className="text-xs text-gray-400">{s.brand_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${s.total_price}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">{s.total_quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Market Share</h3>
            <div className="flex justify-center mb-4">
              <PieChart width={160} height={160}>
                <Pie data={orderPersentMonthly?.data} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="persent">
                  {orderPersentMonthly?.data?.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
            <div className="space-y-2 text-left">
              {orderPersentMonthly?.data?.map((entry, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-500">{entry.name}</span>
                  <span className="font-bold">{entry.persent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
          <ChartArea
            title="Purchase Inventory"
            loading={isFetchingPM || isFetchingPW || isFetchingPD || isFetchingPH}
            toggle={<TimeToggle active={timeRange[2]} onChange={handleTimeRangeChange} index={2} />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchaseChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey={Object.keys(purchaseChart[0] || {})[2]} name={Object.keys(purchaseChart[0] || {})[2]} fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey={Object.keys(purchaseChart[0] || {})[4]} name={Object.keys(purchaseChart[0] || {})[4]} fill="#62eff0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartArea>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Stock In</h3>
          <div className="space-y-6">
            {popularStock?.data?.map((s, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <img className="w-6 h-6 object-contain" src={s.image} alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 truncate">{s.item_name}</h4>
                  <p className="text-xs text-gray-400">{s.brand_name}</p>
                </div>
                <div className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">+{s.total_quantity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
          <ChartArea
            title="Expense Analysis"
            loading={isFetchingEM || isFetchingEW || isFetchingED || isFetchingEH}
            toggle={<TimeToggle active={timeRange[3]} onChange={handleTimeRangeChange} index={3} />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={expenseChart}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Radar name={Object.keys(expenseChart[0] || {})[1]} dataKey={Object.keys(expenseChart[0] || {})[1]} stroke="#67bafe" fill="#67bafe" fillOpacity={0.4} />
                <Radar name={Object.keys(expenseChart[0] || {})[2]} dataKey={Object.keys(expenseChart[0] || {})[2]} stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartArea>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Major Expenses</h3>
          <div className="space-y-6">
            {popularExpanses?.data?.map((ex, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <RiMoneyDollarCircleFill size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 truncate">{ex.description}</h4>
                  <p className="text-xs text-rose-400">{ex.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rose-600">-${ex.total_price}</p>
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
