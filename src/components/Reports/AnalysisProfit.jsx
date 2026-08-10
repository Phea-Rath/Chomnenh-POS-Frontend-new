import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    LuTrendingUp,
    LuDollarSign,
    LuPackage,
    LuTruck,
    LuArrowDown,
    LuArrowUp,
} from "react-icons/lu";
import { FiDownload, FiPrinter, FiFilter } from 'react-icons/fi';
import { Card, Statistic, Row, Col, Grid } from "antd";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
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
import { useReactToPrint } from "react-to-print";
import { useGetUserLoginQuery } from "@/features/auth/usersSlice";
import { DatePicker } from 'antd';
import { getToken } from '@/utils/tokenStore';

const { useBreakpoint } = Grid;

const EMPTY_REPORT_DATA = {
    cost_return: 0,
    cost_return_kh: 0,
    cost_in: 0,
    cost_in_kh: 0,
    total_expense_cost: 0,
    total_expense_cost_kh: 0,
    order_amount: 0,
    order_amount_kh: 0,
    cost_used: 0,
    cost_used_kh: 0,
    total_cost: 0,
    total_cost_kh: 0,
    profit: 0,
    profit_kh: 0,
};

const ProfitAnalysis = () => {
    const { rt } = useReportText();
    const { darkMode } = useOutletsContext();
    const screens = useBreakpoint();
    const token = getToken();
    const { data: userLogin } = useGetUserLoginQuery(token);
    const profile = userLogin?.data;

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [formData, setFormData] = useState({
        start_date: formatDateForInput(startOfYear),
        end_date: formatDateForInput(today)
    });

    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(EMPTY_REPORT_DATA);
    const [monthlyData, setMonthlyData] = useState([]);
    const reportRef = useRef();

    const fetchProfitData = async (payload) => {
        try {
            const response = await api.post("/analysis_profit", payload, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            if (response.status === 200 && response.data) {
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
            toast.error("Failed to load profit summary data");
        }
    };

    const fetchMonthlyData = async (payload) => {
        try {
            const response = await api.post("/analysis_profit_chart", payload, {
                headers: { Authorization: `Bearer ${getToken()}` },
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
            toast.error("Failed to load profit chart data");
        }
    };

    const fetchAllData = async (payload = formData) => {
        setLoading(true);
        try {
            await Promise.all([fetchProfitData(payload), fetchMonthlyData(payload)]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleGetReport = async () => {
        await fetchAllData();
    };

    const handleFieldChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatUSD = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value || 0);
    };

    const formatKHR = (value) => {
        return `${(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ៛`;
    };

    const marginValue = useMemo(() => {
        if (!summaryData || summaryData.order_amount === 0) return 0;
        return (summaryData?.profit / summaryData.order_amount) * 100;
    }, [summaryData]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    const handleExportExcel = () => {
        if (!summaryData) return;
        const workbook = XLSX.utils.book_new();
        const summarySheetData = [
            [rt('Profit Analysis Summary')],
            [rt('Metric'), 'USD', 'KHR'],
            [rt('Cost In'), formatUSD(summaryData.cost_in), formatKHR(summaryData.cost_in_kh)],
            [rt('Order Amount'), formatUSD(summaryData.order_amount), formatKHR(summaryData.order_amount_kh)],
            [rt('Cost Used'), formatUSD(summaryData.cost_used), formatKHR(summaryData.cost_used_kh)],
            [rt('Total Expense'), formatUSD(summaryData.total_expense_cost), formatKHR(summaryData.total_expense_cost_kh)],
            [rt('Cost Return'), formatUSD(summaryData.cost_return), formatKHR(summaryData.cost_return_kh)],
            [rt('Calculate Cost'), formatUSD(summaryData.total_cost), formatKHR(summaryData.total_cost_kh)],
            [rt('Net Profit'), formatUSD(summaryData.profit), formatKHR(summaryData.profit_kh)],
            [rt('Profit Margin'), `${marginValue.toFixed(1)}%`, ''],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        XLSX.writeFile(workbook, `profit_analysis_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        contentRef: reportRef,
    });

    return (
        <div className="report-page min-h-screen bg-transparent p-2 md:p-4">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 5mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        font-family: 'Siemreap', 'Poppins', sans-serif;
                        background: white !important;
                    }
                    .print-container {
                        font-size: 8.5px !important;
                    }
                    .print-container * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }
                    .print-container .chart-container {
                        page-break-inside: avoid;
                        border: 1px solid #e2e8f0 !important;
                        padding: 8px !important;
                    }
                    // .print-container .chart-container > div {
                    //     height: 150px !important;
                    // }
                    .print-container .stats-grid {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 6px !important;
                        border-radius: 0 !important;
                    }
                        
                    .print-container .stats-grid > div {
                        border-radius: 0 !important;
                    }

                    .print-container .chart-grid {
                        display: grid !important;
                        grid-template-columns: repeat(1, 1fr) !important;
                        gap: 8px !important;
                    }

                    .print-container .chart-grid > div {
                        border: 0 !important;
                    }

                    .print-container .stats-card {
                        padding: 6px !important;
                        border: 1px solid #e2e8f0 !important;
                        background: white !important;
                    }
                    .print-header {
                        margin-bottom: 8px !important;
                    }
                
                    .print-chart{
                        width: 700px !important;
                        border: 1px solid #e2e8f0 !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 300px !important;
                    }
                }
            `}} />
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{rt("Profit Analysis")}</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">{rt("Track profits and expenses")}</p>
                </div>

                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">{rt("Start Date")}</label>
                            <DatePicker
                                className="w-full date-picker"
                                value={formData.start_date ? dayjs(formData.start_date) : null}
                                onChange={(date) => handleFieldChange('start_date', date ? date.format('YYYY-MM-DD') : '')}
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">{rt("End Date")}</label>
                            <DatePicker
                                className="w-full date-picker"
                                value={formData.end_date ? dayjs(formData.end_date) : null}
                                onChange={(date) => handleFieldChange('end_date', date ? date.format('YYYY-MM-DD') : '')}
                            />
                        </div>

                        <button
                            onClick={handleGetReport}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-cyan-600 text-white px-5 py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed h-10"
                        >
                            <FiFilter size={16} />
                            {loading ? rt('Loading...') : rt('Get Report')}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mb-4">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
                    >
                        <FiDownload size={16} />
                        {rt('Export Excel')}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 print:hidden"
                    >
                        <FiPrinter size={16} />
                        {rt('Save as PDF')}
                    </button>                </div>

                <div className="print-container" ref={reportRef}>
                    {/* Print Header */}
                    <div className="hidden print:flex items-center justify-between mb-8 border-b pb-4 print-header">
                        <div className="flex items-center gap-4">
                            {profile?.image ? (
                                <img src={profile.image} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                                    <span className="text-2xl text-slate-400 uppercase">{profile?.username?.[0] || 'U'}</span>
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{profile?.username || 'User'}</h2>
                                <p className="text-sm text-slate-500">{profile?.role || 'Staff'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-xl font-bold text-cyan-600">{rt("Profit Analysis")}</h1>
                            <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    <ul className="px-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-6">
                        <li>{rt("Start Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.start_date || rt('All')}</span></li>
                        <li>{rt("End Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.end_date || rt('All')}</span></li>
                    </ul>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stats-grid">
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Total Revenue")}</p>
                            <p className="text-lg font-bold mt-1 text-cyan-600">{formatUSD(summaryData?.order_amount)}</p>
                            <p className="text-slate-400 text-[9px] mt-1">{formatKHR(summaryData?.order_amount_kh)}</p>
                        </div>
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Total Cost")}</p>
                            <p className="text-lg font-bold mt-1 text-rose-600">{formatUSD(summaryData?.total_cost)}</p>
                            <p className="text-slate-400 text-[9px] mt-1">{formatKHR(summaryData?.total_cost_kh)}</p>
                        </div>
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Total Net Profit")}</p>
                            <p className={`text-lg font-bold mt-1 ${summaryData?.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatUSD(summaryData?.profit)}</p>
                            <p className="text-slate-400 text-[9px] mt-1">{formatKHR(summaryData?.profit_kh)}</p>
                        </div>
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Return RTS")}</p>
                            <p className="text-lg font-bold mt-1 text-amber-600">{formatUSD(summaryData?.cost_return)}</p>
                            <p className="text-slate-400 text-[9px] mt-1">{formatKHR(summaryData?.cost_return_kh)}</p>
                        </div>
                    </div>

                    {/* Detailed Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stats-grid">
                        <div className="bg-primary rounded-lg border border-slate-100 dark:border-slate-700 p-4 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[9px] uppercase font-semibold">{rt("Purchase Cost")}</p>
                            <p className="text-md font-bold text-slate-800 dark:text-white">{formatUSD(summaryData?.cost_in)}</p>
                            <p className="text-slate-400 text-[8px]">{formatKHR(summaryData?.cost_in_kh)}</p>
                        </div>
                        <div className="bg-primary rounded-lg border border-slate-100 dark:border-slate-700 p-4 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[9px] uppercase font-semibold">{rt("Used Material Cost")}</p>
                            <p className="text-md font-bold text-slate-800 dark:text-white">{formatUSD(summaryData?.cost_used)}</p>
                            <p className="text-slate-400 text-[8px]">{formatKHR(summaryData?.cost_used_kh)}</p>
                        </div>
                        <div className="bg-primary rounded-lg border border-slate-100 dark:border-slate-700 p-4 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[9px] uppercase font-semibold">{rt("Operating Expense")}</p>
                            <p className="text-md font-bold text-slate-800 dark:text-white">{formatUSD(summaryData?.total_expense_cost)}</p>
                            <p className="text-slate-400 text-[8px]">{formatKHR(summaryData?.total_expense_cost_kh)}</p>
                        </div>
                        <div className="bg-primary rounded-lg border border-slate-100 dark:border-slate-700 p-4 stats-card">
                            <p className="text-slate-500 dark:text-slate-400 text-[9px] uppercase font-semibold">{rt("Margin")}</p>
                            <p className="text-md font-bold text-slate-800 dark:text-white">{marginValue.toFixed(2)}%</p>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 chart-grid">
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 chart-container">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{rt("Monthly Profit")}</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart className="print-chart" data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />
                                        <XAxis dataKey="month" tickFormatter={(value) => dayjs(value).format('MMM')} stroke={darkMode ? '#9ca3af' : '#666'} fontSize={10} />
                                        <YAxis stroke={darkMode ? '#9ca3af' : '#666'} fontSize={10} />
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: darkMode ? '#1f2937' : '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: darkMode ? '#fff' : '#000',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                fontSize: '10px'
                                            }}
                                            itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                            formatter={(value, name) => [formatUSD(value), rt(name)]}
                                            labelFormatter={(label) => dayjs(label).format('MMM YYYY')}
                                        />
                                        <Legend formatter={(value) => <span className="dark:!text-gray-300 text-[10px]">{rt(value)}</span>} />
                                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="cost" name="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 chart-container">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{rt("Cost Proportions")}</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart className="print-chart">
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
                                            fontSize={10}
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
                                                color: darkMode ? '#fff' : '#000',
                                                fontSize: '10px'
                                            }}
                                            itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                            formatter={(value, name) => [formatUSD(value), rt(name)]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-400">{rt("Loading profit analysis data...")}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfitAnalysis;
