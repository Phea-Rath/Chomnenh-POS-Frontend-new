import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter, FiCalendar } from 'react-icons/fi';
import { useGetPurchaseByUserReportMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllSupplierQuery } from '../../../app/Features/suppliesSlice';

const PurchaseReportByUser = () => {
    const token = localStorage.getItem('token');
    const [getPurchaseByUser, { isLoading }] = useGetPurchaseByUserReportMutation();
    const [formData, setFormData] = useState({
        created_by: '',
        supplier_id: '',
        start_date: '',
        end_date: ''
    });
    const [users, setUsers] = useState([]);
    const { data } = useGetAllUserQuery(token);
    const tableRef = useRef();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { data: suppliers } = useGetAllSupplierQuery(token);

    useEffect(() => {
        setUsers(data?.data);
    }, [data]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGetReport = async () => {
        try {
            setLoading(true);
            const res = await getPurchaseByUser({ itemData: formData, token });
            if (res.data.status === 200) {
                setReportData(res.data.data);
                setLoading(false);
                toast.success('Purchase report generated successfully');
            } else {
                toast.error('Failed to generate purchase report');
            }
        } catch (error) {
            toast.error(error?.message || 'An error occurred while generating the report');
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PurchaseReport");
        XLSX.writeFile(wb, "PurchaseReport.xlsx");
    };

    const handlePrint = () => {
        if (!tableRef.current) return;
        const printContents = tableRef.current.innerHTML;
        const win = window.open('', '', 'height=700,width=1000');
        win.document.write('<html><head><title>Purchase Report</title>');
        win.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">');
        win.document.write('</head><body>');
        win.document.write(printContents);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 500);
    };

    const totals = reportData
        ? reportData.reduce(
            (acc, item) => ({
                shipping_fee: acc.shipping_fee + (Number(item.shipping_fee) || 0),
                tax_amount: acc.tax_amount + (Number(item.tax_amount) || 0),
                total_amount: acc.total_amount + (Number(item.total_amount) || 0),
                total_paid: acc.total_paid + (Number(item.total_paid) || 0),
                balance: acc.balance + (Number(item.balance) || 0),
            }),
            {
                shipping_fee: 0,
                tax_amount: 0,
                total_amount: 0,
                total_paid: 0,
                balance: 0,
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
        <div className="min-h-screen bg-gray-50 p-1 md:p-3">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 ml-2">
                    <h1 className="text-3xl font-bold text-gray-900">Purchase Report By User</h1>
                    <p className="text-gray-600 mt-2">Generate and export purchase reports by user</p>
                </div>

                {/* Filter Form */}
                <div className="bg-white rounded-lg text-xs shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                User
                            </label>
                            <select
                                name="created_by"
                                value={formData.created_by}
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
                                Supplier
                            </label>
                            <select
                                name="supplier_id"
                                value={formData.supplier_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Supplier</option>
                                {suppliers?.data?.map((sup) => (
                                    <option key={sup.supplier_id} value={sup.supplier_id}>
                                        {sup.supplier_name}
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
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiFilter size={18} />
                            {loading ? 'Loading...' : 'Get Report'}
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
                                Export Excel
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 print:hidden"
                            >
                                <FiPrinter size={18} />
                                Print
                            </button>
                        </div>

                        {/* Report Table */}
                        <div className="overflow-x-auto" ref={tableRef}>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            barcode
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Supplier Tel
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Purchase Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Shipping Fee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tax Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Paid
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData?.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 !text-xs">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {item.barcode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.supplier_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.supplier_tel}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {new Date(item.purchase_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.created_by}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatCurrency(item.shipping_fee)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatCurrency(item.tax_amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                                                {formatCurrency(item.total_amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-blue-500">
                                                {formatCurrency(item.total_paid)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">
                                                {formatCurrency(item.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Row Totals */}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="px-6 py-4 text-right" colSpan={5}>Total</td>
                                        <td className="px-6 py-4">{formatCurrency(totals.shipping_fee)}</td>
                                        <td className="px-6 py-4">{formatCurrency(totals.tax_amount)}</td>
                                        <td className="px-6 py-4 text-green-600">{formatCurrency(totals.total_amount)}</td>
                                        <td className="px-6 py-4 text-blue-600">{formatCurrency(totals.total_paid)}</td>
                                        <td className="px-6 py-4 text-red-600">{formatCurrency(totals.balance)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            {reportData?.length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className="font-medium text-gray-700">Total Purchases: </span>
                                            <span className="text-gray-600">{reportData.length}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Total Amount: </span>
                                            <span className="text-green-600 font-medium">
                                                {formatCurrency(totals.total_amount)}
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
                        <p className="text-gray-500">Use the filters above to generate a purchase report</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Generating report...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseReportByUser;