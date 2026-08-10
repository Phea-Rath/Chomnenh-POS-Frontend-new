import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiFilter, FiPrinter, FiAlertTriangle } from 'react-icons/fi';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { useGetDebtAnalysisMutation } from "@/features/dashboard/reportsSlice";
import { useGetUserLoginQuery } from "@/features/auth/usersSlice";
import { toast } from 'react-toastify';
import { useReportText } from './reportText';
import { useReactToPrint } from 'react-to-print';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useOutletsContext } from '../../layouts/Management';
import { getToken } from '@/utils/tokenStore';

const EMPTY_REPORT = {
    start_date: '',
    end_date: '',
    cards: {
        ar_total: '0.00',
        ar_total_kh: '0.00',
        ap_total: '0.00',
        ap_total_kh: '0.00',
        inv_total: '0.00',
        inv_total_kh: '0.00',
        balance_total: '0.00',
        balance_total_kh: '0.00'
    },
    chart: []
};

const DeptAnalysis = () => {
    const { rt } = useReportText();
    const { darkMode } = useOutletsContext();
    const token = getToken();
    const [getDebtAnalysis] = useGetDebtAnalysisMutation();
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
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today)
    });

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const reportRef = useRef();

    const handleFieldChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    async function fetchReport(payload = formData) {
        try {
            setLoading(true);
            const res = await getDebtAnalysis({ itemData: payload, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || EMPTY_REPORT);
            } else {
                toast.error('Failed to generate debt analysis');
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

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        contentRef: reportRef,
    });

    const toNumber = (value) => {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    };

    const formatUSD = (value) => {
        const number = toNumber(value);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(number);
    };

    const formatKHR = (value) => {
        const number = toNumber(value);
        return `${number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ៛`;
    };

    const cards = useMemo(() => reportData?.cards || EMPTY_REPORT.cards, [reportData]);

    const totals = useMemo(() => {
        const ar = toNumber(cards.ar_total);
        const ap = toNumber(cards.ap_total);
        const inv = toNumber(cards.inv_total);
        const totalDebt = ap + inv;
        const balance = toNumber(cards.balance_total);
        const coverage = balance > 0 ? ar / balance : 0;

        const status = coverage >= 1.2 ? 'Healthy' : coverage >= 1 ? 'Balanced' : 'Overleveraged';
        const statusColor =
            status === 'Healthy'
                ? 'text-emerald-600'
                : status === 'Balanced'
                    ? 'text-amber-600'
                    : 'text-rose-600';
        const statusBg =
            status === 'Healthy'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50'
                : status === 'Balanced'
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50';

        return {
            ar,
            ap,
            inv,
            totalDebt,
            balance,
            coverage,
            status,
            statusColor,
            statusBg
        };
    }, [cards]);

    const chartData = useMemo(() => {
        const raw = reportData?.chart || [];
        return raw.map((item) => ({
            date: item.date,
            label: (() => {
                const parsed = new Date(item.date);
                if (Number.isNaN(parsed.getTime())) return item.date;
                return parsed.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
            })(),
            ar: Math.abs(toNumber(item.ar)),
            ap_inv: Math.abs(toNumber(item.ap_inv))
        }));
    }, [reportData]);

    return (
        <div className="report-page min-h-screen bg-transparent p-2 md:p-4">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4;
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
                    .print-container .stats-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 10px !important;
                    }
                    .print-container .stats-card {
                        padding: 10px !important;
                        border: 1px solid #e2e8f0 !important;
                    }

                    .print-container .stats-grid > div{
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }

                    .print-container .chart-section > div {
                        box-shadow: none !important;
                        border: 0 !important;
                    }

                    .print-container .print-chart{
                        width: 700px !important;
                    }
                }
            `}} />
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{rt("Debt Analysis Dashboard")}</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">{rt("Monitor receivables, payables, and liquidity trends")}</p>
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
                        
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2 bg-slate-600 text-white px-5 py-2 rounded-md hover:bg-slate-700 h-10 print:hidden"
                        >
                            <FiPrinter size={16} />
                            {rt('Print')}
                        </button>
                    </div>
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
                            <h1 className="text-xl font-bold text-cyan-600">{rt("Debt Analysis Dashboard")}</h1>
                            <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    <ul className="px-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-6">
                        <li>{rt("Start Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.start_date || rt('All')}</span></li>
                        <li>{rt("End Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.end_date || rt('All')}</span></li>
                    </ul>

                    {reportData && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stats-grid">
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-4 border-emerald-500 stats-card">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Account Receivables (AR)")}</p>
                                    <p className="text-lg font-bold mt-1 text-emerald-600">{formatUSD(cards.ar_total)}</p>
                                    <p className="text-slate-400 text-[9px] mt-1">{formatKHR(cards.ar_total_kh)}</p>
                                </div>
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-4 border-amber-500 stats-card">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Account Payables (AP)")}</p>
                                    <p className="text-lg font-bold mt-1 text-amber-600">{formatUSD(cards.ap_total)}</p>
                                    <p className="text-slate-400 text-[9px] mt-1">{formatKHR(cards.ap_total_kh)}</p>
                                </div>
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-4 border-indigo-500 stats-card">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Inventory Payables")}</p>
                                    <p className="text-lg font-bold mt-1 text-indigo-600">{formatUSD(cards.inv_total)}</p>
                                    <p className="text-slate-400 text-[9px] mt-1">{formatKHR(cards.inv_total_kh)}</p>
                                </div>
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-4 border-rose-500 stats-card">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Net Balance")}</p>
                                    <p className={`text-lg font-bold mt-1 ${totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatUSD(cards.balance_total)}
                                    </p>
                                    <p className="text-slate-400 text-[9px] mt-1">{formatKHR(cards.balance_total_kh)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 chart-section">
                                <div className="lg:col-span-2 bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 chart-container">
                                    <div className="mb-4">
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                                            {rt("AR vs Total Debt")}
                                        </h2>
                                        <p className="text-slate-400 text-[10px]">{rt("Daily balances within selected range")}</p>
                                    </div>

                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart className='print-chart' data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#e5e7eb'} />
                                                <XAxis dataKey="label" stroke={darkMode ? '#9ca3af' : '#666'} tick={{ fontSize: 10 }} />
                                                <YAxis stroke={darkMode ? '#9ca3af' : '#666'} tick={{ fontSize: 10 }} />
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
                                                    labelFormatter={(label) => `${rt('Date')}: ${label}`}
                                                />
                                                <Legend formatter={(value) => <span className="dark:!text-gray-300 text-[10px]">{rt(value)}</span>} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="ar"
                                                    name="AR"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="ap_inv"
                                                    name="AP + INV"
                                                    stroke="#ef4444"
                                                    strokeWidth={2}
                                                    strokeDasharray="6 4"
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 stats-card">
                                    <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-4">
                                        {rt("Financial Insights")}
                                    </h2>

                                    <div className={`rounded-lg border p-4 ${totals.statusBg} mb-4`}>
                                        <div className="flex items-center gap-2">
                                            <FiAlertTriangle className={totals.statusColor} />
                                            <span className={`text-xs font-bold ${totals.statusColor}`}>{rt(totals.status)}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                                            {rt("Coverage below 1.0x means receivables do not cover current liabilities.")}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wide text-slate-400">{rt("Debt Status")}</p>
                                            <p className={`text-xs font-bold ${totals.statusColor}`}>{rt(totals.status)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wide text-slate-400">{rt("Cash Coverage")}</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                {totals.coverage.toFixed(2)}x
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-700 mt-4 pt-4 space-y-3 text-[11px] text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center justify-between">
                                            <span>{rt("Total Debt (AP + INV)")}</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{formatUSD(totals.totalDebt)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>{rt("Receivables Coverage")}</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{formatUSD(totals.ar)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>{rt("Net Position")}</span>
                                            <span className={`font-bold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatUSD(totals.balance)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {!reportData && !loading && (
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                        <FiAlertTriangle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{rt("No Report Generated")}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{rt("Use the filters above to generate a debt analysis report")}</p>
                    </div>
                )}

                {loading && (
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-400">{rt("Generating report...")}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeptAnalysis;
