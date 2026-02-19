import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter, FiCalendar } from 'react-icons/fi';
import { useGetPurchaseByItemReportMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllSupplierQuery } from '../../../app/Features/suppliesSlice';
import { useGetAllItemsQuery } from '../../../app/Features/itemsSlice';
import { useReactToPrint } from 'react-to-print';
import { useGetAllRawMaterialQuery } from '../../../app/Features/RawMaterialSlice';

const PurchaseReportByItem = () => {
    const token = localStorage.getItem('token');
    const [getPurchaseByItem] = useGetPurchaseByItemReportMutation();
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: raws } = useGetAllRawMaterialQuery({ token, limit: 1000, page: 1, search: '' });
    const [formData, setFormData] = useState({
        created_by: '',
        username: '',
        supplier_id: '',
        supplier_name: '',
        item_type: 0,
        item_id: '',
        item_name: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today)
    });
    const [rawData, setRawData] = useState([]);
    const [users, setUsers] = useState([]);
    const [suppliersData, setSuppliersData] = useState([]);
    const [items, setItems] = useState([]);
    const { data: userData } = useGetAllUserQuery(token);
    const { data: supplierData } = useGetAllSupplierQuery(token);
    const { data: itemData } = useGetAllItemsQuery({ token, limit: 1000, page: 1, search: '' });
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
            setSuppliersData(supplierData.data);
        }
    }, [supplierData]);

    useEffect(() => {
        if (itemData?.data) {
            setItems(itemData.data);
        }
        if (raws?.data?.data?.length > 0) {
            setRawData(raws?.data?.data);

        }
    }, [itemData, raws]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'created_by') {
                const selected = users.find((u) => String(u.id) === String(value));
                next.username = selected?.username || '';
            }

            if (name === 'supplier_id') {
                const selected = suppliersData.find(
                    (s) => String(s.supplier_id) === String(value)
                );
                next.supplier_name = selected?.supplier_name || '';
            }

            if (name === 'item_id') {
                const selected = items.find(
                    (item) => String(item.item_id ?? item.id) === String(value)
                );
                next.item_name = selected?.item_name ?? selected?.name ?? '';
            }
            if (name === 'item_type') {
                const selected = items.find(
                    (item) => String(item.item_type ?? item.type) === String(value)
                );
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
            const res = await getPurchaseByItem({ itemData: formData, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || []);
            } else {
                toast.error('Failed to generate purchase report');
            }
        } catch (error) {
            toast.error(error?.message || 'An error occurred while generating the report');
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
        XLSX.utils.book_append_sheet(wb, ws, "PurchaseReportByItem");
        XLSX.writeFile(wb, "PurchaseReportByItem.xlsx");
    };

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        contentRef: reportRef,
    });

    const totals = reportData
        ? reportData.reduce(
            (acc, item) => ({
                quantity: acc.quantity + (Number(item.quantity) || 0),
                item_price: acc.item_price + (Number(item.item_price) || 0),
                subtotal: acc.subtotal + (Number(item.subtotal) || 0),
                shipping_fee: acc.shipping_fee + (Number(item.shipping_fee) || 0),
                tax_amount: acc.tax_amount + (Number(item.tax_amount) || 0),
                total_amount: acc.total_amount + (Number(item.total_amount) || 0),
                total_paid: acc.total_paid + (Number(item.total_paid) || 0),
                balance: acc.balance + (Number(item.balance) || 0),
            }),
            {
                quantity: 0,
                item_price: 0,
                subtotal: 0,
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
        <div className="min-h-screen bg-transparent p-1 md:p-3">
            <div className=" mx-auto">
                {/* Header */}
                <div className="mb-8 ml-2">
                    <h1 className="text-3xl font-bold text-gray-900">Purchase Report By Item</h1>
                    <p className="text-gray-600 mt-2">Generate and export purchase reports by item</p>
                </div>

                {/* Filter Form */}
                <div className="bg-white rounded-lg shadow-md p-6 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block font-medium text-gray-700 mb-2">
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
                            <label className="block font-medium text-gray-700 mb-2">
                                Supplier
                            </label>
                            <select
                                name="supplier_id"
                                value={formData.supplier_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Supplier</option>
                                {suppliersData?.map((sup) => (
                                    <option key={sup.supplier_id} value={sup.supplier_id}>
                                        {sup.supplier_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block font-medium text-gray-700 mb-2">
                                Item Type
                            </label>
                            <select
                                name="item_type"
                                value={formData.item_type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={0}>Products</option>
                                <option value={1}>Raw Materials</option>

                            </select>
                        </div>
                        {formData.item_type == 0 ? <div>
                            <label className="block font-medium text-gray-700 mb-2">
                                Product
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
                        </div> :
                            <div>
                                <label className="block font-medium text-gray-700 mb-2">
                                    Raw Material
                                </label>
                                <select
                                    name="item_id"
                                    value={formData.item_id}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Items</option>
                                    {rawData?.map((item) => (
                                        <option key={item.id ?? item.id} value={item.id ?? item.id}>
                                            {item.material_name ?? item.name} ({item.material_code})
                                        </option>
                                    ))}
                                </select>
                            </div>}

                        <div>
                            <label className="block font-medium text-gray-700 mb-2">
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
                            <label className="block font-medium text-gray-700 mb-2">
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
                        <div className="overflow-x-auto print:overflow-visible print:p-10" ref={reportRef}>
                            <ul className='px-5 flex justify-between text-left text-xs font-medium mb-5 text-gray-500 uppercase tracking-wider'>
                                <li>User: <span className='font-bold'>{formData?.username || 'All'}</span></li>
                                <li>Supplier: <span className='font-bold'>{formData?.supplier_name || 'All'}</span></li>
                                <li>Item: <span className='font-bold'>{formData?.item_name || 'All'}</span></li>
                                <li>Item Type: <span className='font-bold'>{formData?.item_type == 0 ? 'Products' : 'Raw Materials'}</span></li>
                                <li>Start Date: <span className='font-bold'>{formData.start_date || 'All'}</span></li>
                                <li>End Date: <span className='font-bold'>{formData.end_date || 'All'}</span></li>
                            </ul>
                            <table className="min-w-full border-collapse border border-gray-400">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Item Code
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Item Name
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Brand
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unit Price
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tax Amount
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Shipping Fee
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Paid
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
                                                {item.barcode}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.item_name}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.category_name}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.brand_name}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {item.quantity}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatCurrency(item.item_price)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatCurrency(item.subtotal)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatCurrency(item.tax_amount)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatCurrency(item.shipping_fee)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-green-600">
                                                {formatCurrency(item.total_amount)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-blue-500">
                                                {formatCurrency(item.total_paid)}
                                            </td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-red-600">
                                                {formatCurrency(item.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Row Totals */}
                                    {reportData.length > 0 && (
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="border border-gray-300 px-6 py-4 text-right" colSpan={4}>Total</td>
                                            <td className="border border-gray-300 px-6 py-4">{totals.quantity}</td>
                                            <td className="border border-gray-300 px-6 py-4">{formatCurrency(totals.item_price)}</td>
                                            <td className="border border-gray-300 px-6 py-4">{formatCurrency(totals.subtotal)}</td>
                                            <td className="border border-gray-300 px-6 py-4">{formatCurrency(totals.tax_amount)}</td>
                                            <td className="border border-gray-300 px-6 py-4">{formatCurrency(totals.shipping_fee)}</td>
                                            <td className="border border-gray-300 px-6 py-4 text-green-600">{formatCurrency(totals.total_amount)}</td>
                                            <td className="border border-gray-300 px-6 py-4 text-blue-600">{formatCurrency(totals.total_paid)}</td>
                                            <td className="border border-gray-300 px-6 py-4 text-red-600">{formatCurrency(totals.balance)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {reportData?.length > 0 && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <span className="font-medium text-gray-700">Total Items: </span>
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
                        <p className="text-gray-500">Use the filters above to generate a purchase report by item</p>
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

export default PurchaseReportByItem;
