import React, { useEffect, useState } from 'react';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { DatePicker, Progress, Radio, Card, Select } from 'antd';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { useGetAllDashboardStockQuery, useGetDashboardStockByDateMutation } from '../../../app/Features/dashboardsSlice';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import BarChartStock from './BarChartStock';
import PieChartStock from './PieChartStock';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
export const stockChartContext = React.createContext();

const Analysis = () => {
  const { t } = useTranslation();
  const token = localStorage.getItem('token');
  const [apiData, setApiData] = useState({});
  const { data, refetch } = useGetAllDashboardStockQuery(token);
  const { data: usersData } = useGetAllUserQuery(token);
  const [getDashboardStockByDate, { data: dataByDate }] = useGetDashboardStockByDateMutation();

  const users = usersData?.data || [];

  useEffect(() => {
    refetch();
    setApiData(data);
  }, [data]);


  // State for date filter option
  const [dateFilter, setDateFilter] = useState('option1');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Card data mapping
  const cardData = [
    {
      title: t("stockReturn"),
      value: apiData?.data?.stock_return || 0,
      range: ((apiData?.data?.stock_return ?? 0) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      borderColor: "border-l-blue-500",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: t("stockIn"),
      value: apiData?.data?.stock_in || 0,
      range: ((apiData?.data?.stock_in ?? 0) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      bgColor: "bg-green-50 dark:bg-green-900/30",
      borderColor: "border-l-green-500",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      title: t("stockOut"),
      value: apiData?.data?.stock_out || 0,
      range: ((apiData?.data?.stock_out ?? 0) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      bgColor: "bg-red-50 dark:bg-red-900/30",
      borderColor: "border-l-red-500",
      textColor: "text-red-600 dark:text-red-400"
    },
    {
      title: t("stockSale"),
      value: apiData?.data?.stock_sale || 0,
      range: ((apiData?.data?.stock_sale ?? 0) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      borderColor: "border-l-purple-500",
      textColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: t("stockWaste"),
      value: apiData?.data?.stock_waste || 0,
      range: ((apiData?.data?.stock_waste ?? 0) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      bgColor: "bg-yellow-50 dark:bg-yellow-900/30",
      borderColor: "border-l-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-400"
    }
  ];

  const months = [
    t("january"), t("february"), t("march"), t("april"), t("may"), t("june"),
    t("july"), t("august"), t("september"), t("october"), t("november"), t("december")
  ];

  const applyFilters = async (updatedFilters = {}) => {
    const currentFilters = {
      month: selectedMonth,
      year: selectedYear,
      user_id: selectedUserId,
      start_date: dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null,
      end_date: dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null,
      ...updatedFilters
    };

    if (dateFilter === 'option1' && !currentFilters.user_id) {
      setApiData(data);
      return;
    }

    const payload = {};
    if (dateFilter === 'option2') {
      payload.month = currentFilters.month;
      payload.year = currentFilters.year;
    } else if (dateFilter === 'option3') {
      payload.start_date = currentFilters.start_date;
      payload.end_date = currentFilters.end_date;
    } else {
      payload.year = currentFilters.year;
    }

    if (currentFilters.user_id) {
      payload.user_id = currentFilters.user_id;
    }

    try {
      const res = await getDashboardStockByDate({ itemData: payload, token });
      if (res?.data) {
        setApiData(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleMonth = (date) => {
    if (!date) return;
    const m = date.month() + 1;
    const y = date.year();
    setMonth(months[m - 1]);
    setYear(y);
    setSelectedMonth(m);
    setSelectedYear(y);
    applyFilters({ month: m, year: y });
  };

  const handleRangeChange = (dates) => {
    setDateRange(dates || [null, null]);
    if (dates && dates[0] && dates[1]) {
      applyFilters({
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD')
      });
    }
  };

  const handleUserChange = (value) => {
    setSelectedUserId(value);
    applyFilters({ user_id: value });
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 70) return '#10B981'; // green
    if (percentage >= 40) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  return (
    <stockChartContext.Provider value={{ apiData }}>
      <div className="min-h-screen bg-transparent p-6 view-page">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t("stockAnalyticsDashboard")}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">{t("stockAnalyticsSubtitle")}</p>
            </div>

            {/* Date Filter Options */}
            <Card className="w-full lg:w-auto shadow-sm border-0 dark:!bg-gray-800 dark:!border-gray-700">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Radio.Group
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      if (e.target.value === 'option1') {
                        applyFilters({ start_date: null, end_date: null, month: null });
                      }
                    }}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="option1" className="text-sm dark:!bg-gray-700 dark:!text-white dark:!border-gray-600">
                      {t("allTime")}
                    </Radio.Button>
                    <Radio.Button value="option2" className="text-sm dark:!bg-gray-700 dark:!text-white dark:!border-gray-600">
                      {t("monthly")}
                    </Radio.Button>
                    <Radio.Button value="option3" className="text-sm dark:!bg-gray-700 dark:!text-white dark:!border-gray-600">
                      {t("customRange")}
                    </Radio.Button>
                  </Radio.Group>

                  <Select
                    placeholder={t("filterByUser")}
                    allowClear
                    className="w-full sm:w-48 dark:!bg-gray-900 dark:!text-white"
                    onChange={handleUserChange}
                    optionLabelProp='name'
                    options={users.map(u => ({ label: u.username, value: u.id }))}
                  />
                </div>

                {dateFilter === 'option2' && (
                  <div className="flex space-x-2">
                    <DatePicker
                      size={'middle'}
                      picker="month"
                      onChange={handleMonth}
                      className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                      placeholder={t("selectMonth")}
                    />
                  </div>
                )}

                {dateFilter === 'option3' && (
                  <div className="flex space-x-2">
                    <RangePicker
                      size={'middle'}
                      onChange={handleRangeChange}
                      className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            {cardData.map((card, index) => (
              <Card
                key={index}
                className="shadow-sm hover:shadow-md transition-all duration-300 border-0 overflow-hidden dark:!bg-gray-800  dark:!border-gray-700"
                bodyStyle={{ padding: '20px' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor} shadow-xs`}>
                    {card.icon}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{t("progress")}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{card.range.toFixed(1)}%</span>
                  </div>
                  <Progress
                    percent={card.range}
                    size="small"
                    showInfo={false}
                    strokeColor={getProgressColor(card.range)}
                    trailColor="#F3F4F6"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {card.range.toFixed(1)}% {t("ofTotalStockMovement")}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className='grid grid-cols-1 xl:grid-cols-5 gap-6'>
            {/* Stock Movement Chart */}
            <Card
              className="xl:col-span-3 shadow-sm border-0 dark:!bg-gray-800  dark:!border-gray-700"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t("stockMovementAnalysis")}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t("stockMovementSubtitle")}</p>
                </div>
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/40 rounded-full mt-2 sm:mt-0">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {dateFilter === 'option1'
                      ? `${t("year")} ${selectedYear}`
                      : dateFilter === 'option2'
                        ? `${month} ${year}`
                        : `${dateRange[0]?.format('DD MMM')} - ${dateRange[1]?.format('DD MMM YYYY') || ''}`}
                  </span>
                </div>
              </div>

              <div className="h-80 rounded-lg">
                <BarChartStock />
              </div>
            </Card>

            {/* Stock Distribution Chart */}
            <Card
              className="xl:col-span-2 shadow-sm border-0 dark:!bg-gray-800  dark:!border-gray-700"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t("stockDistribution")}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t("inventoryAllocationSubtitle")}</p>
                </div>
                <div className="px-3 py-1 bg-purple-50 dark:bg-purple-900/40 rounded-full mt-2 sm:mt-0">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {dateFilter === 'option1'
                      ? `${t("year")} ${selectedYear}`
                      : dateFilter === 'option2'
                        ? `${month} ${year}`
                        : `${dateRange[0]?.format('DD MMM')} - ${dateRange[1]?.format('DD MMM YYYY') || ''}`}
                  </span>
                </div>
              </div>

              <div className="h-80 flex items-center justify-center">
                <PieChartStock />
              </div>
            </Card>
          </div>

          {/* Additional Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card className="shadow-sm border-0 dark:!bg-gray-800  dark:!border-gray-700">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t("stockHealth")}</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">{t("good")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("optimalInventoryLevels")}</p>
              </div>
            </Card>

            <Card className="shadow-sm border-0 dark:!bg-gray-800  dark:!border-gray-700">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t("turnoverRate")}</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">2.4x</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("annualInventoryTurnover")}</p>
              </div>
            </Card>

            <Card className="shadow-sm border-0 dark:!bg-gray-800  dark:!border-gray-700">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t("avgProcessing")}</h3>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">2.1 {t("days")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("averageStockProcessingTime")}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </stockChartContext.Provider>
  );
};

export default Analysis;
