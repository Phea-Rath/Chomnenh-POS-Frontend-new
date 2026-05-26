import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter } from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useGetRawMaterialReportMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';
import { useGetAllRawMaterialQuery } from '../../../app/Features/RawMaterialSlice';
import { useGetAllUserQuery, useGetUserLoginQuery } from '../../../app/Features/usersSlice';
import { useReportText } from './reportText';
import { useOutletsContext } from '../../layouts/Management';
import { useReactToPrint } from 'react-to-print';
import RichSearch from '../../utils/RichSearch';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const EMPTY_REPORT_DATA = {
    quantity: '0',
    avg_item_cost: '0',
    subtotal_cost: '0',
    stock_return: '0',
    cost_return: '0',
    stock_in: '0',
    cost_in: '0',
    stock_out: '0',
    cost_out: '0',
    stock_waste: '0',
    cost_waste: '0',
    stock_used: '0',
    cost_used: '0',
    calculate_cost: '0',
    cost_in_kh: '0',
    cost_used_kh: '0',
    cost_return_kh: '0',
    cost_waste_kh: '0',
    cost_out_kh: '0',
    calculate_cost_kh: '0'
};

const RawMaterialReport = () => {
    const { rt } = useReportText();
    const { darkMode } = useOutletsContext();
    const token = localStorage.getItem('token');
    const [getRawMaterialReport] = useGetRawMaterialReportMutation();
    const { data: userLogin } = useGetUserLoginQuery(token);
    const profile = userLogin?.data;

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [formData, setFormData] = useState({
        item_id: '',
        material_name: '',
        created_by: '',
        username: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today),
    });

    const [users, setUsers] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [reportData, setReportData] = useState(EMPTY_REPORT_DATA);
    const [loading, setLoading] = useState(false);
    const reportRef = useRef();

    const { data: raws } = useGetAllRawMaterialQuery({ limit: 10000, page: 1, search: '', token });
    const { data: usersData } = useGetAllUserQuery(token);

    useEffect(() => {
        if (raws?.data?.data?.length > 0) {
            setRawMaterials(raws.data.data);
        }
        if (usersData?.data?.length > 0) {
            setUsers(usersData.data);
        }
    }, [raws, usersData]);

    const handleFieldChange = (name, value) => {
        setFormData((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'created_by') {
                const selected = users.find((u) => String(u.id) === String(value));
                next.username = selected?.username || '';
            }

            if (name === 'item_id') {
                const selected = rawMaterials.find((material) => String(material.id) === String(value));
                next.material_name = selected?.material_name || '';
            }

            return next;
        });
    };

    async function fetchReport(payload = formData) {
        try {
            setLoading(true);
            const res = await getRawMaterialReport({ itemData: payload, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || EMPTY_REPORT_DATA);
            } else {
                toast.error('Failed to generate raw material report');
            }
        } catch (error) {
            toast.error(error?.message || 'An error occurred while generating the report');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchReport();
    }, []);

    const handleGetReport = async () => {
        await fetchReport();
    };

    const toNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(toNumber(amount));
    };

    const formatKHR = (value) => {
        return `${toNumber(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ៛`;
    };

    // Recharts Data Transformation
    const barData = useMemo(() => [
        { name: 'In', quantity: toNumber(reportData.stock_in), cost: toNumber(reportData.cost_in) },
        { name: 'Out', quantity: toNumber(reportData.stock_out), cost: toNumber(reportData.cost_out) },
        { name: 'Used', quantity: toNumber(reportData.stock_used), cost: toNumber(reportData.cost_used) },
        { name: 'Waste', quantity: toNumber(reportData.stock_waste), cost: toNumber(reportData.cost_waste) },
        { name: 'Return', quantity: toNumber(reportData.stock_return), cost: toNumber(reportData.cost_return) },
    ], [reportData]);

    const pieData = useMemo(() => [
        { name: 'In Cost', value: toNumber(reportData.cost_in) },
        { name: 'Used Cost', value: toNumber(reportData.cost_used) },
        { name: 'Waste Cost', value: toNumber(reportData.cost_waste) },
        { name: 'Return Cost', value: toNumber(reportData.cost_return) },
        { name: 'Out Cost', value: toNumber(reportData.cost_out) },
    ], [reportData]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet([reportData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RawMaterialReport");
        XLSX.writeFile(wb, "RawMaterialReport.xlsx");
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
                        size:  A5 landscape;
                        margin: 5mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        font-family: 'Siemreap', 'Poppins', sans-serif;
                    }
                    .print-container {
                        font-size: 10px !important;
                    }
                    .print-container .chart-container {
                        page-break-inside: avoid;
                    }

                    .print-container .chart-container > div {
                        // height: 100% !important;
                    }

                    .print-container .chart-section > div {
                        shadow: none !important;
                        box-shadow: none !important;
                        border: 0 !important;
                    }

                    .print-container .stats-grid {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 10px !important;
                    }

                    .print-container .stats-card {
                        padding: 10px !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                }
            `}} />
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{rt("Raw Material Stock Report")}</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">{rt("Track and analyze raw material movements and costs")}</p>
                </div>

                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">{rt("Material")}</label>
                            <RichSearch
                                data={rawMaterials}
                                keyFields={{ id: 'id', title: 'material_name' }}
                                onSelected={(id) => handleFieldChange('item_id', id)}
                                value={formData.item_id}
                                placeholder={rt("All Materials")}
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">{rt("Handled By")}</label>
                            <RichSearch
                                data={users}
                                keyFields={{ id: 'id', title: 'username' }}
                                onSelected={(id) => handleFieldChange('created_by', id)}
                                value={formData.created_by}
                                placeholder={rt("All Users")}
                            />
                        </div>

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
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-10"
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
                        {rt('Print')}
                    </button>
                </div>

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
                            <h1 className="text-xl font-bold text-blue-600">{rt("Raw Material Stock Report")}</h1>
                            <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    <ul className="px-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-6">
                        <li>{rt("Material")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.material_name || rt('All')}</span></li>
                        <li>{rt("Handled By")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.username || rt('All')}</span></li>
                        <li>{rt("Start Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.start_date || rt('All')}</span></li>
                        <li>{rt("End Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.end_date || rt('All')}</span></li>
                    </ul>

                    {/* Top Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 stats-grid">
                        {[
                            { label: "Total Purchase Cost", value: reportData.cost_in, khValue: reportData.cost_in_kh, color: "text-emerald-600" },
                            { label: "Total Used Cost", value: reportData.cost_used, khValue: reportData.cost_used_kh, color: "text-blue-600" },
                            { label: "Total Return Cost", value: reportData.cost_return, khValue: reportData.cost_return_kh, color: "text-indigo-600" },
                            { label: "Total Waste Cost", value: reportData.cost_waste, khValue: reportData.cost_waste_kh, color: "text-rose-600" },
                            { label: "Total Out Cost", value: reportData.cost_out, khValue: reportData.cost_out_kh, color: "text-amber-600" },
                            { label: "Calculate Cost", value: reportData.calculate_cost, khValue: reportData.calculate_cost_kh, color: reportData.calculate_cost < 0 ? "text-rose-600" : "text-emerald-600" }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-primary rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 p-4 stats-card">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt(stat.label)}</p>
                                <p className={`text-lg font-bold mt-1 ${stat.color}`}>{formatCurrency(stat.value)}</p>
                                <p className="text-slate-400 text-[9px] mt-1">{formatKHR(stat.khValue)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 chart-section">
                        <div className="lg:col-span-2 bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 chart-container">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{rt("Stock Flow Analysis (Qty vs Cost)")}</h3>
                            <div className="h-[300px] md:h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />
                                        <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#666'} tickFormatter={(name) => rt(name)} fontSize={10} />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" fontSize={10} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={10} />
                                        <ChartTooltip
                                            contentStyle={{
                                                borderRadius: '10px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                backgroundColor: darkMode ? '#1f2937' : '#fff',
                                                color: darkMode ? '#fff' : '#000',
                                                fontSize: '10px'
                                            }}
                                            itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                            formatter={(value, name) => [value, rt(name)]}
                                        />
                                        <Legend formatter={(value) => <span className="dark:!text-gray-300 text-[10px]">{rt(value)}</span>} />
                                        <Bar yAxisId="left" dataKey="quantity" name="Quantity Units" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="right" dataKey="cost" name="Cost Amount ($)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 chart-container">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{rt("Cost Contribution")}</h3>
                            <div className="h-[300px] md:h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <ChartTooltip
                                            contentStyle={{
                                                backgroundColor: darkMode ? '#1f2937' : '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: darkMode ? '#fff' : '#000',
                                                fontSize: '10px'
                                            }}
                                            itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                            formatter={(value, name) => [value, rt(name)]}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={36}
                                            formatter={(value) => <span className="dark:!text-gray-300 text-[10px]">{rt(value)}</span>}
                                        />
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        
                                        
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-400">{rt("Generating report...")}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RawMaterialReport;
