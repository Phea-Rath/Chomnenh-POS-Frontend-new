import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiSearch, FiAlertTriangle } from 'react-icons/fi';
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
import { useGetDebtAnalysisMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';

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
    const token = localStorage.getItem('token');
    const [getDebtAnalysis] = useGetDebtAnalysisMutation();

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
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
        })} KHR`;
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
                ? 'bg-emerald-50 border-emerald-100'
                : status === 'Balanced'
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-rose-50 border-rose-100';

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
        <div className="min-h-screen bg-transparent p-2 md:p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Debt Analysis Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor receivables, payables, and liquidity trends</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block font-medium text-slate-600 mb-2">Start Date</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-medium text-slate-600 mb-2">End Date</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-3">
                            <button
                                onClick={handleGetReport}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiSearch size={16} />
                                {loading ? 'Loading...' : 'Get Report'}
                            </button>
                        </div>
                    </div>
                </div>

                {reportData && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-l-4 border-emerald-500">
                                <p className="text-slate-500">Account Receivables (AR)</p>
                                <p className="text-lg font-semibold text-emerald-600">{formatUSD(cards.ar_total)}</p>
                                <p className="text-slate-400 text-xs mt-1">{formatKHR(cards.ar_total_kh)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-l-4 border-amber-500">
                                <p className="text-slate-500">Account Payables (AP)</p>
                                <p className="text-lg font-semibold text-amber-600">{formatUSD(cards.ap_total)}</p>
                                <p className="text-slate-400 text-xs mt-1">{formatKHR(cards.ap_total_kh)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-l-4 border-indigo-500">
                                <p className="text-slate-500">Inventory Payables</p>
                                <p className="text-lg font-semibold text-indigo-600">{formatUSD(cards.inv_total)}</p>
                                <p className="text-slate-400 text-xs mt-1">{formatKHR(cards.inv_total_kh)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 border-l-4 border-rose-500">
                                <p className="text-slate-500">Net Balance</p>
                                <p className={`text-lg font-semibold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatUSD(cards.balance_total)}
                                </p>
                                <p className="text-slate-400 text-xs mt-1">{formatKHR(cards.balance_total_kh)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                            AR vs Total Debt
                                        </h2>
                                        <p className="text-slate-400 text-xs">Daily balances within selected range</p>
                                    </div>
                                </div>

                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <RechartsTooltip
                                                // formatter={(value, name) => [formatUSD(value), name != 'ar' ? 'AR' : 'AP + INV']}
                                                labelFormatter={(label) => `Date: ${label}`}
                                            />
                                            <Legend />
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

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                                    Financial Insights
                                </h2>

                                <div className={`rounded-lg border p-4 ${totals.statusBg} mb-4`}>
                                    <div className="flex items-center gap-2">
                                        <FiAlertTriangle className={totals.statusColor} />
                                        <span className={`text-sm font-semibold ${totals.statusColor}`}>{totals.status}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Coverage below 1.0x means receivables do not cover current liabilities.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Debt Status</p>
                                        <p className={`text-sm font-semibold ${totals.statusColor}`}>{totals.status}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Cash Coverage</p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {totals.coverage.toFixed(2)}x
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 mt-4 pt-4 space-y-3 text-xs text-slate-500">
                                    <div className="flex items-center justify-between">
                                        <span>Total Debt (AP + INV)</span>
                                        <span className="font-medium text-slate-700">{formatUSD(totals.totalDebt)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Receivables Coverage</span>
                                        <span className="font-medium text-slate-700">{formatUSD(totals.ar)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Net Position</span>
                                        <span className={`font-medium ${totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatUSD(totals.balance)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!reportData && !loading && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
                        <FiSearch size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No Analysis Generated</h3>
                        <p className="text-slate-500">Select a date range to generate the debt analysis report.</p>
                    </div>
                )}

                {loading && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Generating analysis...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeptAnalysis;
