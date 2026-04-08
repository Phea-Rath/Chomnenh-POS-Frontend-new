import React, { useEffect, useState } from "react";
import {
    LuTrendingUp,
    LuDollarSign,
    LuPackage,
    LuTruck,
    LuArrowDown,
    LuArrowUp,
    LuCalendar,
    LuRefreshCw,
    LuDownload
} from "react-icons/lu";
import { Card, Table, Button, Statistic, Row, Col, Select, DatePicker, Tooltip, Grid } from "antd";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import api from "../../services/api";
import { useReportText } from "./reportText";
import { useOutletsContext } from "../../layouts/Management";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ProfitAnalysis = () => {
    const { rt } = useReportText();
    const { darkMode } = useOutletsContext();
    const screens = useBreakpoint();
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [dateRange, setDateRange] = useState([dayjs().startOf('year'), dayjs().endOf('year')]);
    const [selectedWarehouse, setSelectedWarehouse] = useState("all");
    const [warehouses, setWarehouses] = useState([]);

    const getDateFilterPayload = () => {
        const [start, end] = dateRange || [];
        return {
            start_date: start ? dayjs(start).format("YYYY-MM-DD") : null,
            end_date: end ? dayjs(end).format("YYYY-MM-DD") : null,
        };
    };

    const fetchProfitData = async (payload) => {
        try {
            const response = await api.post("/analysis_profit", payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            if (response.status === 200 && response.data) {
                // Transform data to match our structure
                const data = response.data.data || response.data;
                setSummaryData({
                    cost_return: parseFloat(data.cost_return || 0),
                    cost_return_kh: parseFloat(data.cost_return_kh || 0),
                    cost_in: parseFloat(data.cost_in || 0),
                    cost_in_kh: parseFloat(data.cost_in_kh || 0),
                    total_expense_cost: parseFloat(data.total_expense_cost || 0),
                    total_expense_cost_kh: parseFloat(data.total_expense_cost_kh || 0),
                    order_amount: parseFloat(data.order_amount || 0),
                    order_amount_kh: parseFloat(data.order_amount_kh || 0),
                    cost_used: parseFloat(data.cost_used || 0),
                    cost_used_kh: parseFloat(data.cost_used_kh || 0),
                    total_cost: parseFloat(data.total_cost || 0),
                    total_cost_kh: parseFloat(data.total_cost_kh || 0),
                    profit: parseFloat(data.profit || 0),
                    profit_kh: parseFloat(data.profit_kh || 0),
                });
            }
        } catch (error) {
            console.error("Error fetching profit data:", error);
            toast.error("Failed to load profit analysis data");
        }
    };

    const fetchMonthlyData = async (payload) => {
        try {
            const response = await api.post("/analysis_profit_chart", payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            if (response.status === 200 && response.data) {
                const data = response.data.data || response.data;
                setMonthlyData(
                    Array.isArray(data)
                        ? data.map((item) => ({
                            month: item.month,
                            revenue: parseFloat(item.revenue || 0),
                            cost: parseFloat(item.cost || 0),
                            profit: parseFloat(item.profit || 0),
                        }))
                        : []
                );
            }
        } catch (error) {
            console.error("Error fetching profit data:", error);
            toast.error("Failed to load profit analysis data");
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        const payload = getDateFilterPayload();
        try {
            await Promise.all([fetchProfitData(payload), fetchMonthlyData(payload)]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [dateRange]);

    // Format currency in USD
    const formatUSD = (value) => {
        return `$${value.toFixed(2)}`;
    };

    // Format currency in KHR
    const formatKHR = (value) => {
        return `${value.toLocaleString('en-US')} ៛`;
    };

    // Format large numbers
    const formatNumber = (value) => {
        return value.toLocaleString('en-US');
    };

    // Calculate derived metrics


    const totalMargin = () => {
        if (!summaryData || summaryData.order_amount === 0) return 0;
        return (summaryData?.profit / summaryData.order_amount) * 100;
    };

    const margin = totalMargin();

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    // Table columns for monthly profit
    const monthlyColumns = [
        {
            title: rt('Date'),
            dataIndex: 'month',
            key: 'month',
            render: (text) => dayjs(text).format('MMM DD, YYYY'),
        },
        {
            title: rt('Revenue ($)'),
            dataIndex: 'revenue',
            key: 'revenue',
            render: (value) => formatUSD(value),
        },
        {
            title: rt('Cost ($)'),
            dataIndex: 'cost',
            key: 'cost',
            render: (value) => formatUSD(value),
        },
        {
            title: rt('Profit ($)'),
            dataIndex: 'profit',
            key: 'profit',
            render: (value) => (
                <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatUSD(value)}
                </span>
            ),
        },
        {
            title: rt('Margin (%)'),
            key: 'margin',
            render: (_, record) => {
                if (record.revenue === 0) return '0%';
                const margin = ((record.revenue - record.cost) / record.revenue * 100).toFixed(1);
                return `${margin}%`;
            },
        },
    ];

    // Export to Excel
    const handleExportExcel = () => {
        if (!summaryData) return;

        const workbook = XLSX.utils.book_new();

        // Summary Sheet
        const summarySheetData = [
            ['Profit Analysis Summary'],
            ['Metric', 'USD', 'KHR'],
            ['Cost In', formatUSD(summaryData.cost_in), formatKHR(summaryData.cost_in_kh)],
            ['Order Amount', formatUSD(summaryData.order_amount), formatKHR(summaryData.order_amount_kh)],
            ['Cost Used', formatUSD(summaryData.cost_used), formatKHR(summaryData.cost_used_kh)],
            ['Total Expense', formatUSD(summaryData.total_expense_cost), formatKHR(summaryData.total_expense_cost_kh)],
            ['Cost Return', formatUSD(summaryData.cost_return), formatKHR(summaryData.cost_return_kh)],
            ['Calculate Cost', formatUSD(summaryData.total_cost), formatKHR(summaryData.total_cost_kh)],
            ['Net Profit', formatUSD(summaryData.profit), formatKHR(summaryData.profit_kh)],
            ['Profit Margin', `${margin.toFixed(1)}%`, ''],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Monthly Sheet
        const monthlySheetData = [
            ['Date', 'Revenue ($)', 'Cost ($)', 'Profit ($)', 'Margin (%)'],
            ...monthlyData.map(item => [
                dayjs(item.month).format('YYYY-MM-DD'),
                item.revenue,
                item.cost,
                item.profit,
                item.revenue ? ((item.revenue - item.cost) / item.revenue * 100).toFixed(1) : 0,
            ]),
        ];
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlySheetData);
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Profit');

        XLSX.writeFile(workbook, `profit_analysis_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    // Refresh data
    const handleRefresh = () => {
        fetchAllData();
    };

    const handleDateRangeChange = (dates) => {
        if (!dates || dates.length !== 2) {
            setDateRange([dayjs().startOf('year'), dayjs().endOf('year')]);
            return;
        }
        setDateRange(dates);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:!bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:!text-gray-400">{rt("Loading profit analysis data...")}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="report-page min-h-screen bg-transparent p-4 md:p-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                        <LuTrendingUp className="text-xl md:text-2xl text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:!text-white">
                            {rt("Profit Analysis")}
                        </h1>
                        <p className="text-gray-600 dark:!text-gray-400 text-sm md:text-base">
                            {rt("Track profits and expenses")}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        icon={<LuRefreshCw />}
                        onClick={handleRefresh}
                        className="flex items-center dark:!bg-gray-700 dark:!text-white dark:!border-gray-600"
                    >
                        {rt("Refresh")}
                    </Button>
                    <Button
                        type="primary"
                        icon={<LuDownload />}
                        onClick={handleExportExcel}
                        className="bg-green-500 hover:bg-green-600 border-0"
                    >
                        {rt("Export Excel")}
                    </Button>
                </div>
            </div>
            <div className="flex gap-2 mb-3">
                <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    className="w-auto dark:!bg-gray-700 dark:!text-white dark:!border-gray-600"
                    size={screens.md ? 'middle' : 'small'}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white dark:!from-gray-800 dark:!to-gray-800 dark:!text-white">
                        <Statistic
                            title={<span className="text-gray-600 dark:!text-gray-300">{rt("Total Revenue")}</span>}
                            value={summaryData?.order_amount || 0}
                            precision={2}
                            prefix={<LuDollarSign className="text-blue-600" />}
                            suffix="USD"
                            valueStyle={{ color: darkMode ? '#60a5fa' : '#2563eb', fontWeight: 'bold' }}
                        />
                        <div className="mt-2 text-sm text-gray-500 dark:!text-gray-400">
                            {formatKHR(summaryData?.order_amount_kh || 0)}
                        </div>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-white dark:!from-gray-800 dark:!to-gray-800 dark:!text-white">
                        <Statistic
                            title={<span className="text-gray-600 dark:!text-gray-300">{rt("Total Cost")}</span>}
                            value={(summaryData?.total_cost || 0)}
                            precision={2}
                            prefix={<LuPackage className="text-red-600" />}
                            suffix="USD"
                            valueStyle={{ color: darkMode ? '#f87171' : '#dc2626', fontWeight: 'bold' }}
                        />
                        <div className="mt-2 text-sm text-gray-500 dark:!text-gray-400">
                            {formatKHR((summaryData?.total_cost_kh || 0))}
                        </div>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white dark:!from-gray-800 dark:!to-gray-800 dark:!text-white">
                        <Statistic
                            title={<span className="text-gray-600 dark:!text-gray-300">{rt("Total Net Profit")}</span>}
                            value={summaryData?.profit}
                            precision={2}
                            prefix={summaryData?.profit >= 0 ? <LuArrowUp className="text-green-600" /> : <LuArrowDown className="text-red-600" />}
                            suffix="USD"
                            valueStyle={{ color: summaryData?.profit >= 0 ? (darkMode ? '#4ade80' : '#16a34a') : (darkMode ? '#f87171' : '#dc2626'), fontWeight: 'bold' }}
                        />
                        <div className="mt-2 text-sm text-gray-500 dark:!text-gray-400">
                            {formatKHR(summaryData?.profit_kh || 0)}
                        </div>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-white dark:!from-gray-800 dark:!to-gray-800 dark:!text-white">
                        <Statistic
                            title={<span className="text-gray-600 dark:!text-gray-300">{rt("Return RTS")}</span>}
                            value={summaryData?.cost_return}
                            precision={1}
                            suffix="USD"
                            valueStyle={{ color: darkMode ? '#fbbf24' : '#ca8a04', fontWeight: 'bold' }}
                        />
                        <div className="mt-2 text-sm text-gray-500 dark:!text-gray-400">
                            {formatKHR(summaryData?.cost_return || 0)}
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Detailed Metrics Cards */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="border-0 shadow-sm h-full dark:!bg-gray-800 dark:!text-white">
                        <div className="flex items-start">
                            <div className="p-2 bg-blue-100 dark:!bg-blue-900 rounded-lg mr-3">
                                <LuDollarSign className="text-blue-600 dark:!text-blue-300 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:!text-gray-400 text-sm">{rt("Purchase Cost")}</p>
                                <p className="text-lg font-bold text-gray-800 dark:!text-white">{formatUSD(summaryData?.cost_in || 0)}</p>
                                <p className="text-xs text-gray-500 dark:!text-gray-400">{formatKHR(summaryData?.cost_in_kh || 0)}</p>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="border-0 shadow-sm h-full dark:!bg-gray-800 dark:!text-white">
                        <div className="flex items-start">
                            <div className="p-2 bg-orange-100 dark:!bg-orange-900 rounded-lg mr-3">
                                <LuPackage className="text-orange-600 dark:!text-orange-300 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:!text-gray-400 text-sm">{rt("Used Material Cost")}</p>
                                <p className="text-lg font-bold text-gray-800 dark:!text-white">{formatUSD(summaryData?.cost_used || 0)}</p>
                                <p className="text-xs text-gray-500 dark:!text-gray-400">{formatKHR(summaryData?.cost_used_kh || 0)}</p>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="border-0 shadow-sm h-full dark:!bg-gray-800 dark:!text-white">
                        <div className="flex items-start">
                            <div className="p-2 bg-red-100 dark:!bg-red-900 rounded-lg mr-3">
                                <LuTruck className="text-red-600 dark:!text-red-300 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:!text-gray-400 text-sm">{rt("Operating Expense")}</p>
                                <p className="text-lg font-bold text-gray-800 dark:!text-white">{formatUSD(summaryData?.total_expense_cost || 0)}</p>
                                <p className="text-xs text-gray-500 dark:!text-gray-400">{formatKHR(summaryData?.total_expense_cost_kh || 0)}</p>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="border-0 shadow-sm h-full dark:!bg-gray-800 dark:!text-white">
                        <div className="flex items-start">
                            <div className="p-2 bg-purple-100 dark:!bg-purple-900 rounded-lg mr-3">
                                <LuTrendingUp className="text-purple-600 dark:!text-purple-300 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:!text-gray-400 text-sm">{rt("Margin")}</p>
                                <p className="text-lg font-bold text-gray-800 dark:!text-white">{margin.toFixed(2)}%</p>
                                {/* <p className="text-xs text-gray-500">{formatKHR(summaryData?.total_cost_kh || 0)}</p> */}
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card
                    title={<span className="dark:!text-white">{rt("Monthly Profit")}</span>}
                    className="border-0 shadow-md dark:!bg-gray-800 dark:!text-white"
                    extra={<span className="text-sm text-gray-500 dark:!text-gray-400">{dayjs().year()}</span>}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />
                            <XAxis dataKey="month" tickFormatter={(value) => dayjs(value).format('MMM')} stroke={darkMode ? '#9ca3af' : '#666'} />
                            <YAxis stroke={darkMode ? '#9ca3af' : '#666'} />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: darkMode ? '#fff' : '#000',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                formatter={(value, name) => [formatUSD(value), rt(name)]}
                                labelFormatter={(label) => dayjs(label).format('MMM YYYY')}
                            />
                            <Legend formatter={(value) => <span className="dark:!text-gray-300">{rt(value)}</span>} />
                            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cost" name="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card
                    title={<span className="dark:!text-white">{rt("Cost Proportions")}</span>}
                    className="border-0 shadow-md dark:!bg-gray-800 dark:!text-white"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Used Material Cost', value: summaryData?.cost_used || 0 },
                                    { name: 'Operating Expense', value: summaryData?.total_expense_cost || 0 },
                                    { name: 'Purchase Cost', value: summaryData?.cost_in > 0 ? summaryData?.cost_in : 0 },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${rt(name)}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {[
                                    { name: 'Used Material Cost', value: summaryData?.cost_used || 0 },
                                    { name: 'Operating Expense', value: summaryData?.total_expense_cost || 0 },
                                    { name: 'Purchase Cost', value: summaryData?.cost_in > 0 ? summaryData?.cost_in : 0 },
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: darkMode ? '#fff' : '#000'
                                }}
                                itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                formatter={(value, name) => [formatUSD(value), rt(name)]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center mt-4 gap-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-[#0088FE] rounded-full mr-1"></div>
                            <span className="text-xs text-gray-600 dark:!text-gray-400">{rt("Used Material Cost")}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-[#00C49F] rounded-full mr-1"></div>
                            <span className="text-xs text-gray-600 dark:!text-gray-400">{rt("Operating Expense")}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-[#FFBB28] rounded-full mr-1"></div>
                            <span className="text-xs text-gray-600 dark:!text-gray-400">{rt("Purchase Cost")}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default ProfitAnalysis;

