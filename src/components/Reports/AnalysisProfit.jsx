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

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ProfitAnalysis = () => {
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
            title: 'កាលបរិច្ឆេទ',
            dataIndex: 'month',
            key: 'month',
            render: (text) => dayjs(text).format('MMM DD, YYYY'),
        },
        {
            title: 'ប្រាក់ចំណូល ($)',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (value) => formatUSD(value),
        },
        {
            title: 'ថ្លៃដើម ($)',
            dataIndex: 'cost',
            key: 'cost',
            render: (value) => formatUSD(value),
        },
        {
            title: 'ប្រាក់ចំណេញ ($)',
            dataIndex: 'profit',
            key: 'profit',
            render: (value) => (
                <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatUSD(value)}
                </span>
            ),
        },
        {
            title: 'រឹម (%)',
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">កំពុងផ្ទុកទិន្នន័យវិភាគប្រាក់ចំណេញ...</p>
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
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            វិភាគប្រាក់ចំណេញ
                        </h1>
                        <p className="text-gray-600 text-sm md:text-base">
                            តាមដានប្រាក់ចំណេញ និងការចំណាយ
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        icon={<LuRefreshCw />}
                        onClick={handleRefresh}
                        className="flex items-center"
                    >
                        ធ្វើឱ្យស្រស់
                    </Button>
                    <Button
                        type="primary"
                        icon={<LuDownload />}
                        onClick={handleExportExcel}
                        className="bg-green-500 hover:bg-green-600 border-0"
                    >
                        នាំចេញ Excel
                    </Button>
                </div>
            </div>
            <div className="flex gap-2 mb-3">
                <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    className="w-auto"
                    size={screens.md ? 'middle' : 'small'}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
                        <Statistic
                            title={<span className="text-gray-600">ប្រាក់ចំណូលសរុប</span>}
                            value={summaryData?.order_amount || 0}
                            precision={2}
                            prefix={<LuDollarSign className="text-blue-600" />}
                            suffix="USD"
                            valueStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                        />
                        <div className="mt-2 text-sm text-gray-500">
                            {formatKHR(summaryData?.order_amount_kh || 0)}
                        </div>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-white">
                        <Statistic
                            title={<span className="text-gray-600">ថ្លៃដើមសរុប</span>}
                            value={(summaryData?.total_cost || 0)}
                            precision={2}
                            prefix={<LuPackage className="text-red-600" />}
                            suffix="USD"
                            valueStyle={{ color: '#dc2626', fontWeight: 'bold' }}
                        />
                        <div className="mt-2 text-sm text-gray-500">
                            {formatKHR((summaryData?.total_cost_kh || 0))}
                        </div>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
                        <Statistic
                            title={<span className="text-gray-600">ប្រាក់ចំណេញសុទ្ធ</span>}
                            value={summaryData?.profit}
                            precision={2}
                            prefix={summaryData?.profit >= 0 ? <LuArrowUp className="text-green-600" /> : <LuArrowDown className="text-red-600" />}
                            suffix="USD"
                            valueStyle={{ color: summaryData?.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}
                        />
                        <div className="mt-2 text-sm text-gray-500">
                            {formatKHR(summaryData?.profit_kh)} KHR
                        </div>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-white">
                        <Statistic
                            title={<span className="text-gray-600">Return RTS</span>}
                            value={summaryData?.cost_return}
                            precision={1}
                            suffix="USD"
                            valueStyle={{ color: '#ca8a04', fontWeight: 'bold' }}
                        />
                        <div className="mt-2 text-sm text-gray-500">
                            {formatKHR(summaryData?.cost_return)} KHR
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Detailed Metrics Cards */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="border-0 shadow-sm h-full">
                        <div className="flex items-start">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <LuDollarSign className="text-blue-600 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">ថ្លៃដើមទិញចូល</p>
                                <p className="text-lg font-bold text-gray-800">{formatUSD(summaryData?.cost_in || 0)}</p>
                                <p className="text-xs text-gray-500">{formatKHR(summaryData?.cost_in_kh || 0)}</p>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="border-0 shadow-sm h-full">
                        <div className="flex items-start">
                            <div className="p-2 bg-orange-100 rounded-lg mr-3">
                                <LuPackage className="text-orange-600 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">ថ្លៃដើមប្រើប្រាស់</p>
                                <p className="text-lg font-bold text-gray-800">{formatUSD(summaryData?.cost_used || 0)}</p>
                                <p className="text-xs text-gray-500">{formatKHR(summaryData?.cost_used_kh || 0)}</p>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="border-0 shadow-sm h-full">
                        <div className="flex items-start">
                            <div className="p-2 bg-red-100 rounded-lg mr-3">
                                <LuTruck className="text-red-600 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">ចំណាយប្រតិបត្តិការ</p>
                                <p className="text-lg font-bold text-gray-800">{formatUSD(summaryData?.total_expense_cost || 0)}</p>
                                <p className="text-xs text-gray-500">{formatKHR(summaryData?.total_expense_cost_kh || 0)}</p>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="border-0 shadow-sm h-full">
                        <div className="flex items-start">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                <LuTrendingUp className="text-purple-600 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Margin</p>
                                <p className="text-lg font-bold text-gray-800">{formatUSD(margin || 0)}%</p>
                                {/* <p className="text-xs text-gray-500">{formatKHR(summaryData?.total_cost_kh || 0)}</p> */}
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card
                    title="ប្រាក់ចំណេញប្រចាំខែ"
                    className="border-0 shadow-md"
                    extra={<span className="text-sm text-gray-500">ឆ្នាំ 2022</span>}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tickFormatter={(value) => dayjs(value).format('MMM')} />
                            <YAxis />
                            <RechartsTooltip
                                formatter={(value) => formatUSD(value)}
                                labelFormatter={(label) => dayjs(label).format('MMM YYYY')}
                            />
                            <Legend />
                            <Bar dataKey="revenue" name="ប្រាក់ចំណូល" fill="#3b82f6" />
                            <Bar dataKey="cost" name="ថ្លៃដើម" fill="#ef4444" />
                            <Bar dataKey="profit" name="ប្រាក់ចំណេញ" fill="#22c55e" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card
                    title="សមាមាត្រថ្លៃដើម"
                    className="border-0 shadow-md"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'ថ្លៃដើមទំនិញប្រើប្រាស់', value: summaryData?.cost_used || 0 },
                                    { name: 'ចំណាយប្រតិបត្តិការ', value: summaryData?.total_expense_cost || 0 },
                                    { name: 'ថ្លៃដើមទិញចូល', value: summaryData?.cost_in > 0 ? summaryData?.cost_in : 0 },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {[
                                    { name: 'ថ្លៃដើមទំនិញប្រើប្រាស់', value: summaryData?.cost_used || 0 },
                                    { name: 'ចំណាយប្រតិបត្តិការ', value: summaryData?.total_expense_cost || 0 },
                                    { name: 'ថ្លៃដើមទិញចូល', value: summaryData?.cost_in > 0 ? summaryData?.cost_in : 0 },
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => formatUSD(value)} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center mt-4 space-x-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-[#0088FE] rounded-full mr-1"></div>
                            <span className="text-xs text-gray-600">ថ្លៃដើមទំនិញប្រើប្រាស់</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-[#00C49F] rounded-full mr-1"></div>
                            <span className="text-xs text-gray-600">ចំណាយប្រតិបត្តិការ</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-[#FFBB28] rounded-full mr-1"></div>
                            <span className="text-xs text-gray-600">ប្រាក់ចំណេញ</span>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default ProfitAnalysis;

