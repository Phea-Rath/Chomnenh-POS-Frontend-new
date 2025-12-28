import React, { useEffect, useState } from 'react';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { DatePicker, Progress, Radio, Card } from 'antd';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { useGetAllDashboardStockQuery, useGetDashboardStockByDateMutation } from '../../../app/Features/dashboardsSlice';
import BarChartStock from './BarChartStock';
import PieChartStock from './PieChartStock';

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
  const token = localStorage.getItem('token');
  const [apiData, setApiData] = useState({});
  const { data, refetch } = useGetAllDashboardStockQuery(token);
  const [getDashboardStockByDate, { data: dataByDate }] = useGetDashboardStockByDateMutation();

  useEffect(() => {
    refetch();
    setApiData(data);
  }, [data])

  // State for date filter option
  const [dateFilter, setDateFilter] = useState('option1');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Card data mapping
  const cardData = [
    {
      title: "Stock Return",
      value: apiData?.data?.stock_return || 0,
      range: ((apiData?.data?.stock_return ?? 1) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      bgColor: "bg-blue-50",
      borderColor: "border-l-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Stock In",
      value: apiData?.data?.stock_in || 0,
      range: ((apiData?.data?.stock_in ?? 1) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      bgColor: "bg-green-50",
      borderColor: "border-l-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Stock Out",
      value: apiData?.data?.stock_out || 0,
      range: ((apiData?.data?.stock_out ?? 1) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      bgColor: "bg-red-50",
      borderColor: "border-l-red-500",
      textColor: "text-red-600"
    },
    {
      title: "Stock Sale",
      value: apiData?.data?.stock_sale || 0,
      range: ((apiData?.data?.stock_sale ?? 1) / (apiData?.data?.stock_total ?? 1)) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      bgColor: "bg-purple-50",
      borderColor: "border-l-purple-500",
      textColor: "text-purple-600"
    },
    {
      title: "Stock Waste",
      value: apiData?.data?.stock_waste || 0,
      range: (apiData?.data?.stock_waste ?? 1) / (apiData?.data?.stock_total ?? 1) * 100,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      bgColor: "bg-yellow-50",
      borderColor: "border-l-yellow-500",
      textColor: "text-yellow-600"
    }
  ];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonth = async (date) => {
    if (!date) return;

    const selectedMonth = date.month() + 1;
    const selectedYear = date.year();
    setMonth(months[selectedMonth - 1]);
    setYear(selectedYear);
    setSelectedMonth(selectedMonth);
    setSelectedYear(selectedYear);

    try {
      const res = await getDashboardStockByDate({ itemData: { month: selectedMonth, year: selectedYear }, token });
      if (res?.data) {
        setApiData(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 70) return '#10B981'; // green
    if (percentage >= 40) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  return (
    <stockChartContext.Provider value={{ apiData }}>
      <div className="min-h-screen bg-gray-50/50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Analytics Dashboard</h1>
              <p className="text-gray-600 text-lg">Comprehensive overview of your inventory metrics and performance</p>
            </div>

            {/* Date Filter Options */}
            <Card className="w-full lg:w-auto shadow-sm border-0">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-6">
                  <Radio.Group
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      if (e.target.value === 'option1') {
                        setApiData(data);
                      }
                    }}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="option1" className="text-sm">
                      All Time
                    </Radio.Button>
                    <Radio.Button value="option2" className="text-sm">
                      Monthly
                    </Radio.Button>
                  </Radio.Group>
                </div>

                {dateFilter === 'option2' && (
                  <div className="flex space-x-2">
                    <DatePicker
                      size={'middle'}
                      picker="month"
                      onChange={handleMonth}
                      className="w-full"
                      placeholder="Select month"
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
                className="shadow-sm hover:shadow-md transition-all duration-300 border-0 overflow-hidden"
                bodyStyle={{ padding: '20px' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor} shadow-xs`}>
                    {card.icon}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-700">{card.range.toFixed(1)}%</span>
                  </div>
                  <Progress
                    percent={card.range}
                    size="small"
                    showInfo={false}
                    strokeColor={getProgressColor(card.range)}
                    trailColor="#F3F4F6"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {card.range.toFixed(1)}% of total stock movement
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className='grid grid-cols-1 xl:grid-cols-5 gap-6'>
            {/* Stock Movement Chart */}
            <Card
              className="xl:col-span-3 shadow-sm border-0"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Stock Movement Analysis</h2>
                  <p className="text-gray-600 text-sm">Monthly stock flow and transaction patterns</p>
                </div>
                <div className="px-3 py-1 bg-blue-50 rounded-full mt-2 sm:mt-0">
                  <span className="text-sm font-medium text-blue-700">
                    {dateFilter === 'option1'
                      ? `Year ${selectedYear}`
                      : `${month} ${year}`}
                  </span>
                </div>
              </div>

              <div className="h-80 rounded-lg">
                <BarChartStock />
              </div>
            </Card>

            {/* Stock Distribution Chart */}
            <Card
              className="xl:col-span-2 shadow-sm border-0"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Stock Distribution</h2>
                  <p className="text-gray-600 text-sm">Inventory allocation across categories</p>
                </div>
                <div className="px-3 py-1 bg-purple-50 rounded-full mt-2 sm:mt-0">
                  <span className="text-sm font-medium text-purple-700">
                    {dateFilter === 'option1'
                      ? `Year ${selectedYear}`
                      : `${month} ${year}`}
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
            <Card className="shadow-sm border-0">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Stock Health</h3>
                <p className="text-2xl font-bold text-green-600 mb-2">Good</p>
                <p className="text-sm text-gray-500">Optimal inventory levels maintained</p>
              </div>
            </Card>

            <Card className="shadow-sm border-0">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Turnover Rate</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">2.4x</p>
                <p className="text-sm text-gray-500">Annual inventory turnover</p>
              </div>
            </Card>

            <Card className="shadow-sm border-0">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Avg. Processing</h3>
                <p className="text-2xl font-bold text-orange-600 mb-2">2.1 Days</p>
                <p className="text-sm text-gray-500">Average stock processing time</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </stockChartContext.Provider>
  );
};

export default Analysis;