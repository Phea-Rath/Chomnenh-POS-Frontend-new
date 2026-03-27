import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter, FiCalendar } from 'react-icons/fi';
import { useGetExpanseReportMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useReactToPrint } from 'react-to-print';
import { useGetAllExpanseTypesQuery } from '../../../app/Features/expenseTypesSlice';
import { useReportText } from './reportText';

const ExpenseReportByUser = () => {
    const { rt } = useReportText();
    const token = localStorage.getItem('token');
    const [getExpense] = useGetExpanseReportMutation();
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

    const tableRef = useRef();
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = {
                ...prev,
                [name]: value
            };
            if (name === 'expense_by') {
                next.username = value || '';
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

    async function fetchReport() {
        try {
            setLoading(true);
            const res = await getExpense({ itemData: formData, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || []);
                // toast.success('Expense report generated successfully');
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
    }, [])

    const handleGetReport = async () => {
        fetchReport();
    };

    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ExpenseReport");
        XLSX.writeFile(wb, "ExpenseReport.xlsx");
    };

    const handlePrint = useReactToPrint({
        content: () => tableRef.current,
        contentRef: tableRef,
    });

    const totals = reportData
        ? reportData.reduce(
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
        )
        : {};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="report-page min-h-screen bg-transparent p-1 md:p-3">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 ml-2">
                    <h1 className="text-3xl font-bold text-gray-900">{rt("Expense Report")}</h1>
                    <p className="text-gray-600 mt-2">Generate and export expense reports by user</p>
                </div>

                {/* Filter Form */}
                <div className="bg-white rounded-lg text-xs shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expense By
                            </label>
                            <select
                                name="expense_by"
                                value={formData.expense_by}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expense Type By
                            </label>
                            <select
                                name="expense_type_id"
                                value={formData.expense_type_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                {expenseTypes?.map((type) => (
                                    <option key={type.expense_type_id} value={type.expense_type_id}>
                                        {type.expense_type_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleGetReport}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 text-white border border-gray-300 px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiFilter size={18} />
                            {loading ? rt('Loading...') : rt('Get Report')}
                        </button>
                    </div>
                </div>

                {/* Report Actions and Table */}
                {reportData && (
                    <div className="bg-white rounded-lg text-xs shadow-md p-6">
                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mb-6">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                <FiDownload size={18} />
                                {rt('Export Excel')}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 print:hidden"
                            >
                                <FiPrinter size={18} />
                                {rt('Print')}
                            </button>
                        </div>

                        {/* Report Table */}
                        <div className="overflow-x-auto print:overflow-visible print:p-10 print:bg-white print:text-black print:shadow-none" ref={tableRef}>
                            <ul className='px-5 flex justify-between text-left text-xs font-medium mb-5 text-gray-500 uppercase tracking-wider'>
                                <li>User:   <span className='font-bold'>{formData?.username || 'All'}</span></li>
                                <li>Type: <span className='font-bold'>{formData.expense_type_name || 'All'}</span></li>
                                <li>Start Date: <span className='font-bold'>{formData.start_date || 'All'}</span></li>
                                <li>End Date: <span className='font-bold'>{formData.end_date || 'All'}</span></li>
                            </ul>
                            <table className="min-w-full border-collapse border border-gray-400">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expense No
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expense Date
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expense By
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expense Type
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unit Price
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sub Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData?.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 !text-xs">
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {item.expense_no}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {new Date(item.expense_date).toLocaleDateString()}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.expense_by}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.expense_supplier}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.expense_type_name}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.quantity}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-green-600">
                                                {formatCurrency(item.sub_total)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Row Totals */}
                                    {reportData.length > 0 && (
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="border border-gray-300 px-6 py-4 text-right" colSpan={5}>Total</td>
                                            <td className="border border-gray-300 px-6 py-4">{totals.quantity}</td>
                                            <td className="border border-gray-300 px-6 py-4">{formatCurrency(totals.unit_price)}</td>
                                            <td className="border border-gray-300 px-6 py-4 text-green-600">{formatCurrency(totals.sub_total)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {reportData?.length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className="font-medium text-gray-700">Total Expenses: </span>
                                            <span className="text-gray-600">{reportData.length}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Total Amount: </span>
                                            <span className="text-green-600 font-medium">
                                                {formatCurrency(totals.sub_total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!reportData && !loading && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FiFilter size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{rt("No Report Generated")}</h3>
                        <p className="text-gray-500">Use the filters above to generate an expense report</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">{rt("Generating report...")}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseReportByUser;

