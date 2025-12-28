import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter, FiCalendar } from 'react-icons/fi';
import { useGetSaleByItemReportMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllItemsQuery } from '../../../app/Features/itemsSlice';

const SaleReportByItem = () => {
    const token = localStorage.getItem('token');
    const [getSaleByItem, { isLoading: isItemLoading }] = useGetSaleByItemReportMutation();
    const [formData, setFormData] = useState({
        order_customer: '',
        item_id: '',
        start_date: '',
        end_date: ''
    });
    const [users, setUsers] = useState([]);
    const [items, setItems] = useState([]);
    const { data: userData } = useGetAllUserQuery(token);
    const { data: itemData } = useGetAllItemsQuery(token);
    const tableRef = useRef();

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userData?.data) {
            setUsers(userData.data);
        }
    }, [userData]);

    useEffect(() => {
        if (itemData?.data) {
            setItems(itemData.data);
        }
    }, [itemData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGetReport = async () => {
        console.log(formData);

        try {
            setLoading(true);
            const res = await getSaleByItem({ itemData: formData, token });

            console.log(res);
            if (res.data.status === 200) {
                setReportData(res.data.data);
                setLoading(false);
                toast.success('Sales report retrieved successfully');
            } else {
                toast.error('Failed to get sales report');
                setLoading(false);
            }
        } catch (error) {
            toast.error(error?.message || error || 'An error occurred while generating the report');
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SalesReport");
        XLSX.writeFile(wb, "SalesReport.xlsx");
    };

    const handlePrint = () => {
        if (!tableRef.current) return;
        const printContents = tableRef.current.innerHTML;
        const win = window.open('', '', 'height=700,width=1000');
        win.document.write('<html><head><title>Sales Report</title>');
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Calculate totals for item report
    const calculateTotals = () => {
        if (!reportData || reportData.length === 0) return {};

        return reportData.reduce(
            (acc, item) => ({
                quantity: acc.quantity + (Number(item.quantity) || 0),
                item_price: acc.item_price + (Number(item.item_price) || 0),
                price: acc.price + (Number(item.price) || 0),
                order_discount: acc.order_discount + (Number(item.order_discount) || 0),
            }),
            {
                quantity: 0,
                item_price: 0,
                price: 0,
                order_discount: 0,
            }
        );
    };

    const totals = calculateTotals();

    return (
        <div className="min-h-screen bg-gray-50 p-1 md:p-3">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 ml-2">
                    <h1 className="text-3xl font-bold text-gray-900">Sales Report By Item</h1>
                    <p className="text-gray-600 mt-2">Generate and export sales reports by item</p>
                </div>

                {/* Filter Form */}
                <div className="bg-white rounded-lg shadow-md p-6 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block  font-medium text-gray-700 mb-2">
                                Customer
                            </label>
                            <select
                                name="order_customer"
                                value={formData.order_customer}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Customers</option>
                                {users?.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block  font-medium text-gray-700 mb-2">
                                Item
                            </label>
                            <select
                                name="item_id"
                                value={formData.item_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Items</option>
                                {items?.map((item) => (
                                    <option key={item.item_id} value={item.item_id}>
                                        {item.item_name} ({item.item_code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block  font-medium text-gray-700 mb-2">
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
                            <label className="block  font-medium text-gray-700 mb-2">
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
                    <div className="bg-white rounded-lg shadow-md p-6 text-xs">
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
                                            Item Code
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Item Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Brand
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Discount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unit Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData?.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap  font-medium text-gray-900">
                                                {item.barcode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {item.item_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {item.category_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {item.brand_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {item.order_customer}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {formatCurrency(item.order_discount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {formatCurrency(item.item_price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  font-medium text-green-600">
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {new Date(item.order_date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Row Totals */}
                                    {reportData.length > 0 && (
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="px-6 py-4 text-right" colSpan={5}>Total</td>
                                            <td className="px-6 py-4">{totals.quantity}</td>
                                            <td className="px-6 py-4">{formatCurrency(totals.item_price)}</td>
                                            <td className="px-6 py-4 text-green-600">{formatCurrency(totals.price)}</td>
                                            <td className="px-6 py-4">{formatCurrency(totals.order_discount)}</td>
                                            <td className="px-6 py-4" colSpan={2}></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {reportData?.length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className=" font-medium text-gray-700">Total Items: </span>
                                            <span className=" text-gray-600">{reportData.length}</span>
                                        </div>
                                        <div>
                                            <span className=" font-medium text-gray-700">Total Sales: </span>
                                            <span className=" text-green-600 font-medium">
                                                {formatCurrency(reportData.reduce((sum, item) => sum + item.price, 0))}
                                            </span>
                                        </div>
                                        <div>
                                            <span className=" font-medium text-gray-700">Total Quantity: </span>
                                            <span className=" text-gray-600 font-medium">
                                                {reportData.reduce((sum, item) => sum + Number(item.quantity), 0)}
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
                        <p className="text-gray-500">Use the filters above to generate a sales report</p>
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

export default SaleReportByItem;