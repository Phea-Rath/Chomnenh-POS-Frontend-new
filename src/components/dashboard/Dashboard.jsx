import { useEffect, useState } from "react";
import { RiShoppingCartFill } from "react-icons/ri";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { FaWarehouse } from "react-icons/fa";
import { curveCardinal } from "d3-shape";
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
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Rectangle,
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
} from "../../../app/Features/dashboardsSlice";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { useGetPopularExpansesQuery } from "../../../app/Features/expansesSlice";
import {
  useGetPersentOrderMonthlyQuery,
  useGetPopularOrderQuery,
} from "../../../app/Features/ordersSlice";
import { useGetPopularStockQuery } from "../../../app/Features/stocksSlice";
import { useGetUserLoginQuery } from "../../../app/Features/usersSlice";
import { Link } from "react-router";
import { Button } from "antd";
const dataRadar = [
  {
    subject: "07:00 AM",
    today: 120,
    yesterday: 110,
    fullMark: 150,
  },
  {
    subject: "11:00 AM",
    today: 98,
    yesterday: 130,
    fullMark: 150,
  },
  {
    subject: "04:00 PM",
    today: 86,
    yesterday: 130,
    fullMark: 150,
  },
  {
    subject: "09:00 PM",
    today: 99,
    yesterday: 100,
    fullMark: 150,
  },
  {
    subject: "02:00 AM",
    today: 85,
    yesterday: 90,
    fullMark: 150,
  },
  {
    subject: "06:00 AM",
    today: 65,
    yesterday: 85,
    fullMark: 150,
  },
];

const dataArea = [
  {
    name: "Week 1",
    thisMonth: 4000,
    lastMonth: -2400,
  },
  {
    name: "Week 2",
    thisMonth: 1000,
    lastMonth: 1398,
  },
  {
    name: "Week 3",
    thisMonth: 2000,
    lastMonth: 9800,
  },
  {
    name: "Week 4",
    thisMonth: -2780,
    lastMonth: 3908,
  },
];
const dataAreaCard = [
  {
    name: "Week 1",
    thisMonth: 4000,
  },
  {
    name: "Week 2",
    thisMonth: 3000,
  },
  {
    name: "Week 3",
    thisMonth: 2000,
  },
  {
    name: "Week 4",
    thisMonth: 2780,
  },
  {
    name: "Week 5",
    thisMonth: 2780,
  },
];
const dataBar = [
  {
    name: "Day 1",
    thisWeek: 4000,
    Weekend: 2400,
  },
  {
    name: "Day 2",
    thisWeek: 3000,
    Weekend: 1398,
  },
  {
    name: "Day 3",
    thisWeek: 2000,
    Weekend: 9800,
  },
  {
    name: "Day 4",
    thisWeek: 2780,
    Weekend: 3908,
  },
  {
    name: "Day 5",
    thisWeek: 1890,
    Weekend: 4800,
  },
  {
    name: "Day 6",
    thisWeek: 2390,
    Weekend: 3800,
  },
  {
    name: "Day 7",
    thisWeek: 3490,
    Weekend: 4300,
  },
];

const popularExpanse = [
  {
    name: "Computer",
    type: "Electronic",
    price: 799,
    discription:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto laborum vel, doloribus commodi voluptas quod deserunt blanditiis exercitationem sunt non.",
  },
  {
    name: "Printer",
    type: "Electronic",
    price: 129,
    discription:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto laborum vel, doloribus commodi voluptas quod deserunt blanditiis exercitationem sunt non.",
  },
  {
    name: "Phone",
    type: "Electronic",
    price: 259,
    discription:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto laborum vel, doloribus commodi voluptas quod deserunt blanditiis exercitationem sunt non.",
  },
  {
    name: "Camera",
    type: "Electronic",
    price: 479,
    discription:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto laborum vel, doloribus commodi voluptas quod deserunt blanditiis exercitationem sunt non.",
  },
  {
    name: "Panasonic",
    type: "Electronic",
    price: 1599,
    discription:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto laborum vel, doloribus commodi voluptas quod deserunt blanditiis exercitationem sunt non.",
  },
];
const popularStockIn = [
  {
    img: "https://t4.ftcdn.net/jpg/04/39/60/05/360_F_439600528_2FWTMQDiXYv6T0qolS57KSxiNbqlhDTa.jpg",
    name: "Computer",
    category: "shoe",
    stock: 799,
  },
  {
    img: "https://t4.ftcdn.net/jpg/04/39/60/05/360_F_439600528_2FWTMQDiXYv6T0qolS57KSxiNbqlhDTa.jpg",
    name: "Printer",
    category: "shoe",
    stock: 129,
  },
  {
    img: "https://t4.ftcdn.net/jpg/04/39/60/05/360_F_439600528_2FWTMQDiXYv6T0qolS57KSxiNbqlhDTa.jpg",
    name: "Phone",
    category: "shoe",
    stock: 259,
  },
  {
    img: "https://t4.ftcdn.net/jpg/04/39/60/05/360_F_439600528_2FWTMQDiXYv6T0qolS57KSxiNbqlhDTa.jpg",
    name: "Camera",
    category: "shoe",
    stock: 479,
  },
  {
    img: "https://t4.ftcdn.net/jpg/04/39/60/05/360_F_439600528_2FWTMQDiXYv6T0qolS57KSxiNbqlhDTa.jpg",
    name: "Panasonic",
    category: "shoe",
    stock: 1599,
  },
];
const Dashboard = () => {
  const token = localStorage.getItem("token");
  const [timeRange, setTimeRange] = useState(["month", "week", "day", "hour"]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [purchaseChart, setPurchaseChart] = useState([]);
  const [expanseChart, setExpanseChart] = useState([]);
  const [profitChart, setProfitChart] = useState([]);
  const [profitByMonth, setProfitByMonth] = useState([]);
  const [profit, setProfit] = useState({
    thisYear: 0,
    lastYear: 0,
    persent: 0,
  });
  const [purchases, setPurchases] = useState({
    thisYear: 0,
    lastYear: 0,
    persent: 0,
  });
  const [sales, setSales] = useState({ thisYear: 0, lastYear: 0, persent: 0 });
  const [expanses, setExpanses] = useState({
    thisYear: 0,
    lastYear: 0,
    persent: 0,
  });

  const { data: purchaseByMonth } = useGetPurchaseByMonthQuery(token);
  const { data: purchaseByWeek } = useGetPurchaseByWeekQuery(token);
  const { data: purchaseByDay } = useGetPurchaseByDayQuery(token);
  const { data: purchaseByHour } = useGetPurchaseByHourQuery(token);
  const { data: saleByMonth } = useGetSaleByMonthQuery(token);
  const { data: saleByWeek } = useGetSaleByWeekQuery(token);
  const { data: saleByDay } = useGetSaleByDayQuery(token);
  const { data: saleByHour } = useGetSaleByHourQuery(token);
  const { data: expanseByMonth } = useGetExpanseByMonthQuery(token);
  const { data: expanseByWeek } = useGetExpanseByWeekQuery(token);
  const { data: expanseByDay } = useGetExpanseByDayQuery(token);
  const { data: expanseByHour } = useGetExpanseByHourQuery(token);
  const { data: popularExpanses } = useGetPopularExpansesQuery(token);
  const { data: popularSales } = useGetPopularOrderQuery(token);
  const { data: orderPersentMonthly } = useGetPersentOrderMonthlyQuery(token);
  const { data: popularStock } = useGetPopularStockQuery(token);
  const { data: userLogin, isLoading } = useGetUserLoginQuery(token);

  useEffect(() => {
    const purchaseThisYear =
      purchaseByMonth?.data.reduce(
        (initial, current) => initial + parseFloat(current.thisYearPrice),
        0
      ) || 0;
    const purchaseLastYear =
      purchaseByMonth?.data.reduce(
        (initial, current) => initial + parseFloat(current.lastYearPrice),
        0
      ) || 0;

    const saleThisYear =
      saleByMonth?.data.reduce(
        (initial, current) => initial + parseFloat(current.thisYearPrice),
        0
      ) || 0;
    const saleLastYear =
      saleByMonth?.data.reduce(
        (initial, current) => initial + parseFloat(current.lastYearPrice),
        0
      ) || 0;
    const expanseThisYear =
      expanseByMonth?.data.reduce(
        (initial, current) => initial + parseFloat(current.thisYear),
        0
      ) || 0;
    const expanseLastYear =
      expanseByMonth?.data.reduce(
        (initial, current) => initial + parseFloat(current.lastYear),
        0
      ) || 0;

    setPurchases({
      thisYear: purchaseThisYear,
      lastYear: purchaseLastYear,
      persent: definePersents(purchaseThisYear, purchaseLastYear),
    });
    setSales({
      thisYear: saleThisYear,
      lastYear: saleLastYear,
      persent: definePersents(saleThisYear, saleLastYear),
    });
    setExpanses({
      thisYear: expanseThisYear,
      lastYear: expanseLastYear,
      persent: definePersents(expanseThisYear, expanseLastYear),
    });
    setProfit({
      thisYear: saleThisYear - expanseThisYear - purchaseThisYear,
      lastYear: saleLastYear - expanseLastYear - purchaseLastYear,
      persent: definePersents(
        saleThisYear - expanseThisYear - purchaseThisYear,
        saleLastYear - expanseLastYear - purchaseLastYear
      ),
    });
  }, [purchaseByMonth, saleByMonth, profitByMonth, expanseByMonth]);

  useEffect(() => {
    setRevenueChart(saleByWeek?.data || []);
    setPurchaseChart(purchaseByDay?.data || []);
    setExpanseChart(expanseByHour?.data || []);
    if (expanseByMonth) {
      setProfitChart(() => {
        const profit =
          saleByMonth?.data.map((item, idx) => {
            const purchaseItem = purchaseByMonth?.data[idx];
            const expanseItem = expanseByMonth?.data[idx];
            return {
              name: item.name,
              thisYear:
                item.thisYearPrice -
                purchaseItem.thisYearPrice -
                expanseItem.thisYear,
              lastYear:
                item.lastYearPrice -
                (purchaseItem.lastYearPrice || 0) -
                (expanseItem.lastYear || 0),
            };
          }) || [];
        setProfitByMonth(profit);
        return profit;
      });
    }
  }, [
    saleByWeek,
    purchaseByDay,
    expanseByHour,
    expanseByMonth,
    purchaseByMonth,
    saleByMonth,
  ]);

  const definePersents = (thisYear, lastYear) => {
    if (thisYear === lastYear) return 0;
    if (lastYear === 0 || thisYear === 0) return 100;
    if (thisYear < lastYear) {
      return (((lastYear - thisYear) / lastYear) * 100).toFixed(2);
    }
    return (((thisYear - lastYear) / lastYear) * 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="mt-3 text-sm text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (userLogin?.data?.role_id === 1 && !isLoading) {
    return (
      <div className="max-w-lg mx-auto p-6">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Super Administrator</h1>
          <p className="text-gray-600">You have full access to system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 text-center border border-gray-100 shadow-xs">
            <div className="text-lg font-bold text-blue-600">Super Admin</div>
            <div className="text-xs text-gray-500">Role</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-100 shadow-xs">
            <div className="text-lg font-bold text-green-600">Full</div>
            <div className="text-xs text-gray-500">Access</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-100 shadow-xs">
            <div className="text-lg font-bold text-purple-600">All</div>
            <div className="text-xs text-gray-500">Features</div>
          </div>
        </div>

        {/* Settings Button */}
        <Link to="/dashboard/setting" className="block">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
            <button className="relative w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-6 py-4 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold">Open Settings</p>
                  <p className="text-xs opacity-90">Manage system configuration</p>
                </div>
              </div>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </Link>

        {/* Quick Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-800">Administrator Tips</p>
              <p className="text-xs text-gray-600 mt-1">Access advanced settings, user management, and system configurations from the settings panel.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lineData = [
    { name: "January", thisYear: 50, lastYear: 45 },
    { name: "February", thisYear: 40, lastYear: 30 },
    { name: "March", thisYear: 20, lastYear: 15 },
    { name: "April", thisYear: -50, lastYear: 45 },
    { name: "May", thisYear: 20, lastYear: 15 },
    { name: "June", thisYear: 25, lastYear: 20 },
    { name: "July", thisYear: 30, lastYear: 25 },
    { name: "August", thisYear: 40, lastYear: -30 },
    { name: "September", thisYear: 25, lastYear: 20 },
    { name: "October", thisYear: 50, lastYear: 45 },
    { name: "November", thisYear: 30, lastYear: 25 },
    { name: "December", thisYear: 35, lastYear: 30 },
  ];

  const pieData = [
    { name: "thisMonth", value: 63.2 },
    { name: "lastMonth", value: 30 },
  ];
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${((percent ?? 1) * 100).toFixed(0)}%`}
      </text>
    );
  };
  const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];

  const topReferrals = [
    { name: "GitHub", value: 19301 },
    { name: "Stack Overflow", value: 11201 },
    { name: "Hacker News", value: 9301 },
    { name: "Reddit", value: 8301 },
  ];

  const goalOverview = [
    {
      name: "Social Share",
      completions: 29,
      value: 120,
      conversion: 45,
      fill: "#FF8042",
    },
    {
      name: "EBook Download",
      completions: 19,
      value: 120,
      conversion: 43,
      fill: "#00C49F",
    },
  ];

  const upData = [
    { name: "1", value: 10 },
    { name: "2", value: 15 },
    { name: "3", value: 20 },
  ];

  const downData = [
    { name: "1", value: 20 },
    { name: "2", value: 15 },
    { name: "3", value: 10 },
  ];

  const handleTimeRangeChange = (index, range) => {
    const newTimeRange = [...timeRange];
    newTimeRange[index] = range;
    setTimeRange(newTimeRange);
    if (index === 1) {
      if (range === "hour") setRevenueChart(saleByHour?.data || []);
      else if (range === "day") setRevenueChart(saleByDay?.data || []);
      else if (range === "week") setRevenueChart(saleByWeek?.data || []);
      else if (range === "month") setRevenueChart(saleByMonth?.data || []);
    }
    if (index === 2) {
      if (range === "hour") setPurchaseChart(purchaseByHour?.data || []);
      else if (range === "day") setPurchaseChart(purchaseByDay?.data || []);
      else if (range === "week") setPurchaseChart(purchaseByWeek?.data || []);
      else if (range === "month") setPurchaseChart(purchaseByMonth?.data || []);
    }
    if (index === 3) {
      if (range === "hour") setExpanseChart(expanseByHour?.data || []);
      else if (range === "day") setExpanseChart(expanseByDay?.data || []);
      else if (range === "week") setExpanseChart(expanseByWeek?.data || []);
      else if (range === "month") setExpanseChart(expanseByMonth?.data || []);
    }
    if (index === 0) {
      // Profit chart
      if (range === "hour") {
        const profitData = saleByHour?.data.map((item, idx) => {
          const purchaseItem = purchaseByHour?.data[idx] || { todayPrice: 0 };
          const expanseItem = expanseByHour?.data[idx] || { today: 0 };
          return {
            name: item.name,
            today:
              item.todayPrice - purchaseItem.todayPrice - expanseItem.today,
            yesterday:
              item.yesterdayPrice -
              (purchaseItem.yesterdayPrice || 0) -
              (expanseItem.yesterday || 0),
          };
        });
        setProfitChart(profitData || []);
        console.log(profitData);
      }

      if (range === "day") {
        const profitData = saleByDay?.data.map((item, idx) => {
          const purchaseItem = purchaseByDay?.data[idx];
          const expanseItem = expanseByDay?.data[idx];
          return {
            name: item.name,
            thisWeek:
              item.thisWeekPrice -
              purchaseItem.thisWeekPrice -
              expanseItem.thisWeek,
            Weekend:
              item.WeekendPrice -
              (purchaseItem.WeekendPrice || 0) -
              (expanseItem.Weekend || 0),
          };
        });
        setProfitChart(profitData || []);
        console.log(profitData);
      }
      if (range === "week") {
        const profitData = saleByWeek?.data.map((item, idx) => {
          const purchaseItem = purchaseByWeek?.data[idx];
          const expanseItem = expanseByWeek?.data[idx];
          return {
            name: item.name,
            thisMonth:
              item.thisMonthPrice -
              purchaseItem.thisMonthPrice -
              expanseItem.thisMonth,
            lastMonth:
              item.lastMonthPrice -
              (purchaseItem.lastMonthPrice || 0) -
              (expanseItem.lastMonth || 0),
          };
        });
        setProfitChart(profitData || []);
        console.log(profitData);
      }
      if (range === "month") {
        const profitData = saleByMonth?.data.map((item, idx) => {
          const purchaseItem = purchaseByMonth?.data[idx];
          const expanseItem = expanseByMonth?.data[idx];
          return {
            name: item.name,
            thisYear:
              item.thisYearPrice -
              purchaseItem.thisYearPrice -
              expanseItem.thisYear,
            lastYear:
              item.lastYearPrice -
              (purchaseItem.lastYearPrice || 0) -
              (expanseItem.lastYear || 0),
          };
        });
        setProfitChart(profitData || []);
        console.log(profitData);
      }
    }
  };

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-purple-300/50 text-purple-500 rounded-tl-lg rounded-tr-lg shadow-sm">
          <div className="px-4 pt-2">
            <div className="flex justify-between items-center ">
              <h3 className="text-lg font-semibold">Revenue</h3>
              <RiShoppingCartFill className="text-5xl text-purple-500" />
            </div>
            <p className="text-xl flex items-end">
              ${(sales.thisYear || 0).toFixed(2)}
              {sales.thisYear < sales.lastYear ? (
                <span className="text-red-500 text-base flex items-center ml-2">
                  {sales.persent}% <BsArrowDownRight />
                </span>
              ) : (
                <span className="text-green-500 text-base flex items-center ml-2">
                  {sales.persent}% <BsArrowUpRight className="ml-2" />
                </span>
              )}
            </p>
          </div>
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={saleByMonth?.data || dataAreaCard}
                margin={{
                  top: 0,
                  right: 0,
                  left: 0,
                  bottom: 0,
                }}
              >
                <Area
                  type="monotone"
                  dataKey={`${Object.keys(saleByMonth?.data[0] || {})[1]}`}
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884df"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-yellow-300/50 text-yellow-500 rounded-tl-lg rounded-tr-lg shadow-sm">
          <div className="px-4 pt-2">
            <div className="flex justify-between items-center ">
              <h3 className="text-lg font-semibold">Purchases</h3>
              <FaWarehouse className="text-5xl text-yellow-500" />
            </div>
            <p className="text-xl flex items-end">
              ${(purchases.thisYear || 0).toFixed(2)}
              {purchases.thisYear < purchases.lastYear ? (
                <span className="text-red-500 text-base flex items-center ml-2">
                  {purchases.persent}% <BsArrowDownRight />
                </span>
              ) : (
                <span className="text-green-500 text-base flex items-center ml-2">
                  {purchases.persent}% <BsArrowUpRight className="ml-2" />
                </span>
              )}
            </p>
          </div>
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={purchaseByMonth?.data || dataAreaCard}
                margin={{
                  top: 0,
                  right: 0,
                  left: 0,
                  bottom: 0,
                }}
              >
                <Area
                  type="monotone"
                  dataKey={`${Object.keys(purchaseByMonth?.data[0] || {})[1]}`}
                  stackId="1"
                  stroke="#dab600"
                  fill="#e9d700"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Expanse card */}
        <div className="bg-red-300/50 text-red-500 rounded-tl-lg rounded-tr-lg shadow-sm">
          <div className="px-4 pt-2">
            <div className="flex justify-between items-center ">
              <h3 className="text-lg font-semibold">Expanses</h3>
              <RiMoneyDollarCircleFill className="text-5xl text-red-500" />
            </div>
            <p className="text-xl flex items-end">
              ${(expanses.thisYear || 0).toFixed(2)}
              {expanses.thisYear < expanses.lastYear ? (
                <span className="text-red-500 text-base flex items-center ml-2">
                  {expanses.persent}% <BsArrowDownRight />
                </span>
              ) : (
                <span className="text-green-500 text-base flex items-center ml-2">
                  {expanses.persent}% <BsArrowUpRight className="ml-2" />
                </span>
              )}
            </p>
          </div>
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={expanseByMonth?.data || dataAreaCard}
                margin={{
                  top: 0,
                  right: 0,
                  left: 0,
                  bottom: 0,
                }}
              >
                <Area
                  type="monotone"
                  dataKey={`${Object.keys(expanseByMonth?.data[0] || {})[1]}`}
                  stackId="1"
                  stroke="#ff4d00"
                  fill="#ff7400"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Profit card */}
        <div className="bg-green-300/50 text-green-500 rounded-tl-lg rounded-tr-lg shadow-sm">
          <div className="px-4 pt-2">
            <div className="flex justify-between items-center ">
              <h3 className="text-lg font-semibold">Profits</h3>
              <FaMoneyBillTrendUp className="text-5xl text-green-500" />
            </div>
            <p className="text-xl flex items-end">
              ${(profit.thisYear || 0).toFixed(2)}
              {profit.thisYear < profit.lastYear ? (
                <span className="text-red-500 text-base flex items-center ml-2">
                  {profit.persent}% <BsArrowDownRight />
                </span>
              ) : (
                <span className="text-green-500 text-base flex items-center ml-2">
                  {profit.persent}% <BsArrowUpRight className="ml-2" />
                </span>
              )}
            </p>
          </div>
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={profitByMonth}
                margin={{
                  top: 0,
                  right: 0,
                  left: 0,
                  bottom: 0,
                }}
              >
                {/* <CartesianGrid strokeDasharray="3 3" /> */}
                {/* <XAxis dataKey="name" />
                <YAxis /> */}
                {/* <Tooltip /> */}
                {/* <Legend /> */}
                <Area
                  type="monotone"
                  dataKey={`${Object.keys(profitByMonth[0] || {})[1]}`}
                  stackId="1"
                  stroke="#398564"
                  fill="#398564"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sessions and Devices */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div className="lg:col-span-2 bg-white p-4 pb-20 rounded-lg shadow-md h-96">
          <div className="flex justify-between mb-4">
            <div className="border-l-4 border-success flex-1 bg-gradient-to-r from-success/50 to-white px-3">
              <h3 className="text-lg font-semibold">Profits Line Chart</h3>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleTimeRangeChange(0, "hour")}
                className={`px-2 py-1 rounded ${timeRange[0] === "hour"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Hour
              </button>
              <button
                onClick={() => handleTimeRangeChange(0, "day")}
                className={`px-2 py-1 rounded ${timeRange[0] === "day"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Day
              </button>
              <button
                onClick={() => handleTimeRangeChange(0, "week")}
                className={`px-2 py-1 rounded ${timeRange[0] === "week"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Week
              </button>
              <button
                onClick={() => handleTimeRangeChange(0, "month")}
                className={`px-2 py-1 rounded ${timeRange[0] === "month"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Month
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={profitChart}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={`${Object.keys(profitChart[0] || {})[2]}`}
                stroke="#0088FE"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey={`${Object.keys(profitChart[0] || {})[1]}`}
                stroke="#FF0000"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-1 bg-white p-4 rounded-lg shadow">
          <div className="border-l-4 border-primary bg-gradient-to-r from-primary/50 to-white px-3">
            <h3 className="text-lg font-semibold">Popular Sale</h3>
          </div>
          <div className="mt-3 flex flex-col gap-4 p-2">
            {popularSales?.data?.map((s) => (
              <div className="flex justify-between items-center h-10">
                <div className="flex gap-2">
                  <img className="w-10" src={s.image} alt="" />
                  <div>
                    <h1 className="text-[15px] font-extrabold text-gray-600">
                      {s.item_name}
                    </h1>
                    <p className="text-info">{s.brand_name}</p>
                  </div>
                </div>
                <div className=" text-gray-500 line-clamp-2 text-ellipsis overflow-hidden">
                  Sold out {s.total_quantity} items
                </div>
                <p className="text-primary">${s.total_price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Sessions and Devices */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div className="lg:col-span-2 bg-white p-5 pb-20 rounded-lg shadow-md h-96">
          <div className="flex justify-between mb-4">
            <div className="border-l-4 border-success flex-1 bg-gradient-to-r from-success/50 to-white px-3">
              <h3 className="text-lg font-semibold">Revenue Area Chart</h3>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleTimeRangeChange(1, "hour")}
                className={`px-2 py-1 rounded ${timeRange[1] === "hour"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Hour
              </button>
              <button
                onClick={() => handleTimeRangeChange(1, "day")}
                className={`px-2 py-1 rounded ${timeRange[1] === "day"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Day
              </button>
              <button
                onClick={() => handleTimeRangeChange(1, "week")}
                className={`px-2 py-1 rounded ${timeRange[1] === "week"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Week
              </button>
              <button
                onClick={() => handleTimeRangeChange(1, "month")}
                className={`px-2 py-1 rounded ${timeRange[1] === "month"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Month
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              width={500}
              height={400}
              data={revenueChart}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={`${Object.keys(revenueChart[0] || {})[4]}`}
                // stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.4}
              />
              <Area
                type={curveCardinal.tension(0.2)}
                dataKey={`${Object.keys(revenueChart[0] || {})[2]}`}
                // stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-1 bg-white p-4 rounded-lg shadow">
          <div className="border-l-4 border-primary flex-1 bg-gradient-to-r from-primary/50 to-white px-3">
            <h3 className="text-lg font-semibold">Popular Revenue</h3>
          </div>
          <PieChart width={300} height={200}>
            <Pie
              data={orderPersentMonthly?.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="persent"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
          <div>
            {orderPersentMonthly?.data?.map((entry, index) => (
              <div className="flex justify-between text-gray-500 items-center mb-3">
                <div className="flex gap-2 items-center">
                  <div
                    style={{ background: COLORS[index % COLORS.length] }}
                    className={`w-2 h-2`}
                  />
                  {entry.name}
                </div>
                <div>
                  <p>{entry.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          {/* <p className="text-center mt-2 text-sm text-gray-500">Last Week: 8</p> */}
          {/* <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded">
            View Full Report
          </button> */}
        </div>
      </div>
      {/* Sessions and Devices */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div className="lg:col-span-2 bg-white p-5 pb-20 rounded-lg shadow-md h-96">
          <div className="flex justify-between mb-4">
            <div className="border-l-4 border-success flex-1 bg-gradient-to-r from-success/50 to-white px-3">
              <h3 className="text-lg font-semibold">Purchases Bar Chart</h3>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleTimeRangeChange(2, "hour")}
                className={`px-2 py-1 rounded ${timeRange[2] === "hour"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Hour
              </button>
              <button
                onClick={() => handleTimeRangeChange(2, "day")}
                className={`px-2 py-1 rounded ${timeRange[2] === "day"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Day
              </button>
              <button
                onClick={() => handleTimeRangeChange(2, "week")}
                className={`px-2 py-1 rounded ${timeRange[2] === "week"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Week
              </button>
              <button
                onClick={() => handleTimeRangeChange(2, "month")}
                className={`px-2 py-1 rounded ${timeRange[2] === "month"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Month
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              width={500}
              height={300}
              data={purchaseChart}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={`${Object.keys(purchaseChart[0] || {})[2]}`}
                fill="#8884d8"
                activeBar={<Rectangle fill="pink" stroke="blue" />}
              />
              <Bar
                dataKey={`${Object.keys(purchaseChart[0] || {})[4]}`}
                fill="#82ca9d"
                activeBar={<Rectangle fill="gold" stroke="purple" />}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-1 bg-white p-4 rounded-lg shadow">
          <div className="border-l-4 border-primary flex-1 bg-gradient-to-r from-primary/50 to-white px-3">
            <h3 className="text-lg font-semibold">Popular Stock In</h3>
          </div>
          <div className="mt-3 flex flex-col gap-3 p-2">
            {popularStock?.data?.map((s) => (
              <div className="flex justify-between items-center h-10">
                <div className="flex gap-2">
                  <img className="w-10" src={s.image} alt="" />
                  <div>
                    <h1 className="text-[15px] font-extrabold text-gray-600">
                      {s.item_name}
                    </h1>
                    <p className="text-info">{s.brand_name}</p>
                  </div>
                </div>
                <p className="text-success">+{s.total_quantity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Sessions and Devices */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div className="lg:col-span-2 bg-white p-5 pb-20 rounded-lg shadow-md h-96">
          <div className="flex justify-between mb-4">
            <div className="border-l-4 border-success flex-1 bg-gradient-to-r from-success/50 to-white px-3">
              <h3 className="text-lg font-semibold">Expanse Redar Chart</h3>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleTimeRangeChange(3, "hour")}
                className={`px-2 py-1 rounded ${timeRange[3] === "hour"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Hour
              </button>
              <button
                onClick={() => handleTimeRangeChange(3, "day")}
                className={`px-2 py-1 rounded ${timeRange[3] === "day"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Day
              </button>
              <button
                onClick={() => handleTimeRangeChange(3, "week")}
                className={`px-2 py-1 rounded ${timeRange[3] === "week"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Week
              </button>
              <button
                onClick={() => handleTimeRangeChange(3, "month")}
                className={`px-2 py-1 rounded ${timeRange[3] === "month"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                Month
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={expanseChart}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 150]} />
              <Tooltip />
              <Radar
                name={`${Object.keys(expanseChart[0] || {})[1]}`}
                dataKey={`${Object.keys(expanseChart[0] || {})[1]}`}
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name={`${Object.keys(expanseChart[0] || {})[2]}`}
                dataKey={`${Object.keys(expanseChart[0] || {})[2]}`}
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-1 bg-white p-4 rounded-lg shadow">
          <div className="border-l-4 border-primary flex-1 bg-gradient-to-r from-primary/50 to-white px-3">
            <h3 className="text-lg font-semibold">Popular Expanse Sale</h3>
          </div>
          <div className="mt-3 flex flex-col gap-3 p-2">
            {popularExpanses?.data?.map((ex) => (
              <div className="flex gap-5 items-center h-10">
                <div>
                  <h1 className="text-[15px] font-extrabold text-gray-600">
                    {ex.description}
                  </h1>
                  <p className="text-green-500">{ex.type}</p>
                </div>
                <div className="flex-1 text-gray-500 line-clamp-2 text-ellipsis overflow-hidden">
                  {ex.quantity} Items
                </div>
                <p className="text-red-600">-${ex.total_price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Top Referrals</h3>
          {topReferrals.map((item, index) => (
            <div key={index} className="flex justify-between py-2">
              <span>{item.name}</span>
              <span>{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Goal Overview</h3>
          {goalOverview.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 py-2 text-sm">
              <span>{item.name}</span>
              <span>{item.completions} Completions</span>
              <span>${item.value} Value</span>
              <div className="flex items-center">
                <RadialBarChart
                  width={50}
                  height={50}
                  innerRadius="80%"
                  outerRadius="100%"
                  startAngle={180}
                  endAngle={0}
                  data={[
                    { name: "conv", value: item.conversion, fill: item.fill },
                  ]}
                >
                  <RadialBar
                    minAngle={15}
                    background={{ fill: "#eee" }}
                    clockWise
                    dataKey="value"
                  />
                </RadialBarChart>
                <span className="ml-2">{item.conversion}% Conversion Rate</span>
              </div>
            </div>
          ))}
        </div> */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">My Location</h3>
          <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d244.29654544766856!2d104.8630581441245!3d11.570148836088025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1skm!2skh!4v1760429899901!5m2!1skm!2skh"
              width="100%"
              height="100%"
              // style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
