import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter } from 'react-icons/fi';
import { useGetAPReportMutation } from '../../../app/Features/reportsSlice';
import { useGetAllUserQuery, useGetUserLoginQuery } from '../../../app/Features/usersSlice';
import { useGetAllSupplierQuery } from '../../../app/Features/suppliesSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { useReportText } from './reportText';
import RichSearch from '../../utils/RichSearch';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const EMPTY_REPORT = {
    summary: [],
    total: '0.00',
    total_paid: '0.00',
    total_balance: '0.00',
    total_kh: '0.00',
    total_paid_kh: '0.00',
    total_balance_kh: '0.00'
};

const APReport = () => {
    const { rt } = useReportText();
    const token = localStorage.getItem('token');
    const [getAPReport] = useGetAPReportMutation();
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
        user_id: '',
        username: '',
        supplier_id: '',
        supplier_name: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today)
    });

    const [users, setUsers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const { data: userData } = useGetAllUserQuery(token);
    const { data: supplierData } = useGetAllSupplierQuery(token);

    const reportRef = useRef();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userData?.data) {
            setUsers(userData.data);
        }
    }, [userData]);

    useEffect(() => {
        if (supplierData?.data) {
            setSuppliers(supplierData.data);
        }
    }, [supplierData]);

    const handleFieldChange = (name, value) => {
        setFormData((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'user_id') {
                const selected = users.find((u) => String(u.id) === String(value));
                next.username = selected?.username || '';
            }

            if (name === 'supplier_id') {
                const selected = suppliers.find((s) => String(s.supplier_id) === String(value));
                next.supplier_name = selected?.supplier_name || '';
            }

            return next;
        });
    };

    async function fetchReport(payload = formData) {
        try {
            setLoading(true);
            const res = await getAPReport({ itemData: payload, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || EMPTY_REPORT);
            } else {
                toast.error('Failed to generate account payables report');
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

    const formatUSD = (value) => {
        const number = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(number);
    };

    const formatKHR = (value) => {
        const number = Number(value) || 0;
        return `${number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} KHR`;
    };

    const totals = useMemo(() => {
        if (!reportData) return EMPTY_REPORT;
        return {
            total: reportData.total ?? '0.00',
            total_paid: reportData.total_paid ?? '0.00',
            total_balance: reportData.total_balance ?? '0.00',
            total_kh: reportData.total_kh ?? '0.00',
            total_paid_kh: reportData.total_paid_kh ?? '0.00',
            total_balance_kh: reportData.total_balance_kh ?? '0.00'
        };
    }, [reportData]);

    const handleExportExcel = () => {
        const rows = reportData?.summary || [];
        if (!rows.length) return;

        const exportData = rows.map((row) => ({
            'Purchase No': row.purchase_no,
            Supplier: row.supplier_name,
            'Purchase Date': row.purchase_date,
            Total: row.total,
            Paid: row.paid,
            Balance: row.balance,
            'Total (KHR)': row.total_kh,
            'Paid (KHR)': row.paid_kh,
            'Balance (KHR)': row.balance_kh
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'APReport');
        XLSX.writeFile(wb, 'APReport.xlsx');
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
                    .print-container table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    .print-container th, 
                    .print-container td {
                        padding: 4px 6px !important;
                        font-size: 10px !important;
                        border: 1px solid #e2e8f0 !important;
                    }
                    .print-container .print-header {
                        margin-bottom: 15px !important;
                    }
                }
            `}} />
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{rt("Account Payables Report")}</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">{rt("Track suppliers, balances, and payment status")}</p>
                </div>

                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">{rt("User")}</label>
                            <RichSearch
                                data={users}
                                keyFields={{ id: 'id', title: 'username' }}
                                onSelected={(id) => handleFieldChange('user_id', id)}
                                value={formData.user_id}
                                placeholder={rt("All Users")}
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">{rt("Supplier")}</label>
                            <RichSearch
                                data={suppliers}
                                keyFields={{ id: 'supplier_id', title: 'supplier_name' }}
                                onSelected={(id) => handleFieldChange('supplier_id', id)}
                                value={formData.supplier_id}
                                placeholder={rt("All Suppliers")}
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

                {reportData && (
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="rounded-lg border border-blue-100 bg-blue-50 dark:bg-slate-800 dark:border-slate-600 p-4">
                                <p className="text-slate-500 dark:text-slate-400">{rt("Total Amount")}</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatUSD(totals.total)}</p>
                                <p className="text-slate-400 text-xs mt-1 dark:text-slate-500">{formatKHR(totals.total_kh)}</p>
                            </div>
                            <div className="rounded-lg border border-emerald-100 bg-emerald-50 dark:bg-slate-800 dark:border-slate-600 p-4">
                                <p className="text-slate-500 dark:text-slate-400">{rt("Total Paid")}</p>
                                <p className="text-lg font-semibold text-emerald-600">{formatUSD(totals.total_paid)}</p>
                                <p className="text-slate-400 text-xs mt-1 dark:text-slate-500">{formatKHR(totals.total_paid_kh)}</p>
                            </div>
                            <div className="rounded-lg border border-rose-100 bg-rose-50 dark:bg-slate-800 dark:border-slate-600 p-4">
                                <p className="text-slate-500 dark:text-slate-400">{rt("Total Payable")}</p>
                                <p className="text-lg font-semibold text-rose-600">{formatUSD(totals.total_balance)}</p>
                                <p className="text-slate-400 text-xs mt-1 dark:text-slate-500">{formatKHR(totals.total_balance_kh)}</p>
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

                        <div className="overflow-x-auto print:overflow-visible print:p-0 print:bg-white print:text-black print:shadow-none print-container" ref={reportRef}>
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
                                    <h1 className="text-xl font-bold text-blue-600">{rt("Account Payables Report")}</h1>
                                    <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                                </div>
                            </div>

                            <ul className="px-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
                                <li>{rt("User")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.username || rt('All')}</span></li>
                                <li>{rt("Supplier")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.supplier_name || rt('All')}</span></li>
                                <li>{rt("Start")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.start_date || rt('All')}</span></li>
                                <li>{rt("End")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.end_date || rt('All')}</span></li>
                            </ul>

                            <table className="min-w-full border-collapse border border-slate-200 dark:border-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Purchase No")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Supplier")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Purchase Date")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Total")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Paid")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Balance")}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                    {(reportData.summary || []).map((row, index) => (
                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.purchase_no}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400">{row.supplier_name}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(row.purchase_date).toLocaleDateString()}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatUSD(row.total)}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-emerald-600">{formatUSD(row.paid)}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-rose-600">{formatUSD(row.balance)}</td>
                                        </tr>
                                    ))}
                                    {(reportData.summary || []).length > 0 && (
                                        <tr className="bg-slate-50 dark:bg-slate-800 font-semibold">
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-slate-900 dark:text-slate-100" colSpan={3}>{rt("Total")}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-slate-800 dark:text-slate-200">{formatUSD(totals.total)}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-emerald-600">{formatUSD(totals.total_paid)}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-rose-600">{formatUSD(totals.total_balance)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {(reportData.summary || []).length > 0 && (
                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <span className="font-medium text-slate-600 dark:text-slate-400">{rt("Total Purchases: ")}</span>
                                            <span className="text-slate-700 dark:text-slate-200">{reportData.summary.length}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-600 dark:text-slate-400">{rt("Paid: ")}</span>
                                            <span className="text-emerald-600 font-medium">{formatUSD(totals.total_paid)}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-600 dark:text-slate-400">{rt("Payable: ")}</span>
                                            <span className="text-rose-600 font-medium">{formatUSD(totals.total_balance)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!reportData && !loading && (
                    <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 text-center">
                        <FiFilter size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{rt("No Report Generated")}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{rt("Use the filters above to generate an account payables report")}</p>
                    </div>
                )}

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

export default APReport;

