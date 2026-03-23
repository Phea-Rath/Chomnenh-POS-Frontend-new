import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter, FiCalendar } from 'react-icons/fi';
import { useGetARReportMutation } from '../../../app/Features/reportsSlice';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllCustomerQuery } from '../../../app/Features/customersSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

const EMPTY_REPORT = {
    summary: [],
    total: '0.00',
    total_paid: '0.00',
    total_balance: '0.00',
    total_kh: '0.00',
    total_paid_kh: '0.00',
    total_balance_kh: '0.00'
};

const ARReport = () => {
    const token = localStorage.getItem('token');
    const [getARReport] = useGetARReportMutation();

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
        customer_id: '',
        customer_name: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today)
    });

    const [users, setUsers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const { data: userData } = useGetAllUserQuery(token);
    const { data: customerData } = useGetAllCustomerQuery(token);

    const reportRef = useRef();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userData?.data) {
            setUsers(userData.data);
        }
    }, [userData]);

    useEffect(() => {
        if (customerData?.data) {
            setCustomers(customerData.data);
        }
    }, [customerData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'user_id') {
                const selected = users.find((u) => String(u.id) === String(value));
                next.username = selected?.username || '';
            }

            if (name === 'customer_id') {
                const selected = customers.find((c) => String(c.customer_id) === String(value));
                next.customer_name = selected?.customer_name || '';
            }

            return next;
        });
    };

    async function fetchReport(payload = formData) {
        try {
            setLoading(true);
            const res = await getARReport({ itemData: payload, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || EMPTY_REPORT);
            } else {
                toast.error('Failed to generate account receivables report');
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
            'Order No': row.order_no,
            Customer: row.customer_name,
            'Customer Tel': row.customer_tel,
            'Order Date': row.order_date,
            'Created By': row.created_by_name,
            Total: row.total,
            Paid: row.paid,
            Balance: row.balance,
            'Total (KHR)': row.total_kh,
            'Paid (KHR)': row.paid_kh,
            'Balance (KHR)': row.balance_kh
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ARReport');
        XLSX.writeFile(wb, 'ARReport.xlsx');
    };

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        contentRef: reportRef,
    });

    return (
        <div className="min-h-screen bg-transparent p-2 md:p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Account Receivables Report</h1>
                    <p className="text-slate-500 text-sm mt-1">Track customers, balances, and collections</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block font-medium text-slate-600 mb-2">User</label>
                            <select
                                name="user_id"
                                value={formData.user_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Users</option>
                                {users?.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-medium text-slate-600 mb-2">Customer</label>
                            <select
                                name="customer_id"
                                value={formData.customer_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Customers</option>
                                {customers?.map((customer) => (
                                    <option key={customer.customer_id} value={customer.customer_id}>
                                        {customer.customer_name}
                                    </option>
                                ))}
                            </select>
                        </div>

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

                        <button
                            onClick={handleGetReport}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiFilter size={16} />
                            {loading ? 'Loading...' : 'Get Report'}
                        </button>
                    </div>
                </div>

                {reportData && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                                <p className="text-slate-500">Total Amount</p>
                                <p className="text-lg font-semibold text-slate-900">{formatUSD(totals.total)}</p>
                                <p className="text-slate-400 text-xs mt-1">{formatKHR(totals.total_kh)}</p>
                            </div>
                            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                                <p className="text-slate-500">Total Received</p>
                                <p className="text-lg font-semibold text-emerald-600">{formatUSD(totals.total_paid)}</p>
                                <p className="text-slate-400 text-xs mt-1">{formatKHR(totals.total_paid_kh)}</p>
                            </div>
                            <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
                                <p className="text-slate-500">Total Receivable</p>
                                <p className="text-lg font-semibold text-rose-600">{formatUSD(totals.total_balance)}</p>
                                <p className="text-slate-400 text-xs mt-1">{formatKHR(totals.total_balance_kh)}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mb-4">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
                            >
                                <FiDownload size={16} />
                                Export Excel
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 print:hidden"
                            >
                                <FiPrinter size={16} />
                                Print
                            </button>
                        </div>

                        <div className="overflow-x-auto print:overflow-visible print:p-10 print:bg-white print:text-black print:shadow-none" ref={reportRef}>
                            <ul className="px-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
                                <li>User: <span className="font-semibold text-slate-700">{formData.username || 'All'}</span></li>
                                <li>Customer: <span className="font-semibold text-slate-700">{formData.customer_name || 'All'}</span></li>
                                <li>Start: <span className="font-semibold text-slate-700">{formData.start_date || 'All'}</span></li>
                                <li>End: <span className="font-semibold text-slate-700">{formData.end_date || 'All'}</span></li>
                            </ul>

                            <table className="min-w-full border-collapse border border-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="border border-slate-200 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order No</th>
                                        <th className="border border-slate-200 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                                        <th className="border border-slate-200 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer Tel</th>
                                        <th className="border border-slate-200 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order Date</th>
                                        <th className="border border-slate-200 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created By</th>
                                        <th className="border border-slate-200 px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                        <th className="border border-slate-200 px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Paid</th>
                                        <th className="border border-slate-200 px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {(reportData.summary || []).map((row, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="border border-slate-200 px-4 py-3 font-medium text-slate-900">{row.order_no}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-slate-600">{row.customer_name}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-slate-600">{row.customer_tel}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-slate-600">{new Date(row.order_date).toLocaleDateString()}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-slate-600">{row.created_by_name}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-right text-slate-700">{formatUSD(row.total)}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-right text-emerald-600">{formatUSD(row.paid)}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-right text-rose-600">{formatUSD(row.balance)}</td>
                                        </tr>
                                    ))}
                                    {(reportData.summary || []).length > 0 && (
                                        <tr className="bg-slate-50 font-semibold">
                                            <td className="border border-slate-200 px-4 py-3 text-right" colSpan={5}>Total</td>
                                            <td className="border border-slate-200 px-4 py-3 text-right text-slate-800">{formatUSD(totals.total)}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-right text-emerald-600">{formatUSD(totals.total_paid)}</td>
                                            <td className="border border-slate-200 px-4 py-3 text-right text-rose-600">{formatUSD(totals.total_balance)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {(reportData.summary || []).length > 0 && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <span className="font-medium text-slate-600">Total Orders: </span>
                                            <span className="text-slate-700">{reportData.summary.length}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-600">Collected: </span>
                                            <span className="text-emerald-600 font-medium">{formatUSD(totals.total_paid)}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-600">Receivable: </span>
                                            <span className="text-rose-600 font-medium">{formatUSD(totals.total_balance)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!reportData && !loading && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
                        <FiFilter size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No Report Generated</h3>
                        <p className="text-slate-500">Use the filters above to generate an account receivables report</p>
                    </div>
                )}

                {loading && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Generating report...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ARReport;
