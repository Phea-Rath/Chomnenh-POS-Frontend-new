import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter, FiCalendar } from 'react-icons/fi';
import { useGetSaleByCustomerReportMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllCustomerQuery } from '../../../app/Features/customersSlice';
import { useGetAllItemsQuery } from '../../../app/Features/itemsSlice';
import { useReactToPrint } from 'react-to-print';

const SaleReportByCustomer = () => {
    const token = localStorage.getItem('token');
    const [getSaleByCustomer] = useGetSaleByCustomerReportMutation();
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [formData, setFormData] = useState({
        order_customer: '',
        customer_name: '',
        item_id: '',
        item_name: '',
        user_id: '',
        username: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today)
    });
    const [users, setUsers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const { data: userData } = useGetAllUserQuery(token);
    const { data: customerData } = useGetAllCustomerQuery(token);
    const { data: itemData } = useGetAllItemsQuery({ token, limit: 1000, page: 1, search: '' });
    const tableRef = useRef();

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

    useEffect(() => {
        if (itemData?.data) {
            setItems(itemData.data);
        }
    }, [itemData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = {
                ...prev,
                [name]: value
            };

            if (name === 'order_customer') {
                const selected = customers.find(
                    (c) => String(c.customer_id) === String(value)
                );
                next.customer_name = selected?.customer_name || '';
            }

            if (name === 'item_id') {
                const selected = items.find(
                    (item) => String(item.item_id ?? item.id) === String(value)
                );
                next.item_name = selected?.item_name ?? selected?.name ?? '';
            }

            if (name === 'user_id') {
                const selected = users.find((u) => String(u.id) === String(value));
                next.username = selected?.username || '';
            }

            return next;
        });
    };

    useEffect(() => {
        fetchReport();
    }, []);

    async function fetchReport() {
        try {
            setLoading(true);
            const res = await getSaleByCustomer({ itemData: formData, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || []);
                // toast.success('sale report get successfully');
            } else {
                toast.error('Failed to get sale report');
            }
        } catch (error) {
            toast.error(error?.message || error || 'An error occurred while creating the menu');
        } finally {
            setLoading(false);
        }
    }

    const handleGetReport = async () => {
        await fetchReport();
    };

    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SalesReport");
        XLSX.writeFile(wb, "SalesReport.xlsx");
    };

    const handlePrint = useReactToPrint({
        content: () => tableRef.current,
        contentRef: tableRef,
    });


    const totals = reportData
        ? reportData.reduce(
            (acc, item) => ({
                order_subtotal: acc.order_subtotal + (Number(item.order_subtotal) || 0),
                order_discount: acc.order_discount + (Number(item.order_discount) || 0),
                delivery_fee: acc.delivery_fee + (Number(item.delivery_fee) || 0),
                order_total: acc.order_total + (Number(item.order_total) || 0),
                payment: acc.payment + (Number(item.payment) || 0),
                balance: acc.balance + (Number(item.balance) || 0),
            }),
            {
                order_subtotal: 0,
                order_discount: 0,
                delivery_fee: 0,
                order_total: 0,
                payment: 0,
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
        <div className="min-h-screen bg-transparent p-1 md:p-3">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 ml-2">
                    <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
                    <p className="text-gray-600 mt-2">Generate and export sales reports</p>
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
                                <option value={1}>Unknown</option>
                                {customers?.map((c) => (
                                    <option key={c.customer_id} value={c.customer_id}>
                                        {c.customer_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* <div>
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
                                    <option key={item.item_id ?? item.id} value={item.item_id ?? item.id}>
                                        {item.item_name ?? item.name} ({item.barcode})
                                    </option>
                                ))}
                            </select>
                        </div> */}
                        <div>
                            <label className="block  font-medium text-gray-700 mb-2">
                                User
                            </label>
                            <select
                                name="user_id"
                                value={formData.user_id}
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
                        <div className="overflow-x-auto print:overflow-visible print:p-10" ref={tableRef}>
                            <ul className='px-5 flex justify-between text-left text-xs font-medium mb-5 text-gray-500 uppercase tracking-wider'>
                                <li>User:   <span className='font-bold'>{formData?.username || 'All'}</span></li>
                                <li>Customer:   <span className='font-bold'>{formData?.customer_name || 'All'}</span></li>
                                {/* <li>Item:   <span className='font-bold'>{formData?.item_name || 'All'}</span></li> */}
                                <li>Start Date:     <span className='font-bold'>{formData.start_date || 'All'}</span></li>
                                <li>End Date:   <span className='font-bold'>{formData.end_date || 'All'}</span></li>
                            </ul>
                            <table className="min-w-full border-collapse border border-gray-400">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order No
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Discount
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Delivery
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData?.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 !text-xs">
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {item.order_no}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {item.order_tel}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {new Date(item.order_date).toLocaleDateString()}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {item.order_customer}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {formatCurrency(item.order_subtotal)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {formatCurrency(item.order_discount)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  text-gray-500">
                                                {formatCurrency(item.delivery_fee)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  font-medium text-green-600">
                                                {formatCurrency(item.order_total)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  text-blue-500">
                                                {formatCurrency(parseFloat(item.payment))}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap  font-medium text-red-600">
                                                {formatCurrency(parseFloat(item.balance))}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Row Totals */}
                                    <tr className="bg-gray-100 font-bold">
                                        <td className="border border-gray-300 px-6 py-4 text-right" colSpan={4}>Total</td>
                                        <td className="border border-gray-300 px-6 py-4">{formatCurrency(totals.order_subtotal)}</td>
                                        <td className="border border-gray-300 px-6 py-4">{formatCurrency(totals.order_discount)}</td>
                                        <td className="border border-gray-300 px-6 py-4">{formatCurrency(totals.delivery_fee)}</td>
                                        <td className="border border-gray-300 px-6 py-4 text-green-600">{formatCurrency(totals.order_total)}</td>
                                        <td className="border border-gray-300 px-6 py-4 text-blue-600">{formatCurrency(totals.payment)}</td>
                                        <td className="border border-gray-300 px-6 py-4 text-red-600">{formatCurrency(totals.balance)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            {reportData?.length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className=" font-medium text-gray-700">Total Orders: </span>
                                            <span className=" text-gray-600">{reportData.length}</span>
                                        </div>
                                        <div>
                                            <span className=" font-medium text-gray-700">Total Amount: </span>
                                            <span className=" text-green-600 font-medium">
                                                {formatCurrency(reportData.reduce((sum, item) => sum + (Number(item.order_total) || 0), 0))}
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

export default SaleReportByCustomer;
