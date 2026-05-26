import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter } from 'react-icons/fi';
import { useGetExpanseReportMutation } from '../../../app/Features/reportsSlice';
import { useGetAllUserQuery, useGetUserLoginQuery } from '../../../app/Features/usersSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { useGetAllExpanseTypesQuery } from '../../../app/Features/expenseTypesSlice';
import { useReportText } from './reportText';
import RichSearch from '../../utils/RichSearch';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const ExpenseReportByUser = () => {
    const { rt } = useReportText();
    const token = localStorage.getItem('token');
    const [getExpense] = useGetExpanseReportMutation();
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
        expense_by: '',
        username: '',
        expense_type_id: '',
        expense_type_name: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today)
    });

    const [users, setUsers] = useState([]);
    const [expenseTypes, setExpanseTypes] = useState([]);
    const { data: userData } = useGetAllUserQuery(token);
    const { data: expenseTypeData } = useGetAllExpanseTypesQuery(token);

    const reportRef = useRef();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userData?.data) {
            setUsers(userData.data);
        }
    }, [userData]);

    useEffect(() => {
        if (expenseTypeData?.data) {
            setExpanseTypes(expenseTypeData.data);
        }
    }, [expenseTypeData]);

    const handleFieldChange = (name, value) => {
        setFormData((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'expense_by') {
                const selected = users.find((u) => String(u.id) === String(value));
                next.username = selected?.username || '';
            }

            if (name === 'expense_type_id') {
                const selected = expenseTypes.find(
                    (type) => String(type.expense_type_id) === String(value)
                );
                next.expense_type_name = selected?.expense_type_name || '';
            }

            return next;
        });
    };

    async function fetchReport(payload = formData) {
        try {
            setLoading(true);
            const res = await getExpense({ itemData: payload, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || []);
            } else {
                toast.error('Failed to generate expense report');
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

    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ExpenseReport");
        XLSX.writeFile(wb, "ExpenseReport.xlsx");
    };

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        contentRef: reportRef,
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const totals = useMemo(() => {
        if (!reportData || reportData.length === 0) return {
            quantity: 0,
            sub_total: 0,
            unit_price: 0,
        };

        return reportData.reduce(
            (acc, item) => ({
                quantity: acc.quantity + (Number(item.quantity) || 0),
                sub_total: acc.sub_total + (Number(item.sub_total) || 0),
                unit_price: acc.unit_price + (Number(item.unit_price) || 0),
            }),
            {
                quantity: 0,
                sub_total: 0,
                unit_price: 0,
            }
        );
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{rt("Expense Report")}</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">{rt("Generate and export expense reports by user")}</p>
                </div>

                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">{rt("Expense By")}</label>
                            <RichSearch
                                data={users}
                                keyFields={{ id: 'id', title: 'username' }}
                                onSelected={(id) => handleFieldChange('expense_by', id)}
                                value={formData.expense_by}
                                placeholder={rt("All Users")}
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">{rt("Expense Type")}</label>
                            <RichSearch
                                data={expenseTypes}
                                keyFields={{ id: 'expense_type_id', title: 'expense_type_name' }}
                                onSelected={(id) => handleFieldChange('expense_type_id', id)}
                                value={formData.expense_type_id}
                                placeholder={rt("All Types")}
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
                                    <h1 className="text-xl font-bold text-blue-600">{rt("Expense Report")}</h1>
                                    <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                                </div>
                            </div>

                            <ul className="px-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
                                <li>{rt("Expense By")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.username || rt('All')}</span></li>
                                <li>{rt("Expense Type")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.expense_type_name || rt('All')}</span></li>
                                <li>{rt("Start Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.start_date || rt('All')}</span></li>
                                <li>{rt("End Date")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formData.end_date || rt('All')}</span></li>
                            </ul>

                            <table className="min-w-full border-collapse border border-slate-200 dark:border-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Expense No")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Expense Date")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Expense By")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Supplier")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Expense Type")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Quantity")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Unit Price")}</th>
                                        <th className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{rt("Subtotal")}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                    {reportData?.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.expense_no}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(item.expense_date).toLocaleDateString()}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400">{item.expense_by}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400">{item.expense_supplier}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400">{item.expense_type_name}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unit_price)}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(item.sub_total)}</td>
                                        </tr>
                                    ))}
                                    {reportData.length > 0 && (
                                        <tr className="bg-slate-50 dark:bg-slate-800 font-semibold">
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-slate-900 dark:text-slate-100" colSpan={5}>{rt("Total")}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-slate-800 dark:text-slate-200">{totals.quantity}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-slate-800 dark:text-slate-200">{formatCurrency(totals.unit_price)}</td>
                                            <td className="border border-slate-200 dark:border-slate-700 px-4 py-3 text-right text-emerald-600">{formatCurrency(totals.sub_total)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {reportData?.length > 0 && (
                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-medium text-slate-600 dark:text-slate-400">{rt("Total Expenses: ")}</span>
                                            <span className="text-slate-700 dark:text-slate-200">{reportData.length}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-600 dark:text-slate-400">{rt("Total Amount: ")}</span>
                                            <span className="text-emerald-600 font-medium">{formatCurrency(totals.sub_total)}</span>
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
                        <p className="text-slate-500 dark:text-slate-400">{rt("Use the filters above to generate an expense report")}</p>
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

export default ExpenseReportByUser;
