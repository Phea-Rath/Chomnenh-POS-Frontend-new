import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiPrinter, FiFilter, FiCalendar } from 'react-icons/fi';
import { useGetProductionByItemReportMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllItemsQuery } from '../../../app/Features/itemsSlice';
import { useReactToPrint } from 'react-to-print';
import { useReportText } from './reportText';

const ProductionByItem = () => {
    const { rt } = useReportText();
    const token = localStorage.getItem('token');
    const [getProductionByItemReport] = useGetProductionByItemReportMutation();

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [formData, setFormData] = useState({
        created_by: '',
        username: '',
        item_id: '',
        item_name: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today)
    });

    const [users, setUsers] = useState([]);
    const [items, setItems] = useState([]);
    const { data: userData } = useGetAllUserQuery(token);
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
        if (itemData?.data) {
            setItems(itemData.data);
        }
    }, [itemData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };

            if (name === 'created_by') {
                const selected = users.find((u) => String(u.id) === String(value));
                next.username = selected?.username || '';
            }

            if (name === 'item_id') {
                const selected = items.find((item) => String(item.item_id ?? item.id) === String(value));
                next.item_name = selected?.item_name ?? selected?.name ?? '';
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
            const res = await getProductionByItemReport({ itemData: formData, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || []);
            } else {
                toast.error('Failed to generate production report by item');
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Number(amount) || 0);
    };

    const formatNumber = (value) => {
        const number = Number(value);
        if (Number.isNaN(number)) return '0.00';
        return number.toFixed(2);
    };

    const totals = reportData
        ? reportData.reduce(
            (acc, item) => ({
                quantity: acc.quantity + (Number(item.quantity) || 0),
                total_cost: acc.total_cost + (Number(item.total_cost) || 0),
            }),
            {
                quantity: 0,
                total_cost: 0,
            }
        )
        : {};

    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;

        const exportData = reportData.map((item) => ({
            Barcode: item.barcode,
            Item: item.item_name,
            'Item Code': item.item_code,
            Quantity: formatNumber(item.quantity),
            'Cost Per Unit': Number(item.cost_per_unit) || 0,
            'Total Cost': Number(item.total_cost) || 0,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ProductionByItem');
        XLSX.writeFile(wb, 'ProductionByItem.xlsx');
    };

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        contentRef: reportRef,
    });

    return (
        <div className="report-page min-h-screen bg-transparent p-1 md:p-3">
            <div className="mx-auto">
                <div className="mb-8 ml-2">
                    <h1 className="text-2xl font-bold text-gray-900">{rt("Production Report By Item")}</h1>
                    <p className="text-gray-600 text-md mt-2">{rt("Generate and export production cost by item")}</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 text-xs mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block font-medium text-gray-700 mb-2">User</label>
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
                            <label className="block font-medium text-gray-700 mb-2">Item</label>
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
                        </div>

                        <div>
                            <label className="block font-medium text-gray-700 mb-2">Start Date</label>
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
                            <label className="block font-medium text-gray-700 mb-2">End Date</label>
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
                            {loading ? rt('Loading...') : rt('Get Report')}
                        </button>
                    </div>
                </div>

                {reportData && (
                    <div className="bg-white rounded-lg shadow-md p-6 text-xs">
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

                        <div className="overflow-x-auto print:overflow-visible print:p-10 print:bg-white print:text-black print:shadow-none" ref={reportRef}>
                            <ul className="px-5 flex justify-between text-left text-xs font-medium mb-5 text-gray-500 uppercase tracking-wider">
                                <li>User: <span className="font-bold">{formData?.username || 'All'}</span></li>
                                <li>Item: <span className="font-bold">{formData?.item_name || 'All'}</span></li>
                                <li>Start Date: <span className="font-bold">{formData.start_date || 'All'}</span></li>
                                <li>End Date: <span className="font-bold">{formData.end_date || 'All'}</span></li>
                            </ul>

                            <table className="min-w-full border-collapse border border-gray-400">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Per Unit</th>
                                        <th className="border border-gray-300 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData?.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 !text-xs">
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.barcode}</td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">{item.item_name}</td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">{item.item_code}</td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">{formatNumber(item.quantity)}</td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap text-gray-500">{formatCurrency(item.cost_per_unit)}</td>
                                            <td className="border border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-green-600">{formatCurrency(item.total_cost)}</td>
                                        </tr>
                                    ))}

                                    {reportData.length > 0 && (
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="border border-gray-300 px-6 py-4 text-right" colSpan={3}>Total</td>
                                            <td className="border border-gray-300 px-6 py-4">{formatNumber(totals.quantity)}</td>
                                            <td className="border border-gray-300 px-6 py-4">-</td>
                                            <td className="border border-gray-300 px-6 py-4 text-green-600">{formatCurrency(totals.total_cost)}</td>
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
                                            <span className="font-medium text-gray-700">Total Production Cost: </span>
                                            <span className="text-green-600 font-medium">{formatCurrency(totals.total_cost)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!reportData && !loading && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FiFilter size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{rt("No Report Generated")}</h3>
                        <p className="text-gray-500">{rt("Use the filters above to generate a production report by item")}</p>
                    </div>
                )}

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

export default ProductionByItem;

