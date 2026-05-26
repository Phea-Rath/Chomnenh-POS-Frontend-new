import React, { useState, useRef, useMemo } from 'react';
import { useGetIncomeStatementQuery } from '../../../app/Features/reportsSlice';
import { useGetUserLoginQuery } from '../../../app/Features/usersSlice';
import { useReportText } from './reportText';
import { DatePicker, Spin } from 'antd';
import dayjs from 'dayjs';
import { FiPrinter, FiDownload, FiFilter, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { useOutletsContext } from '../../layouts/Management';

const IncomeStatement = () => {
    const { rt } = useReportText();
    const { darkMode } = useOutletsContext();
    const token = localStorage.getItem('token');
    
    const { data: userLogin } = useGetUserLoginQuery(token);
    const profile = userLogin?.data;

    const [dates, setDates] = useState({
        start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
        end_date: dayjs().format('YYYY-MM-DD')
    });

    const { data: reportResponse, isLoading, isFetching, refetch } = useGetIncomeStatementQuery({
        token,
        start_date: dates.start_date,
        end_date: dates.end_date
    });

    const reportData = reportResponse?.data || null;
    const reportRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        contentRef: reportRef,
    });

    const exportToExcel = () => {
        if (!reportData) return;
        const data = [
            [rt('Income Statement')],
            [rt('Date Range'), `${dates.start_date} - ${dates.end_date}`],
            [],
            [rt('Description'), rt('Amount ($)')],
            [rt('Total Sales Revenue'), reportData.revenue || 0],
            [rt('Total COGS'), reportData.total_cogs || 0],
            [rt('Waste Cost'), reportData.total_wc || 0],
            [rt('Total Cost of Sales'), reportData.total_cost || 0],
            [rt('Gross Profit'), reportData.cross_profit || 0],
            [rt('Operating Expenses'), reportData.expense_cost || 0],
            [rt('Net Profit'), reportData.net_profit || 0],
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Income Statement");
        XLSX.writeFile(wb, `Income_Statement_${dates.start_date}_to_${dates.end_date}.xlsx`);
    };

    const formatUSD = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value || 0);
    };

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
                        font-size: 12px !important;
                    }
                    .print-container .stats-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 15px !important;
                    }
                    .print-container .stats-card {
                        padding: 15px !important;
                        border: 1px solid #e2e8f0 !important;
                    }

                    .print-container .stats-grid > div{
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }

                    .print-container .detail-section > div {
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 0 !important;
                    }
                }
            `}} />

            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{rt("Income Statement Dashboard")}</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">{rt("Review revenue, costs, and bottom-line profitability")}</p>
                </div>

                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-slate-600 dark:text-slate-300">{rt("Start Date")}</label>
                            <DatePicker
                                className="w-full date-picker"
                                value={dayjs(dates.start_date)}
                                onChange={(date) => setDates(prev => ({ ...prev, start_date: date ? date.format('YYYY-MM-DD') : '' }))}
                                allowClear={false}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-slate-600 dark:text-slate-300">{rt("End Date")}</label>
                            <DatePicker
                                className="w-full date-picker"
                                value={dayjs(dates.end_date)}
                                onChange={(date) => setDates(prev => ({ ...prev, end_date: date ? date.format('YYYY-MM-DD') : '' }))}
                                allowClear={false}
                            />
                        </div>

                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-10"
                        >
                            <FiFilter size={16} />
                            {isFetching ? rt('Loading...') : rt('Get Report')}
                        </button>

                        <button
                            onClick={exportToExcel}
                            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-md hover:bg-emerald-700 h-10"
                        >
                            <FiDownload size={16} />
                            {rt('Export Excel')}
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
                            <h1 className="text-xl font-bold text-blue-600">{rt("Income Statement")}</h1>
                            <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    <ul className="px-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-6">
                        <li>{rt("Start Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{dates.start_date || rt('All')}</span></li>
                        <li>{rt("End Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{dates.end_date || rt('All')}</span></li>
                    </ul>

                    {reportData && !isLoading && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stats-grid">
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-4 border-blue-500 stats-card">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Total Revenue")}</p>
                                    <p className="text-lg font-bold mt-1 text-blue-600">{formatUSD(reportData.revenue)}</p>
                                    <p className="text-slate-400 text-[9px] mt-1">{rt("Gross Sales Receipts")}</p>
                                </div>
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-4 border-amber-500 stats-card">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Cost of Goods Sold")}</p>
                                    <p className="text-lg font-bold mt-1 text-amber-600">{formatUSD(reportData.total_cost)}</p>
                                    <p className="text-slate-400 text-[9px] mt-1">{rt("Incl. Waste Costs")}</p>
                                </div>
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-4 border-emerald-500 stats-card">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Gross Profit")}</p>
                                    <p className="text-lg font-bold mt-1 text-emerald-600">{formatUSD(reportData.cross_profit)}</p>
                                    <p className="text-slate-400 text-[9px] mt-1">{rt("Revenue minus COGS")}</p>
                                </div>
                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-4 border-rose-500 stats-card">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">{rt("Net Profit")}</p>
                                    <p className={`text-lg font-bold mt-1 ${reportData.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatUSD(reportData.net_profit)}
                                    </p>
                                    <p className="text-slate-400 text-[9px] mt-1">{rt("Final Bottom Line")}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 detail-section">
                                <div className="lg:col-span-2 bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                                    <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-6 border-b pb-4">
                                        {rt("Profit & Loss Breakdown")}
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                                    <FiDollarSign size={14} />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{rt("Sales Revenue")}</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{formatUSD(reportData.revenue)}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                                                    <FiPieChart size={14} />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{rt("Cost of Goods Sold (COGS)")}</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{formatUSD(reportData.total_cogs)}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 text-rose-500">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                                    <FiTrendingDown size={14} />
                                                </div>
                                                <span className="text-xs font-medium italic">{rt("Less: Waste Costs")}</span>
                                            </div>
                                            <span className="text-sm font-bold">({formatUSD(reportData.total_wc)})</span>
                                        </div>

                                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase">{rt("Gross Profit")}</span>
                                            <span className="text-lg font-black text-emerald-600">{formatUSD(reportData.cross_profit)}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 mt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900/20 flex items-center justify-center text-slate-600">
                                                    <FiTrendingUp size={14} />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{rt("Operating Expenses")}</span>
                                            </div>
                                            <span className="text-sm font-bold text-rose-500">{formatUSD(reportData.expense_cost)}</span>
                                        </div>

                                        <div className="mt-8 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-5 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{rt("Net Income")}</span>
                                                <span className="text-base font-black text-slate-900 dark:text-white uppercase">{rt("Net Profit")}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-black ${reportData.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {formatUSD(reportData.net_profit)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 stats-card flex flex-col">
                                    <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-4">
                                        {rt("Financial Insights")}
                                    </h2>

                                    <div className={`rounded-lg border p-4 ${reportData.net_profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50'} mb-4`}>
                                        <div className="flex items-center gap-2">
                                            {reportData.net_profit >= 0 ? (
                                                <FiTrendingUp className="text-emerald-600" />
                                            ) : (
                                                <FiAlertTriangle className="text-rose-600" />
                                            )}
                                            <span className={`text-xs font-bold ${reportData.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {reportData.net_profit >= 0 ? rt("Profitable Operation") : rt("Net Loss Detected")}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                                            {reportData.net_profit >= 0 
                                                ? rt("The business is generating positive returns after all costs and expenses for the selected period.")
                                                : rt("Current operating costs and COGS exceed total revenue. Review expenses and sales strategy.")}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <p className="text-[9px] uppercase tracking-wide text-slate-400 mb-1">{rt("Margin")}</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {reportData.revenue > 0 ? ((reportData.net_profit / reportData.revenue) * 100).toFixed(1) : 0}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase tracking-wide text-slate-400 mb-1">{rt("Expense Ratio")}</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {reportData.revenue > 0 ? ((reportData.expense_cost / reportData.revenue) * 100).toFixed(1) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer Signatures for Print */}
                            <div className="hidden print:grid grid-cols-2 gap-16 mt-20 pt-10">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{rt("Verified By")}</p>
                                    <div className="w-48 border-b-2 border-slate-200 mt-8 mb-2"></div>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{rt("Finance Manager")}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{rt("Authorized Signature")}</p>
                                    <div className="w-48 border-b-2 border-slate-200 mt-8 mb-2 ml-auto"></div>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{rt("Date")}: {dayjs().format('YYYY-MM-DD')}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {!reportData && !isLoading && (
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                        <FiAlertTriangle size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{rt("No Report Generated")}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{rt("Use the filters above to generate an income statement report")}</p>
                    </div>
                )}

                {isLoading && (
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-400">{rt("Generating report...")}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomeStatement;
